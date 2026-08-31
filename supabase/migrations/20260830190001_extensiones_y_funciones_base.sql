-- Extensiones y funciones que el resto del esquema utiliza.
-- Las funciones referencian tablas que se crean en migraciones posteriores
-- (usuarios, configuracion, auditoria, sedes, excepciones_agenda). Postgres
-- no valida esas referencias al crear la función, solo al ejecutarla, así
-- que el orden es seguro siempre que todas las migraciones se apliquen.

create extension if not exists pgcrypto;

-- Mantiene actualizado_en al día en cualquier tabla que lo tenga.
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- Usuario de panel autenticado -> fila de public.usuarios.
-- security definer + search_path fijo: evita que la política RLS de
-- usuarios entre en recursión al llamarse a sí misma.
-- language plpgsql (no sql): la tabla usuarios todavía no existe en esta
-- migración y un cuerpo plpgsql no se valida contra el catálogo hasta que
-- se ejecuta, a diferencia de una función language sql.
create or replace function public.usuario_actual_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.usuarios
  where auth_user_id = auth.uid() and activo = true
  limit 1;
  return v_id;
end;
$$;

create or replace function public.rol_actual()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rol text;
begin
  select rol::text into v_rol from public.usuarios
  where auth_user_id = auth.uid() and activo = true
  limit 1;
  return v_rol;
end;
$$;

create or replace function public.es_staff_activo()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_existe boolean;
begin
  select exists (
    select 1 from public.usuarios
    where auth_user_id = auth.uid() and activo = true
  ) into v_existe;
  return v_existe;
end;
$$;

create or replace function public.es_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.rol_actual() = 'admin';
end;
$$;

-- Trigger genérico de auditoría: se adjunta a cada tabla operativa en su
-- propia migración. Registra el usuario de panel autenticado; si la
-- escritura viene del service role (bot, jobs) usuario_id queda null y el
-- canal se distingue por la fila misma (p. ej. citas.canal).
create or replace function public.fn_registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion public.accion_auditoria_enum;
  v_datos_antes jsonb;
  v_datos_despues jsonb;
begin
  if tg_op = 'INSERT' then
    v_accion := 'crear';
    v_datos_antes := null;
    v_datos_despues := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_accion := 'actualizar';
    v_datos_antes := to_jsonb(old);
    v_datos_despues := to_jsonb(new);
  else
    v_accion := 'eliminar';
    v_datos_antes := to_jsonb(old);
    v_datos_despues := null;
  end if;

  insert into public.auditoria (usuario_id, entidad, entidad_id, accion, datos_antes, datos_despues)
  values (
    public.usuario_actual_id(),
    tg_table_name,
    coalesce((v_datos_despues ->> 'id'), (v_datos_antes ->> 'id')),
    v_accion,
    v_datos_antes,
    v_datos_despues
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Lee una clave de configuracion como jsonb; devuelve el default si no existe.
-- plpgsql por la misma razón que los helpers de arriba: configuracion se
-- crea en una migración posterior.
create or replace function public.obtener_configuracion(p_clave text, p_default jsonb default null)
returns jsonb
language plpgsql
stable
as $$
declare
  v_valor jsonb;
begin
  select valor into v_valor from public.configuracion where clave = p_clave;
  return coalesce(v_valor, p_default);
end;
$$;

-- Suma horas laborables a un timestamp, saltando fuera del horario general
-- de la sede y las excepciones de alcance 'sede' (feriados). Usada por el
-- SLA de 6 horas laborables de las solicitudes en gestión (§4.3, §11.1).
-- Avanza en pasos de 1 minuto dentro del horario abierto; para el volumen
-- de este sistema (~40 citas/día) el costo es insignificante y evita
-- reimplementar aritmética de calendario laboral a mano.
create or replace function public.sumar_horas_laborables(p_desde timestamptz, p_horas numeric, p_sede_id uuid)
returns timestamptz
language plpgsql
stable
as $$
declare
  v_zona text := 'America/Guayaquil';
  v_minutos_restantes numeric := p_horas * 60;
  v_cursor timestamptz := p_desde;
  v_local timestamp;
  v_dow int;
  v_apertura time;
  v_cierre time;
  v_sede record;
  v_cerrado boolean;
  v_paso_min int := 15;
  v_minutos_disponibles_franja numeric;
begin
  select hora_apertura_lv, hora_cierre_lv, hora_apertura_sab, hora_cierre_sab
    into v_sede
    from public.sedes where id = p_sede_id;

  while v_minutos_restantes > 0 loop
    v_local := v_cursor at time zone v_zona;
    v_dow := extract(isodow from v_local); -- 1=lunes .. 7=domingo

    if v_dow = 7 then
      v_apertura := null; v_cierre := null;
    elsif v_dow = 6 then
      v_apertura := v_sede.hora_apertura_sab; v_cierre := v_sede.hora_cierre_sab;
    else
      v_apertura := v_sede.hora_apertura_lv; v_cierre := v_sede.hora_cierre_lv;
    end if;

    v_cerrado := v_apertura is null or v_cierre is null or exists (
      select 1 from public.excepciones_agenda e
      where e.alcance = 'sede'
        and (e.sede_id is null or e.sede_id = p_sede_id)
        and v_local::date between e.fecha_desde and e.fecha_hasta
        and (e.hora_inicio is null or (v_local::time between e.hora_inicio and e.hora_fin))
    );

    if v_cerrado or v_local::time < v_apertura then
      -- saltar al próximo momento de apertura relevante
      if not v_cerrado and v_local::time < v_apertura then
        v_cursor := ((v_local::date)::timestamp + v_apertura) at time zone v_zona;
      else
        v_cursor := ((v_local::date + 1)::timestamp) at time zone v_zona;
      end if;
    elsif v_local::time >= v_cierre then
      v_cursor := ((v_local::date + 1)::timestamp) at time zone v_zona;
    else
      v_minutos_disponibles_franja := extract(epoch from (v_cierre - v_local::time)) / 60;
      if v_minutos_disponibles_franja >= v_minutos_restantes then
        v_cursor := v_cursor + make_interval(mins => v_minutos_restantes::int);
        v_minutos_restantes := 0;
      else
        v_cursor := v_cursor + make_interval(mins => v_minutos_disponibles_franja::int);
        v_minutos_restantes := v_minutos_restantes - v_minutos_disponibles_franja;
      end if;
    end if;
  end loop;

  return v_cursor;
end;
$$;

-- Genera un código público legible por teléfono: RVT-XXXXX, alfabeto sin
-- 0/O/1/I/L/5/S. Reintenta hasta 5 veces ante colisión (§ acuerdo con Luis).
create or replace function public.generar_codigo_publico()
returns text
language plpgsql
as $$
declare
  v_alfabeto text := '2346789ABCDEFGHJKMNPQRTUVWXYZ';
  v_codigo text;
  v_intento int := 0;
  v_i int;
begin
  loop
    v_codigo := '';
    for v_i in 1..5 loop
      v_codigo := v_codigo || substr(v_alfabeto, (floor(random() * length(v_alfabeto)) + 1)::int, 1);
    end loop;
    v_codigo := 'RVT-' || v_codigo;

    exit when not exists (select 1 from public.citas where codigo_publico = v_codigo);

    v_intento := v_intento + 1;
    if v_intento >= 5 then
      raise exception 'No se pudo generar un código público único tras % intentos', v_intento;
    end if;
  end loop;

  return v_codigo;
end;
$$;

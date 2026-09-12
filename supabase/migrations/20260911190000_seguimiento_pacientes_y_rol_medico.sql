-- Activa el rol "medico" (existía en el enum pero sin uso, ver comentario
-- original de usuarios) y agrega el seguimiento del paciente dentro del
-- centro: dónde está físicamente ahora mismo, sin tocar nunca datos
-- clínicos (§18: no hay campo "motivo", esto tampoco lo es).

-- 1. Vínculo login -> médico. Un médico inicia sesión como cualquier
-- usuario, pero necesitamos saber A CUÁL registro clínico corresponde
-- para poder filtrar "mis turnos". Nullable: la mayoría de usuarios
-- (admisionista, admin) nunca tienen médico asociado.
alter table public.usuarios
  add column medico_id uuid references public.medicos(id);

comment on column public.usuarios.medico_id is 'Solo se usa con rol=medico: el registro clínico que corresponde a este login. Un médico no puede cambiarlo por sí mismo (ver trigger de abajo).';

-- Un médico no puede tener dos logins activos suplantándolo, y un login
-- no puede reclamar ser dos médicos a la vez.
create unique index idx_usuarios_medico_id on public.usuarios (medico_id) where medico_id is not null;

-- La política usuarios_update_propio_o_admin ya permite que cualquiera
-- edite su propia fila (celular, correo). Sin este trigger, un usuario
-- con rol medico podría además cambiarse su propio medico_id y ver la
-- agenda de otro doctor. Solo admin puede tocar esta columna.
create or replace function public.trg_fn_usuarios_proteger_medico_id()
returns trigger
language plpgsql
as $$
begin
  if new.medico_id is distinct from old.medico_id and not public.es_admin() then
    raise exception 'Solo un administrador puede vincular un usuario a un médico';
  end if;
  return new;
end;
$$;

create trigger trg_usuarios_proteger_medico_id
  before update on public.usuarios
  for each row execute function public.trg_fn_usuarios_proteger_medico_id();

-- 2. Puntos de atención: configurable desde el panel (regla 1 de
-- CLAUDE.md), no una lista fija en código. Admisión/Sala de
-- espera/Consultorio/Farmacia/Salida vienen precargados, pero el centro
-- puede agregar "Laboratorio" o "Caja" sin desplegar código nuevo.
create table public.puntos_atencion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden smallint not null,
  -- Marca el punto de entrada (llegada al centro) y el de salida
  -- (fin del recorrido). Exactamente uno de cada uno, ver índices abajo.
  es_punto_llegada boolean not null default false,
  es_punto_salida boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index idx_puntos_atencion_llegada_unico on public.puntos_atencion (es_punto_llegada) where es_punto_llegada;
create unique index idx_puntos_atencion_salida_unico on public.puntos_atencion (es_punto_salida) where es_punto_salida;

create trigger trg_puntos_atencion_actualizado_en
  before update on public.puntos_atencion
  for each row execute function public.tocar_actualizado_en();

create trigger trg_puntos_atencion_auditoria
  after insert or update or delete on public.puntos_atencion
  for each row execute function public.fn_registrar_auditoria();

alter table public.puntos_atencion enable row level security;

create policy puntos_atencion_select_staff on public.puntos_atencion
  for select to authenticated using (public.es_staff_activo());

create policy puntos_atencion_all_admin on public.puntos_atencion
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

insert into public.puntos_atencion (nombre, orden, es_punto_llegada, es_punto_salida) values
  ('Admisión', 1, true, false),
  ('Sala de espera', 2, false, false),
  ('Consultorio', 3, false, false),
  ('Farmacia', 4, false, false),
  ('Salida', 5, false, true);

-- 3. Ubicación actual del paciente, denormalizada sobre citas para que el
-- tablero en vivo no tenga que calcular "último evento" con una
-- subconsulta por cada tarjeta.
alter table public.citas
  add column punto_atencion_id uuid references public.puntos_atencion(id),
  add column punto_atencion_desde timestamptz;

create index idx_citas_punto_atencion on public.citas (punto_atencion_id) where punto_atencion_id is not null;

-- 4. Bitácora inmutable del recorrido (regla 3 de CLAUDE.md: nunca se
-- sobreescribe un estado, se agrega un evento). citas.punto_atencion_id
-- es la lectura rápida de "dónde está ahora"; esta tabla es el historial
-- completo de cómo llegó ahí.
create table public.cita_eventos (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas(id),
  punto_id uuid not null references public.puntos_atencion(id),
  creado_en timestamptz not null default now(),
  creado_por uuid references public.usuarios(id)
);

create index idx_cita_eventos_cita on public.cita_eventos (cita_id, creado_en desc);

alter table public.cita_eventos enable row level security;

create policy cita_eventos_select_staff on public.cita_eventos
  for select to authenticated using (public.es_staff_activo());

-- Solo se insertan eventos (bitácora inmutable): sin policy de update ni
-- delete, ni siquiera para admin.
create policy cita_eventos_insert_staff on public.cita_eventos
  for insert to authenticated with check (public.es_staff_activo());

-- Reemplaza sala de espera: mover a un paciente por su recorrido toca
-- citas (ubicación actual, y si corresponde llegada_en/atendida_en) y
-- cita_eventos (bitácora) -- misma razón que gestionar_solicitud: una
-- función en vez de dos llamadas separadas desde la app.
create or replace function public.mover_paciente_punto(p_cita_id uuid, p_punto_id uuid)
returns public.citas
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_cita public.citas;
  v_punto public.puntos_atencion;
begin
  select * into v_cita from public.citas where id = p_cita_id for update;
  if not found then
    raise exception 'Cita no encontrada';
  end if;
  if v_cita.estado not in ('confirmada', 'atendida') then
    raise exception 'Solo se puede mover el recorrido de una cita confirmada o ya atendida';
  end if;

  select * into v_punto from public.puntos_atencion where id = p_punto_id and activo;
  if not found then
    raise exception 'Punto de atención no encontrado o inactivo';
  end if;

  if v_punto.es_punto_llegada and v_cita.llegada_en is null then
    update public.citas set llegada_en = now() where id = p_cita_id;
  end if;

  if v_punto.es_punto_salida then
    if v_cita.llegada_en is null then
      raise exception 'El paciente todavía no registra llegada al centro';
    end if;
    update public.citas set atendida_en = now(), estado = 'atendida' where id = p_cita_id;
  end if;

  update public.citas
  set punto_atencion_id = p_punto_id, punto_atencion_desde = now()
  where id = p_cita_id
  returning * into v_cita;

  insert into public.cita_eventos (cita_id, punto_id, creado_por)
  values (p_cita_id, p_punto_id, public.usuario_actual_id());

  return v_cita;
end;
$$;

revoke execute on function public.mover_paciente_punto(uuid, uuid) from public, anon;
grant execute on function public.mover_paciente_punto(uuid, uuid) to authenticated;

-- 5. Actualización en vivo del tablero (primera tabla del repo con
-- Realtime habilitado).
alter publication supabase_realtime add table public.cita_eventos;

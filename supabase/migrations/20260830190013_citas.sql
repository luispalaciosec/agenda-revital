create table public.citas (
  id uuid primary key default gen_random_uuid(),
  codigo_publico text unique, -- lo asigna trg_citas_codigo_publico si llega null
  sede_id uuid not null references public.sedes(id),
  paciente_id uuid not null references public.pacientes(id),
  contacto_id uuid not null references public.contactos(id),
  especialidad_id uuid not null references public.especialidades(id),
  servicio_id uuid not null references public.servicios(id),
  medico_id uuid references public.medicos(id),
  consultorio_id uuid references public.consultorios(id),
  inicio timestamptz not null,
  fin timestamptz not null check (fin > inicio),
  -- Franja lógica del cupo dentro de horarios (medico) o, si el médico es
  -- null (p. ej. Laboratorio), de la especialidad. Junto al índice de
  -- cupo, la garantía anti-sobrecupo la da el índice único de abajo, no
  -- una tabla de cupos materializada (acuerdo con Luis: horarios y
  -- excepciones cambian a diario, materializar duplicaría estado).
  indice_cupo smallint check (indice_cupo is null or indice_cupo >= 1),
  fecha_local date generated always as ((inicio at time zone 'America/Guayaquil')::date) stored,
  estado public.estado_cita_enum not null default 'solicitada',
  canal public.canal_cita_enum not null,
  precio_aplicado numeric(10,2) not null check (precio_aplicado >= 0),
  lista_precio_id uuid not null references public.listas_precio(id),
  aseguradora_id uuid references public.aseguradoras(id),
  convenio_id uuid references public.convenios(id),
  nota_admision text, -- solo panel, nunca dato clínico
  llegada_en timestamptz,
  atendida_en timestamptz,
  reprogramaciones_count smallint not null default 0,
  creado_por uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  ttclid text,
  referrer text
);

comment on table public.citas is 'NO EXISTE campo "motivo de consulta" (§18). indice_cupo lo calcula el servidor buscando el menor índice libre 1..capacidad; el índice único de abajo es la garantía atómica ante concurrencia.';

-- Sobrecupo prohibido, no configurable (§4.3). Unifica modo exacto
-- (capacidad 1) y bloque (capacidad N) bajo un solo mecanismo: dos
-- citas activas no pueden compartir médico+inicio+índice. Cuando no hay
-- médico (Laboratorio) se usa la especialidad como identidad del recurso.
create unique index idx_citas_sin_sobrecupo
  on public.citas (coalesce(medico_id, especialidad_id), inicio, indice_cupo)
  where estado in ('solicitada', 'en_gestion', 'confirmada') and indice_cupo is not null;

create index idx_citas_paciente on public.citas (paciente_id, estado);
create index idx_citas_contacto on public.citas (contacto_id, estado);
create index idx_citas_agenda_dia on public.citas (sede_id, fecha_local, medico_id);
create index idx_citas_medico_dia on public.citas (medico_id, fecha_local) where medico_id is not null;
create index idx_citas_estado on public.citas (estado);

create trigger trg_citas_actualizado_en
  before update on public.citas
  for each row execute function public.tocar_actualizado_en();

create trigger trg_citas_auditoria
  after insert or update or delete on public.citas
  for each row execute function public.fn_registrar_auditoria();

create or replace function public.trg_fn_citas_codigo_publico()
returns trigger
language plpgsql
as $$
begin
  if new.codigo_publico is null then
    new.codigo_publico := public.generar_codigo_publico();
  end if;
  return new;
end;
$$;

create trigger trg_citas_codigo_publico
  before insert on public.citas
  for each row execute function public.trg_fn_citas_codigo_publico();

-- Reglas de negocio configurables que dependen de un COUNT (no se pueden
-- expresar como índice único): máximo de citas activas por paciente y
-- prohibición de repetir especialidad el mismo día. fecha_local es una
-- columna generada, así que Postgres aún no la calculó cuando corre un
-- trigger BEFORE — se recalcula inline desde new.inicio.
create or replace function public.trg_fn_validar_reglas_cita()
returns trigger
language plpgsql
as $$
declare
  v_estados_activos public.estado_cita_enum[] := array['solicitada', 'en_gestion', 'confirmada']::public.estado_cita_enum[];
  v_limite_activas int;
  v_prohibir_misma_especialidad boolean;
  v_count_activas int;
  v_count_misma_especialidad int;
  v_fecha_local date;
begin
  if new.estado = any(v_estados_activos) then
    v_limite_activas := coalesce((public.obtener_configuracion('limite_citas_activas_por_paciente', '3'))::text::int, 3);

    select count(*) into v_count_activas
    from public.citas
    where paciente_id = new.paciente_id
      and estado = any(v_estados_activos)
      and id <> new.id;

    if v_count_activas >= v_limite_activas then
      raise exception 'El paciente ya tiene % cita(s) activa(s); límite configurado: %', v_count_activas, v_limite_activas;
    end if;

    v_prohibir_misma_especialidad := coalesce((public.obtener_configuracion('prohibir_misma_especialidad_mismo_dia', 'true'))::text::boolean, true);

    if v_prohibir_misma_especialidad then
      v_fecha_local := (new.inicio at time zone 'America/Guayaquil')::date;

      select count(*) into v_count_misma_especialidad
      from public.citas
      where paciente_id = new.paciente_id
        and especialidad_id = new.especialidad_id
        and estado = any(v_estados_activos)
        and id <> new.id
        and (inicio at time zone 'America/Guayaquil')::date = v_fecha_local;

      if v_count_misma_especialidad > 0 then
        raise exception 'El paciente ya tiene una cita de esta especialidad el mismo día';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_citas_validar_reglas
  before insert or update on public.citas
  for each row execute function public.trg_fn_validar_reglas_cita();

alter table public.citas enable row level security;

create policy citas_select_staff on public.citas
  for select to authenticated using (public.es_staff_activo());

create policy citas_all_staff on public.citas
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

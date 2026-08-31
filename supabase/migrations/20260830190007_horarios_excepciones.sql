create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid references public.medicos(id),
  especialidad_id uuid not null references public.especialidades(id),
  consultorio_id uuid references public.consultorios(id),
  dia_semana smallint not null check (dia_semana between 1 and 7), -- 1=lunes .. 7=domingo
  hora_inicio time not null,
  hora_fin time not null check (hora_fin > hora_inicio),
  modo public.modo_agenda_enum not null,
  duracion_min smallint not null check (duracion_min > 0),
  cupos_por_bloque smallint not null default 1 check (cupos_por_bloque >= 1),
  vigente_desde date not null default current_date,
  vigente_hasta date,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);

comment on table public.horarios is 'Plantilla semanal recurrente. Un médico puede tener varias filas. Laboratorio no tiene medico_id.';

create index idx_horarios_medico on public.horarios (medico_id, dia_semana) where activo;
create index idx_horarios_especialidad on public.horarios (especialidad_id, dia_semana) where activo;

create trigger trg_horarios_actualizado_en
  before update on public.horarios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_horarios_auditoria
  after insert or update or delete on public.horarios
  for each row execute function public.fn_registrar_auditoria();

alter table public.horarios enable row level security;

create policy horarios_select_staff on public.horarios
  for select to authenticated using (public.es_staff_activo());

create policy horarios_all_staff on public.horarios
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.excepciones_agenda (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_excepcion_enum not null,
  alcance public.alcance_excepcion_enum not null,
  medico_id uuid references public.medicos(id),
  consultorio_id uuid references public.consultorios(id),
  sede_id uuid references public.sedes(id),
  fecha_desde date not null,
  fecha_hasta date not null check (fecha_hasta >= fecha_desde),
  hora_inicio time,
  hora_fin time,
  motivo text,
  creado_por uuid,
  creado_en timestamptz not null default now(),
  check (
    (alcance = 'medico' and medico_id is not null and consultorio_id is null and sede_id is null) or
    (alcance = 'consultorio' and consultorio_id is not null and medico_id is null and sede_id is null) or
    (alcance = 'sede' and sede_id is not null and medico_id is null and consultorio_id is null)
  ),
  check ((hora_inicio is null) = (hora_fin is null)),
  check (hora_inicio is null or hora_fin > hora_inicio)
);

comment on table public.excepciones_agenda is 'Feriados, vacaciones, ausencias y bloqueos. hora_inicio/hora_fin null = día completo.';

create index idx_excepciones_medico on public.excepciones_agenda (medico_id, fecha_desde, fecha_hasta) where alcance = 'medico';
create index idx_excepciones_consultorio on public.excepciones_agenda (consultorio_id, fecha_desde, fecha_hasta) where alcance = 'consultorio';
create index idx_excepciones_sede on public.excepciones_agenda (sede_id, fecha_desde, fecha_hasta) where alcance = 'sede';

create trigger trg_excepciones_auditoria
  after insert or update or delete on public.excepciones_agenda
  for each row execute function public.fn_registrar_auditoria();

alter table public.excepciones_agenda enable row level security;

create policy excepciones_select_staff on public.excepciones_agenda
  for select to authenticated using (public.es_staff_activo());

create policy excepciones_all_staff on public.excepciones_agenda
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

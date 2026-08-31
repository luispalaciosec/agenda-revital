create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id),
  codigo_revital text not null,
  tipo text not null,
  descripcion text not null,
  especialidad_id uuid references public.especialidades(id),
  agendable boolean not null default false,
  duracion_min smallint, -- si null, hereda duracion_min de la especialidad
  requiere_aprobacion boolean not null default false,
  preparacion_previa text,
  visible_web boolean not null default false,
  visible_bot boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (sede_id, codigo_revital)
);

comment on table public.servicios is 'Tarifario completo de Revital (593 filas en el catálogo real). Solo un subconjunto arranca agendable=true.';

create index idx_servicios_especialidad on public.servicios (especialidad_id) where activo;
create index idx_servicios_agendable on public.servicios (sede_id) where agendable and activo;
create index idx_servicios_busqueda on public.servicios using gin (to_tsvector('spanish', descripcion));

create trigger trg_servicios_actualizado_en
  before update on public.servicios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_servicios_auditoria
  after insert or update or delete on public.servicios
  for each row execute function public.fn_registrar_auditoria();

alter table public.servicios enable row level security;

create policy servicios_select_staff on public.servicios
  for select to authenticated using (public.es_staff_activo());

create policy servicios_all_staff on public.servicios
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.servicios_agrupados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  servicios_ids uuid[] not null,
  especialidad_id uuid not null references public.especialidades(id),
  duracion_min smallint not null check (duracion_min > 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.servicios_agrupados is 'Para laboratorio: el paciente agenda "Sangre" u "Orina", no uno de los 453 análisis individuales.';

create trigger trg_servicios_agrupados_actualizado_en
  before update on public.servicios_agrupados
  for each row execute function public.tocar_actualizado_en();

create trigger trg_servicios_agrupados_auditoria
  after insert or update or delete on public.servicios_agrupados
  for each row execute function public.fn_registrar_auditoria();

alter table public.servicios_agrupados enable row level security;

create policy servicios_agrupados_select_staff on public.servicios_agrupados
  for select to authenticated using (public.es_staff_activo());

create policy servicios_agrupados_all_staff on public.servicios_agrupados
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

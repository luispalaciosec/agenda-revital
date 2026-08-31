create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text not null,
  telefono text,
  activa boolean not null default true,
  hora_apertura_lv time not null,
  hora_cierre_lv time not null,
  hora_apertura_sab time,
  hora_cierre_sab time,
  zona_horaria text not null default 'America/Guayaquil',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.sedes is 'Hoy existe una sola sede, pero se modela desde el día 1. Toda entidad operativa cuelga de sede_id.';

create trigger trg_sedes_actualizado_en
  before update on public.sedes
  for each row execute function public.tocar_actualizado_en();

create trigger trg_sedes_auditoria
  after insert or update or delete on public.sedes
  for each row execute function public.fn_registrar_auditoria();

alter table public.sedes enable row level security;

create policy sedes_select_staff on public.sedes
  for select to authenticated using (public.es_staff_activo());

create policy sedes_all_staff on public.sedes
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.consultorios (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id),
  nombre text not null,
  numero smallint not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (sede_id, numero)
);

create trigger trg_consultorios_actualizado_en
  before update on public.consultorios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_consultorios_auditoria
  after insert or update or delete on public.consultorios
  for each row execute function public.fn_registrar_auditoria();

alter table public.consultorios enable row level security;

create policy consultorios_select_staff on public.consultorios
  for select to authenticated using (public.es_staff_activo());

create policy consultorios_all_staff on public.consultorios
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

create table public.aseguradoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descuento_pct numeric(5,2) not null check (descuento_pct >= 0 and descuento_pct <= 100),
  requiere_autorizacion_previa boolean not null default false,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger trg_aseguradoras_actualizado_en
  before update on public.aseguradoras
  for each row execute function public.tocar_actualizado_en();

create trigger trg_aseguradoras_auditoria
  after insert or update or delete on public.aseguradoras
  for each row execute function public.fn_registrar_auditoria();

alter table public.aseguradoras enable row level security;

create policy aseguradoras_all_admin on public.aseguradoras
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());


create table public.convenios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc_empresa text not null,
  descuento_pct numeric(5,2) not null check (descuento_pct >= 0 and descuento_pct <= 100),
  contacto text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger trg_convenios_actualizado_en
  before update on public.convenios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_convenios_auditoria
  after insert or update or delete on public.convenios
  for each row execute function public.fn_registrar_auditoria();

alter table public.convenios enable row level security;

create policy convenios_all_admin on public.convenios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());


create table public.convenio_beneficiarios (
  id uuid primary key default gen_random_uuid(),
  convenio_id uuid not null references public.convenios(id) on delete cascade,
  cedula text not null,
  nombres text not null,
  apellidos text not null,
  parentesco public.parentesco_convenio_enum not null,
  vigencia_desde date not null,
  vigencia_hasta date,
  creado_en timestamptz not null default now(),
  check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde)
);

create index idx_convenio_beneficiarios_cedula on public.convenio_beneficiarios (cedula);

create trigger trg_convenio_beneficiarios_auditoria
  after insert or update or delete on public.convenio_beneficiarios
  for each row execute function public.fn_registrar_auditoria();

alter table public.convenio_beneficiarios enable row level security;

create policy convenio_beneficiarios_all_admin on public.convenio_beneficiarios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

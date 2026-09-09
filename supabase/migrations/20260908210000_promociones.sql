create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  imagen_url text,
  especialidad_id uuid references public.especialidades(id),
  vigente_desde date not null default current_date,
  vigente_hasta date,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);

comment on table public.promociones is 'Promociones de marketing mostradas al público (web y bot). Antes vivían en un Google Sheet.';

create trigger trg_promociones_actualizado_en
  before update on public.promociones
  for each row execute function public.tocar_actualizado_en();

create trigger trg_promociones_auditoria
  after insert or update or delete on public.promociones
  for each row execute function public.fn_registrar_auditoria();

alter table public.promociones enable row level security;

create policy promociones_select_staff on public.promociones
  for select to authenticated using (public.es_staff_activo());

create policy promociones_all_admin on public.promociones
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create index idx_promociones_activa on public.promociones (activa, vigente_hasta);

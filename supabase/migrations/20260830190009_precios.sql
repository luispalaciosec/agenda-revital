create table public.listas_precio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo public.tipo_lista_precio_enum not null,
  descuento_pct numeric(5,2) check (descuento_pct is null or (descuento_pct >= 0 and descuento_pct <= 100)),
  vigente_desde date,
  vigente_hasta date,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (vigente_hasta is null or vigente_desde is null or vigente_hasta >= vigente_desde)
);

create trigger trg_listas_precio_actualizado_en
  before update on public.listas_precio
  for each row execute function public.tocar_actualizado_en();

create trigger trg_listas_precio_auditoria
  after insert or update or delete on public.listas_precio
  for each row execute function public.fn_registrar_auditoria();

alter table public.listas_precio enable row level security;

-- Precios y listas de precio: exclusivo de admin (§8.1).
create policy listas_precio_all_admin on public.listas_precio
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());


create table public.precios (
  id uuid primary key default gen_random_uuid(),
  lista_precio_id uuid not null references public.listas_precio(id),
  servicio_id uuid not null references public.servicios(id),
  valor numeric(10,2) not null check (valor >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (lista_precio_id, servicio_id)
);

create trigger trg_precios_actualizado_en
  before update on public.precios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_precios_auditoria
  after insert or update or delete on public.precios
  for each row execute function public.fn_registrar_auditoria();

alter table public.precios enable row level security;

create policy precios_all_admin on public.precios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());


-- Snapshot de cada carga masiva de precios por Excel: reconstruir "cuánto
-- costaba un servicio en marzo" a partir de auditoria fila-por-fila es
-- doloroso; el snapshot lo resuelve directo (acuerdo con Luis).
create table public.cargas_precio (
  id uuid primary key default gen_random_uuid(),
  lista_precio_id uuid not null references public.listas_precio(id),
  archivo_nombre text not null,
  cargado_por uuid,
  cargado_en timestamptz not null default now(),
  filas_afectadas integer not null default 0,
  snapshot jsonb not null
);

alter table public.cargas_precio enable row level security;

create policy cargas_precio_all_admin on public.cargas_precio
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

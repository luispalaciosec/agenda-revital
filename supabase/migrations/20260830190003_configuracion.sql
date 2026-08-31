create table public.configuracion (
  clave text primary key,
  valor jsonb not null,
  categoria text not null,
  descripcion text,
  actualizado_por uuid,
  actualizado_en timestamptz not null default now()
);

comment on table public.configuracion is 'Todo dato que puede cambiar sin cambiar lógica. Se edita desde el panel, nunca fijo en código.';

create trigger trg_configuracion_actualizado_en
  before update on public.configuracion
  for each row execute function public.tocar_actualizado_en();

create trigger trg_configuracion_auditoria
  after insert or update or delete on public.configuracion
  for each row execute function public.fn_registrar_auditoria();

alter table public.configuracion enable row level security;

-- Categorías 'agenda' y 'catalogo' las edita cualquier staff activo;
-- el resto (precios, legal, mensajes, integraciones, usuarios,
-- mantenimiento) es exclusivo de admin, según §8.1.
create policy configuracion_select_staff on public.configuracion
  for select to authenticated
  using (public.es_staff_activo());

create policy configuracion_insert_staff_o_admin on public.configuracion
  for insert to authenticated
  with check (
    public.es_admin()
    or (public.es_staff_activo() and categoria in ('agenda', 'catalogo'))
  );

create policy configuracion_update_staff_o_admin on public.configuracion
  for update to authenticated
  using (
    public.es_admin()
    or (public.es_staff_activo() and categoria in ('agenda', 'catalogo'))
  )
  with check (
    public.es_admin()
    or (public.es_staff_activo() and categoria in ('agenda', 'catalogo'))
  );

create policy configuracion_delete_admin on public.configuracion
  for delete to authenticated
  using (public.es_admin());

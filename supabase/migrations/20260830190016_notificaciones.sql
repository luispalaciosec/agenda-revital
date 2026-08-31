create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid references public.citas(id),
  paciente_id uuid not null references public.pacientes(id),
  canal public.canal_notificacion_enum not null,
  tipo public.tipo_notificacion_enum not null,
  plantilla text,
  estado public.estado_notificacion_enum not null default 'pendiente',
  proveedor_id text,
  programada_para timestamptz not null,
  enviada_en timestamptz,
  error text,
  creado_en timestamptz not null default now()
);

create index idx_notificaciones_pendientes on public.notificaciones (programada_para) where estado = 'pendiente';
create index idx_notificaciones_cita on public.notificaciones (cita_id);

alter table public.notificaciones enable row level security;

-- El envío real lo hacen los jobs programados con service role (que
-- ignora RLS); el panel solo necesita lectura para mostrar el historial
-- de una cita o paciente.
create policy notificaciones_select_staff on public.notificaciones
  for select to authenticated using (public.es_staff_activo());

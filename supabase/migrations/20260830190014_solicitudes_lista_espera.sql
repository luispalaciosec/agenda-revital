create table public.solicitudes_gestion (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas(id),
  asignada_a uuid,
  vence_en timestamptz not null,
  resuelta_en timestamptz,
  resultado public.resultado_solicitud_enum,
  observacion text,
  creado_en timestamptz not null default now(),
  check ((resultado is null) = (resuelta_en is null))
);

comment on table public.solicitudes_gestion is 'vence_en se calcula con sumar_horas_laborables(creado_en, 6, sede_id) al crear la solicitud.';

create index idx_solicitudes_pendientes on public.solicitudes_gestion (vence_en) where resultado is null;
create index idx_solicitudes_cita on public.solicitudes_gestion (cita_id);

create trigger trg_solicitudes_auditoria
  after insert or update or delete on public.solicitudes_gestion
  for each row execute function public.fn_registrar_auditoria();

alter table public.solicitudes_gestion enable row level security;

create policy solicitudes_select_staff on public.solicitudes_gestion
  for select to authenticated using (public.es_staff_activo());

create policy solicitudes_all_staff on public.solicitudes_gestion
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  especialidad_id uuid not null references public.especialidades(id),
  medico_id uuid references public.medicos(id),
  paciente_id uuid not null references public.pacientes(id),
  contacto_id uuid not null references public.contactos(id),
  fecha_deseada date not null,
  notificado_en timestamptz,
  expira_en timestamptz,
  estado public.estado_lista_espera_enum not null default 'esperando',
  creado_en timestamptz not null default now()
);

comment on table public.lista_espera is 'Al liberarse un cupo se notifica solo al primero en estado esperando. Tiene 30 minutos (expira_en) para tomarlo antes de pasar al siguiente.';

create index idx_lista_espera_cola on public.lista_espera (especialidad_id, fecha_deseada, creado_en) where estado = 'esperando';
create index idx_lista_espera_expirando on public.lista_espera (expira_en) where estado = 'notificado';

create trigger trg_lista_espera_auditoria
  after insert or update or delete on public.lista_espera
  for each row execute function public.fn_registrar_auditoria();

alter table public.lista_espera enable row level security;

create policy lista_espera_select_staff on public.lista_espera
  for select to authenticated using (public.es_staff_activo());

create policy lista_espera_all_staff on public.lista_espera
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

create table public.contactos (
  id uuid primary key default gen_random_uuid(),
  celular text not null unique,
  verificado boolean not null default false,
  verificado_en timestamptz,
  creado_en timestamptz not null default now(),
  ultimo_acceso timestamptz
);

comment on table public.contactos is 'El número de WhatsApp que agenda. Un celular puede agendar para varias personas.';

create trigger trg_contactos_auditoria
  after insert or update or delete on public.contactos
  for each row execute function public.fn_registrar_auditoria();

alter table public.contactos enable row level security;

create policy contactos_select_staff on public.contactos
  for select to authenticated using (public.es_staff_activo());

create policy contactos_all_staff on public.contactos
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  tipo_documento public.tipo_documento_enum not null,
  documento text not null,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date not null,
  correo text,
  historia_clinica text, -- opcional, la llena admisión; nunca dato clínico
  representante_documento text,
  representante_nombres text,
  representante_parentesco text,
  contador_no_show integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (tipo_documento, documento),
  check (
    (fecha_nacimiento > (current_date - interval '18 years') and representante_documento is not null)
    or fecha_nacimiento <= (current_date - interval '18 years')
  ),
  check (tipo_documento <> 'cedula' or public.validar_cedula_ecuador(documento))
);

comment on table public.pacientes is 'La persona que se atiende. NO EXISTE campo "motivo de consulta": decisión deliberada, ver §18 de la especificación.';

create index idx_pacientes_documento on public.pacientes (documento);
create index idx_pacientes_busqueda on public.pacientes using gin (to_tsvector('spanish', nombres || ' ' || apellidos));

create trigger trg_pacientes_actualizado_en
  before update on public.pacientes
  for each row execute function public.tocar_actualizado_en();

create trigger trg_pacientes_auditoria
  after insert or update or delete on public.pacientes
  for each row execute function public.fn_registrar_auditoria();

alter table public.pacientes enable row level security;

create policy pacientes_select_staff on public.pacientes
  for select to authenticated using (public.es_staff_activo());

create policy pacientes_all_staff on public.pacientes
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.contacto_paciente (
  contacto_id uuid not null references public.contactos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  relacion text,
  creado_en timestamptz not null default now(),
  primary key (contacto_id, paciente_id)
);

alter table public.contacto_paciente enable row level security;

create policy contacto_paciente_select_staff on public.contacto_paciente
  for select to authenticated using (public.es_staff_activo());

create policy contacto_paciente_all_staff on public.contacto_paciente
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

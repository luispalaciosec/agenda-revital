create table public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id),
  tipo public.tipo_consentimiento_enum not null,
  otorgado boolean not null,
  version_texto text not null,
  otorgado_por public.otorgado_por_enum not null,
  representante_documento text, -- copia al momento de firmar; el representante puede cambiar después
  ip inet,
  user_agent text,
  canal public.canal_cita_enum not null,
  otorgado_en timestamptz not null default now(),
  revocado_en timestamptz,
  check (otorgado_por = 'paciente' or representante_documento is not null)
);

comment on table public.consentimientos is 'Dos tipos separados: tratamiento_datos (obligatorio) y marketing (opcional, desmarcado por defecto). otorgado_por registra quién firmó porque un menor no puede consentir por sí mismo.';

create index idx_consentimientos_paciente on public.consentimientos (paciente_id, tipo, otorgado_en desc);

create trigger trg_consentimientos_auditoria
  after insert or update or delete on public.consentimientos
  for each row execute function public.fn_registrar_auditoria();

alter table public.consentimientos enable row level security;

create policy consentimientos_select_staff on public.consentimientos
  for select to authenticated using (public.es_staff_activo());

create policy consentimientos_insert_staff on public.consentimientos
  for insert to authenticated with check (public.es_staff_activo());

-- Sin UPDATE ni DELETE para nadie vía panel: un consentimiento se revoca
-- insertando una nueva fila con otorgado=false, nunca editando la anterior.
-- Preserva el registro histórico exacto que exige LOPDP ante un reclamo.

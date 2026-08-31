create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id),
  entidad text not null,
  entidad_id text,
  accion public.accion_auditoria_enum not null,
  datos_antes jsonb,
  datos_despues jsonb,
  ip inet,
  user_agent text,
  creado_en timestamptz not null default now()
);

comment on table public.auditoria is 'Inmutable. La política RLS solo permite INSERT, y el trigger de abajo bloquea UPDATE/DELETE incluso para quien tenga BYPASSRLS (p. ej. service role), porque la inmutabilidad es la garantía, no un detalle de permisos.';

create index idx_auditoria_entidad on public.auditoria (entidad, entidad_id, creado_en desc);
create index idx_auditoria_usuario on public.auditoria (usuario_id, creado_en desc);
create index idx_auditoria_fecha on public.auditoria (creado_en desc);

-- Bloquea UPDATE/DELETE incondicionalmente, sin excepción de rol.
create or replace function public.fn_impedir_modificacion_auditoria()
returns trigger
language plpgsql
as $$
begin
  raise exception 'La tabla auditoria es inmutable: no se permite % ', tg_op;
end;
$$;

create trigger trg_auditoria_inmutable
  before update or delete on public.auditoria
  for each row execute function public.fn_impedir_modificacion_auditoria();

alter table public.auditoria enable row level security;

-- Solo INSERT, y solo con el usuario_id del propio staff autenticado
-- (o null, para escrituras del service role -- que de todas formas
-- ignora RLS). Nadie puede insertar auditoria a nombre de otro usuario.
create policy auditoria_insert on public.auditoria
  for insert to authenticated
  with check (usuario_id is null or usuario_id = public.usuario_actual_id());

create policy auditoria_select_admin on public.auditoria
  for select to authenticated using (public.es_admin());

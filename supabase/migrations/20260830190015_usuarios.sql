create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  nombres text not null,
  apellidos text not null,
  correo text not null,
  celular text,
  rol public.rol_usuario_enum not null,
  mfa_habilitado boolean not null default false,
  activo boolean not null default true,
  ultimo_acceso timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.usuarios is 'Un usuario por persona, nunca compartido: credenciales compartidas invalidan la auditoría (§8.1). Rol medico se modela pero queda desactivado en v1.';

create trigger trg_usuarios_actualizado_en
  before update on public.usuarios
  for each row execute function public.tocar_actualizado_en();

create trigger trg_usuarios_auditoria
  after insert or update or delete on public.usuarios
  for each row execute function public.fn_registrar_auditoria();

alter table public.usuarios enable row level security;

-- Usuarios y roles: exclusivo de admin. Cada usuario además puede ver y
-- actualizar su propia fila (perfil: celular, correo, preferencias),
-- nunca su propio rol ni estado activo -- eso lo custodia el CHECK de abajo.
create policy usuarios_select_propio_o_admin on public.usuarios
  for select to authenticated
  using (auth_user_id = auth.uid() or public.es_admin());

create policy usuarios_insert_admin on public.usuarios
  for insert to authenticated with check (public.es_admin());

create policy usuarios_update_propio_o_admin on public.usuarios
  for update to authenticated
  using (auth_user_id = auth.uid() or public.es_admin())
  with check (
    public.es_admin()
    or (auth_user_id = auth.uid() and rol = public.rol_actual()::public.rol_usuario_enum and activo = true)
  );

create policy usuarios_delete_admin on public.usuarios
  for delete to authenticated using (public.es_admin());

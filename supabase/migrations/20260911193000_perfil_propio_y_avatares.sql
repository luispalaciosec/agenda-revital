-- Cada usuario (cualquier rol) puede editar su propio nombre, correo,
-- contraseña y foto desde "Mi perfil" -- eso ya lo permitía
-- usuarios_update_propio_o_admin para nombres/apellidos/correo. Falta la
-- foto: una columna + un bucket de Storage con carpetas por usuario.

alter table public.usuarios
  add column foto_url text;

comment on column public.usuarios.foto_url is 'URL pública en el bucket avatars. Cualquiera puede editar la propia (self-service), nunca la de otro usuario.';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cada quien sube/reemplaza/borra solo dentro de su propia carpeta
-- (avatars/<auth_user_id>/...); la lectura es pública porque es solo una
-- foto de perfil de un miembro del staff, no un dato del paciente.
create policy avatars_lectura_publica on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_insertar_propio on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_actualizar_propio on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_eliminar_propio on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

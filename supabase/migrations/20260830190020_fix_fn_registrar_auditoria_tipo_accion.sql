-- fn_registrar_auditoria (migración 0001) declaraba v_accion como text;
-- auditoria.accion es accion_auditoria_enum (creado en la migración 0002,
-- posterior). Sin este fix, el primer INSERT auditado fallaba con
-- "column accion is of type accion_auditoria_enum but expression is of type text".
create or replace function public.fn_registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion public.accion_auditoria_enum;
  v_datos_antes jsonb;
  v_datos_despues jsonb;
begin
  if tg_op = 'INSERT' then
    v_accion := 'crear';
    v_datos_antes := null;
    v_datos_despues := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_accion := 'actualizar';
    v_datos_antes := to_jsonb(old);
    v_datos_despues := to_jsonb(new);
  else
    v_accion := 'eliminar';
    v_datos_antes := to_jsonb(old);
    v_datos_despues := null;
  end if;

  insert into public.auditoria (usuario_id, entidad, entidad_id, accion, datos_antes, datos_despues)
  values (
    public.usuario_actual_id(),
    tg_table_name,
    coalesce((v_datos_despues ->> 'id'), (v_datos_antes ->> 'id')),
    v_accion,
    v_datos_antes,
    v_datos_despues
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

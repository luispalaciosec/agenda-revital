-- Aprobar/rechazar una solicitud toca dos tablas (citas.estado y
-- solicitudes_gestion.resultado) que tienen que quedar consistentes
-- siempre -- mismo criterio que reprogramar_cita: una función de
-- Postgres en vez de dos llamadas separadas desde la app.
create or replace function public.gestionar_solicitud(
  p_solicitud_id uuid,
  p_aceptar boolean,
  p_observacion text default null
)
returns public.solicitudes_gestion
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_solicitud public.solicitudes_gestion;
begin
  select * into v_solicitud from public.solicitudes_gestion where id = p_solicitud_id for update;
  if not found then
    raise exception 'Solicitud no encontrada';
  end if;
  if v_solicitud.resultado is not null then
    raise exception 'Esta solicitud ya fue resuelta';
  end if;

  update public.citas
  set estado = case when p_aceptar then 'confirmada' else 'rechazada' end
  where id = v_solicitud.cita_id;

  update public.solicitudes_gestion
  set resultado = case when p_aceptar then 'aceptada' else 'rechazada' end,
      resuelta_en = now(),
      observacion = p_observacion,
      asignada_a = public.usuario_actual_id()
  where id = p_solicitud_id
  returning * into v_solicitud;

  return v_solicitud;
end;
$$;

revoke execute on function public.gestionar_solicitud(uuid, boolean, text) from public, anon;
grant execute on function public.gestionar_solicitud(uuid, boolean, text) to authenticated;

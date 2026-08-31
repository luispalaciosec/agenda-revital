-- Mismo descuido que ya había aparecido en fn_registrar_auditoria: un
-- CASE entre dos literales de texto resuelve a texto por defecto, y
-- Postgres no lo castea solo al asignarlo a una columna enum.
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
  set estado = case when p_aceptar then 'confirmada' else 'rechazada' end::public.estado_cita_enum
  where id = v_solicitud.cita_id;

  update public.solicitudes_gestion
  set resultado = case when p_aceptar then 'aceptada' else 'rechazada' end::public.resultado_solicitud_enum,
      resuelta_en = now(),
      observacion = p_observacion,
      asignada_a = public.usuario_actual_id()
  where id = p_solicitud_id
  returning * into v_solicitud;

  return v_solicitud;
end;
$$;

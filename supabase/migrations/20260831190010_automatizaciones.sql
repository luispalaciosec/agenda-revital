-- Fase 5 (automatizaciones): funciones atómicas para no-show automático
-- (§4.3: "al cierre del día, para citas pasadas sin marcar") y vencimiento
-- de solicitudes (§4.3: SLA de 6 horas laborables). Ambas se llaman desde
-- el cron interno, nunca desde el cliente.

create or replace function public.marcar_no_show_del_dia(p_sede_id uuid, p_fecha date)
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_contador integer := 0;
  v_fila record;
begin
  for v_fila in
    update public.citas
    set estado = 'no_show'
    where sede_id = p_sede_id
      and fecha_local = p_fecha
      and estado = 'confirmada'
      and llegada_en is null
    returning paciente_id
  loop
    update public.pacientes set contador_no_show = contador_no_show + 1 where id = v_fila.paciente_id;
    v_contador := v_contador + 1;
  end loop;

  return v_contador;
end;
$$;

revoke execute on function public.marcar_no_show_del_dia(uuid, date) from public, anon, authenticated;
grant execute on function public.marcar_no_show_del_dia(uuid, date) to service_role;

create or replace function public.vencer_solicitudes()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_contador integer := 0;
  v_fila record;
begin
  for v_fila in
    update public.solicitudes_gestion
    set resultado = 'vencida', resuelta_en = now()
    where resuelta_en is null and vence_en < now()
    returning cita_id
  loop
    update public.citas set estado = 'rechazada' where id = v_fila.cita_id and estado in ('solicitada', 'en_gestion');
    v_contador := v_contador + 1;
  end loop;

  return v_contador;
end;
$$;

revoke execute on function public.vencer_solicitudes() from public, anon, authenticated;
grant execute on function public.vencer_solicitudes() to service_role;

-- gestionar_solicitud no encolaba ninguna notificación al aceptar una
-- solicitud (hueco detectado en Fase 5): el paciente nunca se enteraba de
-- que su procedimiento quedó confirmado. Ahora encola confirmación por
-- WhatsApp y correo (§9.1), igual que crear_cita_publica para citas que
-- confirman directo.
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
  v_cita public.citas;
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
  where id = v_solicitud.cita_id
  returning * into v_cita;

  update public.solicitudes_gestion
  set resultado = case when p_aceptar then 'aceptada' else 'rechazada' end::public.resultado_solicitud_enum,
      resuelta_en = now(),
      observacion = p_observacion,
      asignada_a = public.usuario_actual_id()
  where id = p_solicitud_id
  returning * into v_solicitud;

  if p_aceptar then
    insert into public.notificaciones (cita_id, paciente_id, canal, tipo, estado, programada_para)
    values
      (v_cita.id, v_cita.paciente_id, 'whatsapp', 'confirmacion', 'pendiente', now()),
      (v_cita.id, v_cita.paciente_id, 'correo', 'confirmacion', 'pendiente', now());
  end if;

  return v_solicitud;
end;
$$;

-- Nueva clave de configuración para Fase 6 (§10.1): contenedor de Google
-- Tag Manager. Vacío hasta que Luis tenga el ID real — sin él, la web no
-- carga ningún script de analítica.
insert into public.configuracion (clave, valor, categoria, descripcion)
values ('gtm_container_id', 'null'::jsonb, 'integraciones', 'ID del contenedor de Google Tag Manager (GTM-XXXXXXX). Vacío desactiva GA4/GTM en la web pública.')
on conflict (clave) do nothing;

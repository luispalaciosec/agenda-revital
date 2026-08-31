-- notificaciones solo tenía política de SELECT para staff (el envío real
-- lo hacen los jobs con service role). Cancelación masiva sí necesita
-- que el panel encole una notificación por paciente afectado.
create policy notificaciones_insert_staff on public.notificaciones
  for insert to authenticated
  with check (public.es_staff_activo());

-- §4.5: cancelar el día completo de un médico en una acción. Toca
-- N citas + inserta N notificaciones -- misma razón que reprogramar_cita
-- y gestionar_solicitud: una función de Postgres, no un loop de llamadas
-- sueltas desde la app, para que no queden citas canceladas sin su
-- notificación en cola si algo falla a mitad de camino.
--
-- El envío real por WhatsApp es Fase 5 (no existe todavía): esto solo
-- deja la notificación en 'pendiente' para cuando exista ese job.
create or replace function public.cancelar_dia_medico(p_medico_id uuid, p_fecha date, p_motivo text default null)
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_cita record;
  v_contador int := 0;
begin
  for v_cita in
    select id, paciente_id
    from public.citas
    where medico_id = p_medico_id
      and fecha_local = p_fecha
      and estado in ('solicitada', 'en_gestion', 'confirmada')
    for update
  loop
    update public.citas
    set estado = 'cancelada_centro',
        nota_admision = coalesce(nota_admision || chr(10), '')
          || coalesce('Cancelación masiva: ' || p_motivo, 'Cancelación masiva del día')
    where id = v_cita.id;

    insert into public.notificaciones (cita_id, paciente_id, canal, tipo, estado, programada_para)
    values (v_cita.id, v_cita.paciente_id, 'whatsapp', 'cancelacion', 'pendiente', now());

    v_contador := v_contador + 1;
  end loop;

  return v_contador;
end;
$$;

revoke execute on function public.cancelar_dia_medico(uuid, date, text) from public, anon;
grant execute on function public.cancelar_dia_medico(uuid, date, text) to authenticated;

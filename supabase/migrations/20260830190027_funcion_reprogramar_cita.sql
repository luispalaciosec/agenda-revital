-- Reprogramar (§4.1): la cita original pasa a 'reprogramada' (estado
-- terminal, ver el diagrama del §4.1 -- no es un simple UPDATE de hora)
-- y se crea una cita nueva para el horario elegido. Va en una función de
-- Postgres, no en dos llamadas separadas desde la app, porque ambos pasos
-- tienen que ser atómicos: si el insert de la cita nueva falla, la vieja
-- no puede quedar marcada como reprogramada sin reemplazo.
--
-- security invoker (default): corre con los permisos del staff que la
-- llama, así que la RLS de citas sigue aplicando -- esta función no es
-- una puerta trasera.
create or replace function public.reprogramar_cita(
  p_cita_id uuid,
  p_nuevo_medico_id uuid,
  p_nuevo_consultorio_id uuid,
  p_nuevo_inicio timestamptz,
  p_nuevo_fin timestamptz
)
returns public.citas
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_original public.citas;
  v_max_reprogramaciones int;
  v_capacidad smallint;
  v_dia_semana smallint;
  v_hora_local time;
  v_indice smallint;
  v_nueva public.citas;
  v_insertada boolean := false;
begin
  select * into v_original from public.citas where id = p_cita_id for update;
  if not found then
    raise exception 'Cita no encontrada';
  end if;
  if v_original.estado <> 'confirmada' then
    raise exception 'Solo se puede reprogramar una cita confirmada';
  end if;

  v_max_reprogramaciones := coalesce((public.obtener_configuracion('reprogramacion_max_veces', '1'))::text::int, 1);
  if v_original.reprogramaciones_count >= v_max_reprogramaciones then
    raise exception 'Esta cita ya alcanzó el máximo de % reprogramación(es) permitida(s)', v_max_reprogramaciones;
  end if;

  v_dia_semana := extract(isodow from (p_nuevo_inicio at time zone 'America/Guayaquil'));
  v_hora_local := (p_nuevo_inicio at time zone 'America/Guayaquil')::time;

  select h.cupos_por_bloque into v_capacidad
  from public.horarios h
  where h.especialidad_id = v_original.especialidad_id
    and h.activo
    and h.dia_semana = v_dia_semana
    and h.hora_inicio <= v_hora_local and h.hora_fin > v_hora_local
    and ((p_nuevo_medico_id is null and h.medico_id is null) or h.medico_id = p_nuevo_medico_id)
  limit 1;

  if v_capacidad is null then
    raise exception 'No hay horario configurado para esa franja';
  end if;

  update public.citas set estado = 'reprogramada' where id = p_cita_id;

  v_indice := 1;
  while v_indice <= v_capacidad and not v_insertada loop
    begin
      insert into public.citas (
        sede_id, paciente_id, contacto_id, especialidad_id, servicio_id, medico_id, consultorio_id,
        inicio, fin, indice_cupo, estado, canal, precio_aplicado, lista_precio_id,
        aseguradora_id, convenio_id, nota_admision, reprogramaciones_count, creado_por,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, ttclid, referrer
      ) values (
        v_original.sede_id, v_original.paciente_id, v_original.contacto_id, v_original.especialidad_id, v_original.servicio_id,
        p_nuevo_medico_id, p_nuevo_consultorio_id, p_nuevo_inicio, p_nuevo_fin, v_indice,
        'confirmada', v_original.canal, v_original.precio_aplicado, v_original.lista_precio_id,
        v_original.aseguradora_id, v_original.convenio_id,
        'Reprogramada desde ' || v_original.codigo_publico,
        v_original.reprogramaciones_count + 1,
        public.usuario_actual_id(),
        v_original.utm_source, v_original.utm_medium, v_original.utm_campaign, v_original.utm_content, v_original.utm_term,
        v_original.fbclid, v_original.gclid, v_original.ttclid, v_original.referrer
      )
      returning * into v_nueva;
      v_insertada := true;
    exception when unique_violation then
      v_indice := v_indice + 1;
    end;
  end loop;

  if not v_insertada then
    raise exception 'Esa franja ya no tiene cupos disponibles';
  end if;

  update public.citas
  set nota_admision = coalesce(nota_admision || chr(10), '') || ('Reprogramada a ' || v_nueva.codigo_publico)
  where id = p_cita_id;

  return v_nueva;
end;
$$;

revoke execute on function public.reprogramar_cita(uuid, uuid, uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.reprogramar_cita(uuid, uuid, uuid, timestamptz, timestamptz) to authenticated;

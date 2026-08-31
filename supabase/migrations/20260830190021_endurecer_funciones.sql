-- Fija search_path en toda función que no lo tenía (mitiga secuestro de
-- search_path) y saca del alcance de anon las funciones internas de
-- autenticación/auditoría que no tienen razón de negocio para exponerse
-- como RPC público.

alter function public.tocar_actualizado_en() set search_path = public, pg_temp;
alter function public.obtener_configuracion(text, jsonb) set search_path = public, pg_temp;
alter function public.sumar_horas_laborables(timestamptz, numeric, uuid) set search_path = public, pg_temp;
alter function public.validar_cedula_ecuador(text) set search_path = public, pg_temp;
alter function public.generar_codigo_publico() set search_path = public, pg_temp;
alter function public.trg_fn_recalcular_visibilidad_por_asignacion() set search_path = public, pg_temp;
alter function public.trg_fn_recalcular_visibilidad_por_medico() set search_path = public, pg_temp;
alter function public.trg_fn_recalcular_visibilidad_por_especialidad() set search_path = public, pg_temp;
alter function public.trg_fn_citas_codigo_publico() set search_path = public, pg_temp;
alter function public.trg_fn_validar_reglas_cita() set search_path = public, pg_temp;
alter function public.fn_impedir_modificacion_auditoria() set search_path = public, pg_temp;

revoke execute on function public.es_admin() from public;
revoke execute on function public.es_staff_activo() from public;
revoke execute on function public.rol_actual() from public;
revoke execute on function public.usuario_actual_id() from public;
revoke execute on function public.fn_registrar_auditoria() from public;
revoke execute on function public.recalcular_visibilidad_especialidad(uuid) from public;

grant execute on function public.es_admin() to authenticated;
grant execute on function public.es_staff_activo() to authenticated;
grant execute on function public.rol_actual() to authenticated;
grant execute on function public.usuario_actual_id() to authenticated;
grant execute on function public.fn_registrar_auditoria() to authenticated;
grant execute on function public.recalcular_visibilidad_especialidad(uuid) to authenticated;

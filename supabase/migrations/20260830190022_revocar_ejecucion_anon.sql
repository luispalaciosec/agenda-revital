-- Supabase otorga EXECUTE a anon/authenticated por defecto en funciones
-- nuevas del schema public, aparte del PUBLIC estándar de Postgres.
-- Revocar de PUBLIC (migración anterior) no alcanzó a anon; hay que
-- quitárselo explícito.
revoke execute on function public.es_admin() from anon;
revoke execute on function public.es_staff_activo() from anon;
revoke execute on function public.rol_actual() from anon;
revoke execute on function public.usuario_actual_id() from anon;
revoke execute on function public.fn_registrar_auditoria() from anon;
revoke execute on function public.recalcular_visibilidad_especialidad(uuid) from anon;

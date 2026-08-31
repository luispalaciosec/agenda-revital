-- 1) Políticas SELECT redundantes: la política FOR ALL ya cubre SELECT,
-- así que la política _select_staff duplicaba evaluación en cada query.
drop policy if exists citas_select_staff on public.citas;
drop policy if exists consultorios_select_staff on public.consultorios;
drop policy if exists contacto_paciente_select_staff on public.contacto_paciente;
drop policy if exists contactos_select_staff on public.contactos;
drop policy if exists especialidades_select_staff on public.especialidades;
drop policy if exists excepciones_select_staff on public.excepciones_agenda;
drop policy if exists horarios_select_staff on public.horarios;
drop policy if exists lista_espera_select_staff on public.lista_espera;
drop policy if exists medico_especialidad_select_staff on public.medico_especialidad;
drop policy if exists medicos_select_staff on public.medicos;
drop policy if exists pacientes_select_staff on public.pacientes;
drop policy if exists sedes_select_staff on public.sedes;
drop policy if exists servicios_select_staff on public.servicios;
drop policy if exists servicios_agrupados_select_staff on public.servicios_agrupados;
drop policy if exists solicitudes_select_staff on public.solicitudes_gestion;

-- 2) auth.uid() sin envolver se reevalúa fila por fila; (select auth.uid())
-- se evalúa una sola vez por consulta (initplan).
drop policy if exists usuarios_select_propio_o_admin on public.usuarios;
create policy usuarios_select_propio_o_admin on public.usuarios
  for select to authenticated
  using (auth_user_id = (select auth.uid()) or public.es_admin());

drop policy if exists usuarios_update_propio_o_admin on public.usuarios;
create policy usuarios_update_propio_o_admin on public.usuarios
  for update to authenticated
  using (auth_user_id = (select auth.uid()) or public.es_admin())
  with check (
    public.es_admin()
    or (auth_user_id = (select auth.uid()) and rol = public.rol_actual()::public.rol_usuario_enum and activo = true)
  );

-- 3) Índices de cobertura para claves foráneas usadas en joins frecuentes
-- (agenda del día, reportes, búsqueda de paciente).
create index if not exists idx_citas_aseguradora on public.citas (aseguradora_id) where aseguradora_id is not null;
create index if not exists idx_citas_consultorio on public.citas (consultorio_id) where consultorio_id is not null;
create index if not exists idx_citas_convenio on public.citas (convenio_id) where convenio_id is not null;
create index if not exists idx_citas_especialidad on public.citas (especialidad_id);
create index if not exists idx_citas_lista_precio on public.citas (lista_precio_id);
create index if not exists idx_citas_servicio on public.citas (servicio_id);
create index if not exists idx_contacto_paciente_paciente on public.contacto_paciente (paciente_id);
create index if not exists idx_convenio_beneficiarios_convenio on public.convenio_beneficiarios (convenio_id);
create index if not exists idx_horarios_consultorio on public.horarios (consultorio_id) where consultorio_id is not null;
create index if not exists idx_lista_espera_contacto on public.lista_espera (contacto_id);
create index if not exists idx_lista_espera_medico on public.lista_espera (medico_id) where medico_id is not null;
create index if not exists idx_lista_espera_paciente on public.lista_espera (paciente_id);
create index if not exists idx_medico_especialidad_especialidad on public.medico_especialidad (especialidad_id);
create index if not exists idx_medicos_consultorio_default on public.medicos (consultorio_default_id) where consultorio_default_id is not null;
create index if not exists idx_medicos_sede on public.medicos (sede_id);
create index if not exists idx_notificaciones_paciente on public.notificaciones (paciente_id);
create index if not exists idx_precios_servicio on public.precios (servicio_id);
create index if not exists idx_servicios_agrupados_especialidad on public.servicios_agrupados (especialidad_id);
create index if not exists idx_cargas_precio_lista on public.cargas_precio (lista_precio_id);

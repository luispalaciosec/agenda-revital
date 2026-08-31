insert into public.configuracion (clave, valor, categoria, descripcion) values
  -- Reglas duras configurables (§4.3) -- categoría 'agenda': la edita
  -- cualquier staff activo, igual que el resto de horarios y catálogo.
  ('anticipacion_minima_horas', '3', 'agenda', 'Horas mínimas de anticipación para agendar una cita.'),
  ('anticipacion_maxima_dias', '60', 'agenda', 'Días máximos de anticipación para agendar una cita.'),
  ('cancelacion_sin_penalidad_horas', '4', 'agenda', 'Horas antes de la cita hasta las que se puede cancelar sin penalidad.'),
  ('reprogramacion_max_veces', '1', 'agenda', 'Número de veces que un paciente puede reprogramar una cita desde el link.'),
  ('limite_citas_activas_por_paciente', '3', 'agenda', 'Máximo de citas activas simultáneas por paciente.'),
  ('prohibir_misma_especialidad_mismo_dia', 'true', 'agenda', 'Si está activo, un paciente no puede tener dos citas de la misma especialidad el mismo día.'),
  ('alerta_no_show_reincidente_umbral', '3', 'agenda', 'Número de no-shows a partir del cual se alerta en el panel. No bloquea agendamiento.'),
  ('sla_solicitud_horas_laborables', '6', 'agenda', 'Horas laborables para gestionar una solicitud antes de que venza.'),
  ('lista_espera_ventana_minutos', '30', 'agenda', 'Minutos que tiene el primero de la lista de espera para tomar un cupo liberado.'),
  ('no_show_cierre_offset_minutos', '30', 'agenda', 'Minutos después del cierre del centro en que corre el job de no-show automático.'),

  -- Interruptores (§11.2) -- categoría 'integraciones' o 'mensajes' según
  -- a qué permiso de §8.1 corresponden; ambas son exclusivas de admin.
  ('otp_web_activo', 'true', 'integraciones', 'Exige verificación OTP por WhatsApp en la web pública.'),
  ('validar_consultorios', 'false', 'integraciones', 'Descarta franjas cuyo consultorio ya esté ocupado por otro médico. Arranca apagado (§16); se enciende al cargar el mapa de consultorios.'),
  ('bot_confirma_procedimientos', 'false', 'integraciones', 'Si está activo, el bot confirma procedimientos sin aprobación de una admisionista.'),
  ('canal_web_activo', 'true', 'integraciones', 'Cierra el agendamiento web sin afectar el resto de canales.'),
  ('canal_bot_activo', 'true', 'integraciones', 'Cierra el agendamiento por bot sin afectar el resto de canales.'),
  ('modo_mantenimiento', 'false', 'integraciones', 'Cierra la agenda pública (web y bot); el panel sigue operando.'),
  ('lista_espera_activa', 'true', 'mensajes', 'Activa la notificación automática a la lista de espera cuando se libera un cupo.'),
  ('encuesta_activa', 'true', 'mensajes', 'Activa el envío de la encuesta post-cita a quienes asistieron.'),

  -- Notificaciones (§9.1) -- categoría 'mensajes', admin-only.
  ('horas_recordatorio_24h', '24', 'mensajes', 'Horas antes de la cita para el primer recordatorio.'),
  ('horas_recordatorio_3h', '3', 'mensajes', 'Horas antes de la cita para el recordatorio final.'),
  ('horas_encuesta_post_cita', '3', 'mensajes', 'Horas después de la cita para enviar la encuesta, solo a quien asistió.'),

  -- Destinos de respaldo para avisos internos (§9.3) -- categoría 'mensajes'.
  ('notificaciones_correo_respaldo', '"redes@revitalcentrosmedicos.com"', 'mensajes', 'Correo de respaldo para avisos internos del centro.'),
  ('notificaciones_whatsapp_respaldo', '"0967429574"', 'mensajes', 'WhatsApp de respaldo para avisos internos del centro.'),

  -- Dominio público (§7.6) -- categoría 'integraciones', admin-only.
  ('dominio_publico', 'null', 'integraciones', 'Dominio donde corre la web pública. Null = subdominio de Vercel por defecto.'),

  -- Retención LOPDP (§12.4) -- categoría 'integraciones'.
  ('retencion_anios_sin_actividad', '5', 'integraciones', 'Años sin actividad antes de marcar un paciente como candidato a purga.')

on conflict (clave) do nothing;

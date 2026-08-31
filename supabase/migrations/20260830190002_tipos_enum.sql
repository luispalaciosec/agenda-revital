create type public.tipo_documento_enum as enum ('cedula', 'pasaporte');

create type public.parentesco_convenio_enum as enum (
  'TITULAR', 'CONYUGE', 'HIJO', 'PADRE', 'MADRE', 'OTRO'
);

create type public.modo_agenda_enum as enum ('exacto', 'bloque', 'solicitud');

create type public.tipo_excepcion_enum as enum ('feriado', 'vacaciones', 'ausencia', 'bloqueo');

create type public.alcance_excepcion_enum as enum ('sede', 'medico', 'consultorio');

create type public.tipo_lista_precio_enum as enum ('pvp', 'promocional', 'aseguradora', 'convenio');

create type public.estado_cita_enum as enum (
  'solicitada', 'en_gestion', 'confirmada', 'atendida', 'no_show',
  'cancelada_paciente', 'cancelada_centro', 'reprogramada', 'rechazada'
);

create type public.canal_cita_enum as enum ('web', 'bot', 'panel');

create type public.resultado_solicitud_enum as enum ('aceptada', 'rechazada', 'vencida');

create type public.estado_lista_espera_enum as enum (
  'esperando', 'notificado', 'tomado', 'expirado', 'cancelado'
);

create type public.rol_usuario_enum as enum ('admin', 'admisionista', 'medico');

create type public.canal_notificacion_enum as enum ('whatsapp', 'correo');

create type public.tipo_notificacion_enum as enum (
  'otp', 'confirmacion', 'recordatorio_24h', 'recordatorio_3h',
  'encuesta', 'aviso_interno'
);

create type public.estado_notificacion_enum as enum ('pendiente', 'enviada', 'fallida', 'cancelada');

create type public.tipo_consentimiento_enum as enum ('tratamiento_datos', 'marketing');

create type public.otorgado_por_enum as enum ('paciente', 'representante');

create type public.accion_auditoria_enum as enum ('crear', 'actualizar', 'eliminar');

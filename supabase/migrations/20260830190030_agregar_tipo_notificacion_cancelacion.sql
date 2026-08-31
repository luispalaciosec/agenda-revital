-- Nuevo valor de tipo_notificacion_enum para avisar al paciente que su
-- cita fue cancelada (cancelación masiva, §4.5). Aparte de la función
-- que lo usa (cancelar_dia_medico): ALTER TYPE ... ADD VALUE no puede
-- usarse en la misma transacción en la que el valor nuevo se referencia.
alter type public.tipo_notificacion_enum add value 'cancelacion';

-- Semilla del catálogo inicial (§5). El tarifario completo (593 servicios,
-- codigo_revital y PVP reales) NO se incluye aquí: no hay ese archivo
-- entregado todavía (docs/plantillas solo trae la plantilla de convenios).
-- Sin servicios reales, esta semilla tampoco puede crear citas de prueba.
-- Cargar el tarifario es un paso de datos aparte, no de esquema.

do $$
declare
  v_sede_id uuid;
begin
  insert into public.sedes (nombre, direccion, hora_apertura_lv, hora_cierre_lv, hora_apertura_sab, hora_cierre_sab)
  values ('Revital Centros Médicos', 'C.C. Olímpico, Av. Kennedy, Guayaquil, Ecuador', '07:00', '17:30', '07:30', '13:00')
  returning id into v_sede_id;

  insert into public.consultorios (sede_id, nombre, numero)
  select v_sede_id, 'Consultorio ' || n, n from generate_series(1, 7) as n;

  -- Especialidades (§5). Las 5 marcadas [huérfana] no tienen médico
  -- todavía (§5.1): quedan con visible_web/visible_bot en false por el
  -- trigger de recalcular_visibilidad_especialidad, sin intervención manual.
  -- duracion_min de las huérfanas y de Gastroenterología es un valor
  -- provisional [PENDIENTE], igual que en el documento fuente (§17).
  insert into public.especialidades (sede_id, nombre, slug, modo, duracion_min, cupos_por_bloque) values
    (v_sede_id, 'Medicina general', 'medicina-general', 'bloque', 60, 3),
    (v_sede_id, 'Medicina interna', 'medicina-interna', 'exacto', 30, 1),
    (v_sede_id, 'Ginecología', 'ginecologia', 'exacto', 20, 1),
    (v_sede_id, 'Traumatología', 'traumatologia', 'exacto', 20, 1),
    (v_sede_id, 'Nutrición', 'nutricion', 'exacto', 30, 1),
    (v_sede_id, 'Gastroenterología', 'gastroenterologia', 'exacto', 30, 1),
    (v_sede_id, 'Psicología', 'psicologia', 'exacto', 45, 1),
    (v_sede_id, 'Odontología', 'odontologia', 'exacto', 30, 1),
    (v_sede_id, 'Terapia física', 'terapia-fisica', 'exacto', 45, 1),
    (v_sede_id, 'Endodoncia', 'endodoncia', 'solicitud', 60, 1),
    (v_sede_id, 'Cirugía maxilofacial', 'cirugia-maxilofacial', 'solicitud', 60, 1),
    (v_sede_id, 'Rehabilitación', 'rehabilitacion', 'solicitud', 45, 1),
    (v_sede_id, 'Urología', 'urologia', 'solicitud', 20, 1),
    (v_sede_id, 'Dermatología', 'dermatologia', 'solicitud', 20, 1),
    (v_sede_id, 'Laboratorio', 'laboratorio', 'bloque', 30, 4),
    (v_sede_id, 'Rayos X', 'rayos-x', 'exacto', 15, 1),
    (v_sede_id, 'Ecografía', 'ecografia', 'exacto', 20, 1),
    (v_sede_id, 'Cardiología', 'cardiologia', 'exacto', 20, 1),        -- [huérfana][PENDIENTE duración]
    (v_sede_id, 'Pediatría', 'pediatria', 'exacto', 20, 1),            -- [huérfana][PENDIENTE duración]
    (v_sede_id, 'Otorrinolaringología', 'otorrinolaringologia', 'exacto', 20, 1), -- [huérfana][PENDIENTE duración]
    (v_sede_id, 'Oftalmología', 'oftalmologia', 'exacto', 20, 1),      -- [huérfana][PENDIENTE duración]
    (v_sede_id, 'Neumología', 'neumologia', 'solicitud', 30, 1);       -- [huérfana][PENDIENTE duración] -- solo procedimiento PNM-ESP

  -- Médicos (§5). cedula queda null a propósito -- ver migración de
  -- especialidades_medicos. consultorio_default_id queda null: el mapa de
  -- consultorios todavía no llega (§16).
  insert into public.medicos (sede_id, nombres, apellidos, titulo) values
    (v_sede_id, 'John', 'Méndez', 'Dr.'),
    (v_sede_id, 'Kenny', 'Zambrano', 'Dra.'),
    (v_sede_id, 'Nyree', 'Jurado', 'Dra.'),
    (v_sede_id, 'Martha', 'Escobar', 'Dra.'),
    (v_sede_id, 'Aníbal', 'Gonzaga', 'Dr.'),
    (v_sede_id, 'Cindy', 'Zambrano', 'Lcda.'),
    (v_sede_id, 'Martha', 'Zambrano', 'Dra.'),
    (v_sede_id, 'Diana', 'García', 'Ps.'),
    (v_sede_id, 'Solange', 'Montilla', 'Od.'),
    (v_sede_id, 'Elizabeth', 'Pico', 'Od.'),
    (v_sede_id, 'Verónica', 'Villafuerte', 'Lcda.'),
    (v_sede_id, 'Becsy', 'Bravo', 'Dra.'),
    (v_sede_id, 'Alberto', 'Tandazo', 'Dr.'),
    (v_sede_id, 'David', 'Magallanes', 'Dr.'),
    (v_sede_id, 'Óscar', 'González', 'Dr.'),
    (v_sede_id, 'Gladys', 'Ramírez', 'Dra.');
end $$;

-- medico_especialidad: cada insert dispara recalcular_visibilidad_especialidad,
-- que enciende visible_web/visible_bot en cuanto hay médico activo.
insert into public.medico_especialidad (medico_id, especialidad_id)
select m.id, e.id
from public.medicos m
join public.especialidades e on true
where (m.nombres, m.apellidos, e.slug) in (
  ('John', 'Méndez', 'medicina-general'),
  ('Kenny', 'Zambrano', 'medicina-general'),
  ('Nyree', 'Jurado', 'medicina-interna'),
  ('Martha', 'Escobar', 'ginecologia'),
  ('Aníbal', 'Gonzaga', 'traumatologia'),
  ('Cindy', 'Zambrano', 'nutricion'),
  ('Martha', 'Zambrano', 'gastroenterologia'),
  ('Diana', 'García', 'psicologia'),
  ('Solange', 'Montilla', 'odontologia'),
  ('Elizabeth', 'Pico', 'odontologia'),
  ('Verónica', 'Villafuerte', 'terapia-fisica'),
  ('Becsy', 'Bravo', 'endodoncia'),
  ('Alberto', 'Tandazo', 'cirugia-maxilofacial'),
  ('David', 'Magallanes', 'rehabilitacion'),
  ('Óscar', 'González', 'urologia'),
  ('Gladys', 'Ramírez', 'dermatologia')
);

-- Horarios (§5). Solo especialidades en modo exacto/bloque con médico
-- asignado tienen franjas -- las de modo 'solicitud' no generan cupos
-- (§4.2) y Rayos X/Ecografía/huérfanas no tienen horario porque no hay
-- médico asignado todavía (§17). Sábado queda sin cargar: no se especificó
-- quién atiende (§17 pendiente #2).
insert into public.horarios (medico_id, especialidad_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque)
select m.id, e.id, dia, f.hora_inicio, f.hora_fin, e.modo, e.duracion_min, e.cupos_por_bloque
from (values
  ('John', 'Méndez', 'medicina-general', time '08:00', time '12:30'),
  ('Kenny', 'Zambrano', 'medicina-general', time '12:30', time '17:00'),
  ('Martha', 'Escobar', 'ginecologia', time '14:30', time '15:30'),
  ('Cindy', 'Zambrano', 'nutricion', time '14:30', time '17:00'),
  ('Martha', 'Zambrano', 'gastroenterologia', time '12:30', time '17:00'),
  ('Solange', 'Montilla', 'odontologia', time '08:00', time '12:30'),
  ('Elizabeth', 'Pico', 'odontologia', time '12:30', time '17:00'),
  ('Verónica', 'Villafuerte', 'terapia-fisica', time '08:00', time '17:00')
) as f(nombres, apellidos, slug, hora_inicio, hora_fin)
join public.medicos m on (m.nombres, m.apellidos) = (f.nombres, f.apellidos)
join public.especialidades e on e.slug = f.slug
cross join generate_series(1, 5) as dia; -- lunes a viernes

-- Franjas de un solo día (§5).
insert into public.horarios (medico_id, especialidad_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque)
select m.id, e.id, f.dia, f.hora_inicio, f.hora_fin, e.modo, e.duracion_min, e.cupos_por_bloque
from (values
  ('Nyree', 'Jurado', 'medicina-interna', 3, time '15:30', time '17:00'), -- miércoles
  ('Aníbal', 'Gonzaga', 'traumatologia', 4, time '16:00', time '17:00'),  -- jueves
  ('Diana', 'García', 'psicologia', 1, time '17:00', time '17:45'),
  ('Diana', 'García', 'psicologia', 2, time '17:00', time '17:45'),
  ('Diana', 'García', 'psicologia', 3, time '17:00', time '17:45'),
  ('Diana', 'García', 'psicologia', 4, time '17:00', time '17:45'),
  ('Diana', 'García', 'psicologia', 5, time '17:00', time '17:45')
) as f(nombres, apellidos, slug, dia, hora_inicio, hora_fin)
join public.medicos m on (m.nombres, m.apellidos) = (f.nombres, f.apellidos)
join public.especialidades e on e.slug = f.slug;

-- Laboratorio: bloque sin médico asignado (§3.1: "— (sin médico)").
insert into public.horarios (medico_id, especialidad_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque)
select null, e.id, dia, time '07:00', time '15:00', e.modo, e.duracion_min, e.cupos_por_bloque
from public.especialidades e
cross join generate_series(1, 5) as dia
where e.slug = 'laboratorio';

-- 10 servicios de ejemplo para poder probar el flujo de citas de punta a
-- punta mientras llega el tarifario real (593 filas, sin entregar
-- todavía). Códigos EJEMPLO-### a propósito: no deben coincidir con
-- códigos reales de Revital cuando se cargue el Excel definitivo. El
-- admin los reemplaza/desactiva desde el panel, no hace falta migración.

do $$
declare
  v_sede_id uuid;
  v_lista_pvp_id uuid;
begin
  select id into v_sede_id from public.sedes limit 1;

  insert into public.listas_precio (nombre, tipo, activa)
  values ('Tarifario PVP', 'pvp', true)
  returning id into v_lista_pvp_id;

  with datos(codigo, descripcion, slug, tipo, precio) as (
    values
      ('EJEMPLO-001', 'Consulta de medicina general', 'medicina-general', 'consulta', 15.00),
      ('EJEMPLO-002', 'Consulta de ginecología', 'ginecologia', 'consulta', 25.00),
      ('EJEMPLO-003', 'Consulta de traumatología', 'traumatologia', 'consulta', 25.00),
      ('EJEMPLO-004', 'Consulta de nutrición', 'nutricion', 'consulta', 20.00),
      ('EJEMPLO-005', 'Consulta de psicología', 'psicologia', 'consulta', 30.00),
      ('EJEMPLO-006', 'Consulta de odontología', 'odontologia', 'consulta', 20.00),
      ('EJEMPLO-007', 'Sesión de terapia física', 'terapia-fisica', 'procedimiento', 18.00),
      ('EJEMPLO-008', 'Consulta de medicina interna', 'medicina-interna', 'consulta', 25.00),
      ('EJEMPLO-009', 'Hematología - Sangre', 'laboratorio', 'laboratorio', 8.00),
      ('EJEMPLO-010', 'Endodoncia', 'endodoncia', 'procedimiento', 80.00)
  )
  insert into public.servicios (
    sede_id, codigo_revital, tipo, descripcion, especialidad_id,
    agendable, requiere_aprobacion, visible_web, visible_bot, activo
  )
  select v_sede_id, d.codigo, d.tipo, d.descripcion, e.id,
         true, (e.modo = 'solicitud'), true, true, true
  from datos d
  join public.especialidades e on e.slug = d.slug and e.sede_id = v_sede_id;

  with precios_ejemplo(codigo, precio) as (
    values
      ('EJEMPLO-001', 15.00), ('EJEMPLO-002', 25.00), ('EJEMPLO-003', 25.00),
      ('EJEMPLO-004', 20.00), ('EJEMPLO-005', 30.00), ('EJEMPLO-006', 20.00),
      ('EJEMPLO-007', 18.00), ('EJEMPLO-008', 25.00), ('EJEMPLO-009', 8.00),
      ('EJEMPLO-010', 80.00)
  )
  insert into public.precios (lista_precio_id, servicio_id, valor)
  select v_lista_pvp_id, s.id, p.precio
  from precios_ejemplo p
  join public.servicios s on s.codigo_revital = p.codigo and s.sede_id = v_sede_id;
end $$;

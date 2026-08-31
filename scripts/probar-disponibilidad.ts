/**
 * Script manual, no forma parte de la app: valida el motor de
 * disponibilidad (lib/disponibilidad/calcular.ts) contra los datos
 * reales sembrados en Supabase antes de construir cualquier interfaz
 * encima.
 *
 * No usa lib/disponibilidad/index.ts a propósito: ese archivo tiene
 * `import "server-only"`, que solo funciona detrás del bundler de
 * Next.js (aquí correría bajo Node puro y siempre tira error). Este
 * script arma el mismo contexto a mano, duplicando la consulta, para no
 * aflojar esa guarda en el código de la app.
 *
 *   npx tsx --env-file=.env.local scripts/probar-disponibilidad.ts
 */
import { createClient } from "@supabase/supabase-js";
import { calcularDisponibilidad } from "../lib/disponibilidad/calcular";
import { sumarDias } from "../lib/disponibilidad/tiempo";
import type { ContextoDisponibilidad, ParametrosDisponibilidad } from "../lib/disponibilidad/tipos";
import type { Database } from "../lib/supabase/database.types";

const IDS = {
  ginecologia: "93f3ed66-c0b0-4f7e-9c96-e48e2ae6e24e",
  medicinaGeneral: "3af15b39-5f85-492b-ad57-017d30729bad",
  laboratorio: "ede3018b-c629-4c43-ba30-7a7ff560d07c",
  drMendez: "4f4eba7e-ad95-4c38-b743-3fe98c1cdfbf",
};

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function armarContexto(params: ParametrosDisponibilidad): Promise<ContextoDisponibilidad> {
  const { data: especialidad, error: errorEspecialidad } = await supabase
    .from("especialidades")
    .select("id, sede_id")
    .eq("id", params.especialidadId)
    .single();
  if (errorEspecialidad || !especialidad) throw new Error("Especialidad no encontrada");

  const desdeInicioDia = `${params.desde}T00:00:00-05:00`;
  const hastaFinDia = `${params.hasta}T23:59:59-05:00`;

  const [sede, horarios, excepciones, citas, config] = await Promise.all([
    supabase
      .from("sedes")
      .select("hora_apertura_lv, hora_cierre_lv, hora_apertura_sab, hora_cierre_sab")
      .eq("id", especialidad.sede_id)
      .single(),
    supabase
      .from("horarios")
      .select("id, medico_id, especialidad_id, consultorio_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque, vigente_desde, vigente_hasta")
      .eq("especialidad_id", params.especialidadId)
      .eq("activo", true),
    supabase
      .from("excepciones_agenda")
      .select("alcance, medico_id, consultorio_id, sede_id, fecha_desde, fecha_hasta, hora_inicio, hora_fin")
      .lte("fecha_desde", params.hasta)
      .gte("fecha_hasta", params.desde),
    supabase
      .from("citas")
      .select("medico_id, especialidad_id, inicio")
      .eq("especialidad_id", params.especialidadId)
      .in("estado", ["solicitada", "en_gestion", "confirmada"])
      .gte("inicio", desdeInicioDia)
      .lte("inicio", hastaFinDia),
    supabase
      .from("configuracion")
      .select("clave, valor")
      .in("clave", ["anticipacion_minima_horas", "anticipacion_maxima_dias", "validar_consultorios"]),
  ]);

  if (sede.error || !sede.data) throw sede.error ?? new Error("sede sin datos");
  if (horarios.error) throw horarios.error;
  if (excepciones.error) throw excepciones.error;
  if (citas.error) throw citas.error;
  if (config.error) throw config.error;

  const configMap = new Map(config.data.map((c) => [c.clave, c.valor]));

  return {
    sedeId: especialidad.sede_id,
    sede: {
      horaAperturaLv: sede.data.hora_apertura_lv,
      horaCierreLv: sede.data.hora_cierre_lv,
      horaAperturaSab: sede.data.hora_apertura_sab,
      horaCierreSab: sede.data.hora_cierre_sab,
    },
    horarios: horarios.data.map((h) => ({
      id: h.id,
      medicoId: h.medico_id,
      especialidadId: h.especialidad_id,
      consultorioId: h.consultorio_id,
      diaSemana: h.dia_semana,
      horaInicio: h.hora_inicio,
      horaFin: h.hora_fin,
      modo: h.modo,
      duracionMin: h.duracion_min,
      cuposPorBloque: h.cupos_por_bloque,
      vigenteDesde: h.vigente_desde,
      vigenteHasta: h.vigente_hasta,
    })),
    excepciones: excepciones.data.map((e) => ({
      alcance: e.alcance,
      medicoId: e.medico_id,
      consultorioId: e.consultorio_id,
      sedeId: e.sede_id,
      fechaDesde: e.fecha_desde,
      fechaHasta: e.fecha_hasta,
      horaInicio: e.hora_inicio,
      horaFin: e.hora_fin,
    })),
    citasActivas: citas.data.map((c) => ({
      medicoId: c.medico_id,
      especialidadId: c.especialidad_id,
      inicio: c.inicio,
    })),
    configuracion: {
      anticipacionMinimaHoras: (configMap.get("anticipacion_minima_horas") as number) ?? 3,
      anticipacionMaximaDias: (configMap.get("anticipacion_maxima_dias") as number) ?? 60,
      validarConsultorios: (configMap.get("validar_consultorios") as boolean) ?? false,
    },
    ahora: new Date(),
  };
}

function hoyGuayaquil(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function probar(nombre: string, params: ParametrosDisponibilidad) {
  console.log(`\n=== ${nombre} ===`);
  console.log("params:", params);
  const contexto = await armarContexto(params);
  console.log(`horarios encontrados: ${contexto.horarios.length} · citas activas en rango: ${contexto.citasActivas.length}`);
  const dias = calcularDisponibilidad(params, contexto);
  if (dias.length === 0) {
    console.log("(sin franjas en el rango)");
    return;
  }
  for (const dia of dias) {
    console.log(`${dia.fecha}: ${dia.franjas.length} franja(s)`);
    for (const f of dia.franjas.slice(0, 4)) {
      console.log(`  ${f.inicio} → ${f.fin} · cupos=${f.cuposDisponibles} · medico=${f.medicoId ?? "—"}`);
    }
    if (dia.franjas.length > 4) console.log(`  ... y ${dia.franjas.length - 4} más`);
  }
}

async function main() {
  const desde = sumarDias(hoyGuayaquil(), 1); // mañana, para no chocar con la anticipación mínima de hoy
  const hasta = sumarDias(desde, 10);

  await probar("Ginecología (modo exacto, un solo médico)", { especialidadId: IDS.ginecologia, desde, hasta });
  await probar("Medicina general (modo bloque, dos médicos)", { especialidadId: IDS.medicinaGeneral, desde, hasta });
  await probar("Medicina general filtrada a Dr. Méndez", {
    especialidadId: IDS.medicinaGeneral,
    medicoId: IDS.drMendez,
    desde,
    hasta,
  });
  await probar("Laboratorio (bloque, sin médico asignado)", { especialidadId: IDS.laboratorio, desde, hasta });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

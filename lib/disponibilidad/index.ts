import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { calcularDisponibilidad } from "./calcular";
import type { ContextoDisponibilidad, DisponibilidadDia, ParametrosDisponibilidad } from "./tipos";

/**
 * Orquestador: trae de Supabase todo lo que el cálculo puro necesita y
 * arma el `ContextoDisponibilidad`. Usa el service role porque el bot y
 * la web pública consultan disponibilidad sin sesión de panel — la
 * validación real ocurre acá, en el servidor (§6.2), nunca en el cliente.
 */
export async function obtenerDisponibilidad(
  params: ParametrosDisponibilidad
): Promise<Array<{ fecha: string; franjas: Array<{ inicio: string; fin: string; cuposDisponibles: number; medicoId: string | null; consultorioId: string | null }> }>> {
  const supabase = crearClienteServicio();

  const { data: especialidad, error: errorEspecialidad } = await supabase
    .from("especialidades")
    .select("id, sede_id")
    .eq("id", params.especialidadId)
    .single();

  if (errorEspecialidad || !especialidad) {
    throw new Error(`Especialidad ${params.especialidadId} no encontrada`);
  }

  const desdeInicioDia = `${params.desde}T00:00:00-05:00`;
  const hastaFinDia = `${params.hasta}T23:59:59-05:00`;

  let horariosQuery = supabase
    .from("horarios")
    .select(
      "id, medico_id, especialidad_id, consultorio_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque, vigente_desde, vigente_hasta"
    )
    .eq("especialidad_id", params.especialidadId)
    .eq("activo", true);
  if (params.medicoId) horariosQuery = horariosQuery.eq("medico_id", params.medicoId);

  const [sedeResult, horariosResult, excepcionesResult, citasResult, configResult] = await Promise.all([
    supabase
      .from("sedes")
      .select("hora_apertura_lv, hora_cierre_lv, hora_apertura_sab, hora_cierre_sab")
      .eq("id", especialidad.sede_id)
      .single(),
    horariosQuery,
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

  if (sedeResult.error || !sedeResult.data) throw new Error("No se pudo leer el horario de la sede");
  if (horariosResult.error) throw horariosResult.error;
  if (excepcionesResult.error) throw excepcionesResult.error;
  if (citasResult.error) throw citasResult.error;
  if (configResult.error) throw configResult.error;

  const config = new Map(configResult.data.map((c) => [c.clave, c.valor]));

  const contexto: ContextoDisponibilidad = {
    sedeId: especialidad.sede_id,
    sede: {
      horaAperturaLv: sedeResult.data.hora_apertura_lv,
      horaCierreLv: sedeResult.data.hora_cierre_lv,
      horaAperturaSab: sedeResult.data.hora_apertura_sab,
      horaCierreSab: sedeResult.data.hora_cierre_sab,
    },
    horarios: horariosResult.data.map((h) => ({
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
    excepciones: excepcionesResult.data.map((e) => ({
      alcance: e.alcance,
      medicoId: e.medico_id,
      consultorioId: e.consultorio_id,
      sedeId: e.sede_id,
      fechaDesde: e.fecha_desde,
      fechaHasta: e.fecha_hasta,
      horaInicio: e.hora_inicio,
      horaFin: e.hora_fin,
    })),
    citasActivas: citasResult.data.map((c) => ({
      medicoId: c.medico_id,
      especialidadId: c.especialidad_id,
      inicio: c.inicio,
    })),
    configuracion: {
      anticipacionMinimaHoras: (config.get("anticipacion_minima_horas") as number) ?? 3,
      anticipacionMaximaDias: (config.get("anticipacion_maxima_dias") as number) ?? 60,
      validarConsultorios: (config.get("validar_consultorios") as boolean) ?? false,
    },
    ahora: new Date(),
  };

  const dias: DisponibilidadDia[] = calcularDisponibilidad(params, contexto);

  // El contrato público de /api/v1/disponibilidad (§6.1) no incluye
  // especialidad_id en cada franja: ya viene implícito en el parámetro
  // de la consulta.
  return dias.map((dia) => ({
    fecha: dia.fecha,
    franjas: dia.franjas.map((franja) => ({
      inicio: franja.inicio,
      fin: franja.fin,
      cuposDisponibles: franja.cuposDisponibles,
      medicoId: franja.medicoId,
      consultorioId: franja.consultorioId,
    })),
  }));
}

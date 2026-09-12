import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { hoyGuayaquil } from "@/lib/formato";

export interface PuntoAtencion {
  id: string;
  nombre: string;
  orden: number;
  esPuntoLlegada: boolean;
  esPuntoSalida: boolean;
}

export async function listarPuntosAtencion(): Promise<PuntoAtencion[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("puntos_atencion")
    .select("id, nombre, orden, es_punto_llegada, es_punto_salida")
    .eq("activo", true)
    .order("orden");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    orden: p.orden,
    esPuntoLlegada: p.es_punto_llegada,
    esPuntoSalida: p.es_punto_salida,
  }));
}

export interface PacienteEnRecorrido {
  id: string;
  inicio: string;
  puntoAtencionId: string | null;
  puntoAtencionDesde: string | null;
  atendidaEn: string | null;
  paciente: { nombres: string; apellidos: string } | null;
  medico: { nombres: string; apellidos: string; titulo: string | null } | null;
  especialidad: { nombre: string } | null;
  servicio: { descripcion: string } | null;
  consultorio: { nombre: string } | null;
}

/** Todas las citas de hoy que ya están (o estuvieron) físicamente en el centro. Base del tablero de seguimiento. */
export async function obtenerTableroHoy(): Promise<PacienteEnRecorrido[]> {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, inicio, punto_atencion_id, punto_atencion_desde, atendida_en,
       paciente:pacientes(nombres, apellidos),
       medico:medicos(nombres, apellidos, titulo),
       especialidad:especialidades(nombre),
       servicio:servicios(descripcion),
       consultorio:consultorios(nombre)`
    )
    .eq("fecha_local", hoy)
    .in("estado", ["confirmada", "atendida"])
    .not("punto_atencion_id", "is", null)
    .order("punto_atencion_desde");

  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    inicio: c.inicio,
    puntoAtencionId: c.punto_atencion_id,
    puntoAtencionDesde: c.punto_atencion_desde,
    atendidaEn: c.atendida_en,
    paciente: c.paciente,
    medico: c.medico,
    especialidad: c.especialidad,
    servicio: c.servicio,
    consultorio: c.consultorio,
  }));
}

export interface CitaPorLlegar {
  id: string;
  inicio: string;
  paciente: { nombres: string; apellidos: string } | null;
  medico: { nombres: string; apellidos: string; titulo: string | null } | null;
  servicio: { descripcion: string } | null;
  especialidad: { nombre: string } | null;
}

/** Citas confirmadas de hoy que todavía no registran llegada al centro. */
export async function obtenerPorLlegarHoy(): Promise<CitaPorLlegar[]> {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, inicio,
       paciente:pacientes(nombres, apellidos),
       medico:medicos(nombres, apellidos, titulo),
       servicio:servicios(descripcion),
       especialidad:especialidades(nombre)`
    )
    .eq("fecha_local", hoy)
    .eq("estado", "confirmada")
    .is("punto_atencion_id", null)
    .order("inicio");

  if (error) throw error;
  return data ?? [];
}

/** Registra el paso de un paciente a otro punto del recorrido (bitácora + ubicación actual, en una sola operación atómica). */
export async function moverPacientePunto(citaId: string, puntoId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("mover_paciente_punto", { p_cita_id: citaId, p_punto_id: puntoId });
  if (error) throw error;
}

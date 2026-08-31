import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ModoAgenda = Database["public"]["Enums"]["modo_agenda_enum"];

export interface HorarioFila {
  id: string;
  medicoId: string | null;
  consultorioId: string | null;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modo: ModoAgenda;
  duracionMin: number;
  cuposPorBloque: number;
  activo: boolean;
}

export interface DatosHorario {
  medicoId: string | null;
  consultorioId: string | null;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modo: ModoAgenda;
  duracionMin: number;
  cuposPorBloque: number;
  activo: boolean;
}

export async function listarHorarios(especialidadId: string): Promise<HorarioFila[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("horarios")
    .select("id, medico_id, consultorio_id, dia_semana, hora_inicio, hora_fin, modo, duracion_min, cupos_por_bloque, activo")
    .eq("especialidad_id", especialidadId)
    .order("dia_semana")
    .order("hora_inicio");
  if (error) throw error;
  return (data ?? []).map((h) => ({
    id: h.id,
    medicoId: h.medico_id,
    consultorioId: h.consultorio_id,
    diaSemana: h.dia_semana,
    horaInicio: h.hora_inicio,
    horaFin: h.hora_fin,
    modo: h.modo,
    duracionMin: h.duracion_min,
    cuposPorBloque: h.cupos_por_bloque,
    activo: h.activo,
  }));
}

export async function crearHorario(especialidadId: string, datos: DatosHorario) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("horarios").insert({
    especialidad_id: especialidadId,
    medico_id: datos.medicoId,
    consultorio_id: datos.consultorioId,
    dia_semana: datos.diaSemana,
    hora_inicio: datos.horaInicio,
    hora_fin: datos.horaFin,
    modo: datos.modo,
    duracion_min: datos.duracionMin,
    cupos_por_bloque: datos.cuposPorBloque,
    activo: datos.activo,
  });
  if (error) throw error;
}

export async function actualizarHorario(id: string, datos: DatosHorario) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("horarios")
    .update({
      medico_id: datos.medicoId,
      consultorio_id: datos.consultorioId,
      dia_semana: datos.diaSemana,
      hora_inicio: datos.horaInicio,
      hora_fin: datos.horaFin,
      modo: datos.modo,
      duracion_min: datos.duracionMin,
      cupos_por_bloque: datos.cuposPorBloque,
      activo: datos.activo,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarHorario(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("horarios").delete().eq("id", id);
  if (error) throw error;
}

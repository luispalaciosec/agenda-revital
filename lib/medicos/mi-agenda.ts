import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { hoyGuayaquil } from "@/lib/formato";

/** El médico autenticado ve solo sus propios turnos (§CLAUDE.md: rol medico). */
export async function obtenerMedicoActual() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("medico_id, medico:medicos(id, nombres, apellidos, titulo, consultorio_default_id)")
    .eq("auth_user_id", user.id)
    .single();

  if (!usuario?.medico_id || !usuario.medico) {
    // Rol medico sin médico vinculado todavía: un admin debe completar el vínculo en Usuarios.
    return null;
  }
  return usuario.medico;
}

export interface TurnoMedico {
  id: string;
  inicio: string;
  fin: string;
  estado: "solicitada" | "en_gestion" | "confirmada" | "atendida" | "no_show" | "cancelada_paciente" | "cancelada_centro" | "reprogramada" | "rechazada";
  llegadaEn: string | null;
  atendidaEn: string | null;
  puntoAtencionDesde: string | null;
  puntoAtencion: { id: string; nombre: string; esPuntoLlegada: boolean; esPuntoSalida: boolean } | null;
  paciente: { nombres: string; apellidos: string } | null;
  servicio: { descripcion: string } | null;
  especialidad: { nombre: string } | null;
  consultorio: { nombre: string } | null;
}

export async function obtenerMiAgendaHoy(medicoId: string): Promise<TurnoMedico[]> {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, inicio, fin, estado, llegada_en, atendida_en, punto_atencion_desde,
       punto_atencion:puntos_atencion(id, nombre, es_punto_llegada, es_punto_salida),
       paciente:pacientes(nombres, apellidos),
       servicio:servicios(descripcion),
       especialidad:especialidades(nombre),
       consultorio:consultorios(nombre)`
    )
    .eq("medico_id", medicoId)
    .eq("fecha_local", hoy)
    .in("estado", ["confirmada", "atendida"])
    .order("inicio");

  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    inicio: c.inicio,
    fin: c.fin,
    estado: c.estado,
    llegadaEn: c.llegada_en,
    atendidaEn: c.atendida_en,
    puntoAtencionDesde: c.punto_atencion_desde,
    puntoAtencion: c.punto_atencion
      ? { id: c.punto_atencion.id, nombre: c.punto_atencion.nombre, esPuntoLlegada: c.punto_atencion.es_punto_llegada, esPuntoSalida: c.punto_atencion.es_punto_salida }
      : null,
    paciente: c.paciente,
    servicio: c.servicio,
    especialidad: c.especialidad,
    consultorio: c.consultorio,
  }));
}

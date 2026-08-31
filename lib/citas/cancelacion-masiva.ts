import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface CitaAfectada {
  id: string;
  codigoPublico: string | null;
  inicio: string;
  paciente: { nombres: string; apellidos: string } | null;
  servicio: { descripcion: string } | null;
}

export async function listarCitasDelDia(medicoId: string, fecha: string): Promise<CitaAfectada[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("citas")
    .select("id, codigo_publico, inicio, paciente:pacientes(nombres, apellidos), servicio:servicios(descripcion)")
    .eq("medico_id", medicoId)
    .eq("fecha_local", fecha)
    .in("estado", ["solicitada", "en_gestion", "confirmada"])
    .order("inicio");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    codigoPublico: c.codigo_publico,
    inicio: c.inicio,
    paciente: c.paciente,
    servicio: c.servicio,
  }));
}

/** §4.5: cancela el día completo de un médico en una acción. */
export async function cancelarDiaMedico(medicoId: string, fecha: string, motivo?: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("cancelar_dia_medico", {
    p_medico_id: medicoId,
    p_fecha: fecha,
    p_motivo: motivo || undefined,
  });
  if (error) throw error;
  return data ?? 0;
}

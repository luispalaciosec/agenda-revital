import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { dispararEventoAgendamiento } from "@/lib/analitica/eventos";

export async function gestionarSolicitud(solicitudId: string, aceptar: boolean, observacion?: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("gestionar_solicitud", {
    p_solicitud_id: solicitudId,
    p_aceptar: aceptar,
    p_observacion: observacion || undefined,
  });
  if (error) throw error;

  if (aceptar) await dispararEventoAgendamiento(data.cita_id);

  return data;
}

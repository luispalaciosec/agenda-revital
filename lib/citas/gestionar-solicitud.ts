import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function gestionarSolicitud(solicitudId: string, aceptar: boolean, observacion?: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("gestionar_solicitud", {
    p_solicitud_id: solicitudId,
    p_aceptar: aceptar,
    p_observacion: observacion || undefined,
  });
  if (error) throw error;
  return data;
}

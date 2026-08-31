import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

/** La admisionista marca la llegada al recibir al paciente (§8.2). */
export async function marcarLlegada(citaId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("citas")
    .update({ llegada_en: new Date().toISOString() })
    .eq("id", citaId)
    .eq("estado", "confirmada")
    .is("llegada_en", null);
  if (error) throw error;
}

/** Cierra el ciclo de vida de la cita (§4.1: confirmada → atendida). */
export async function marcarAtendida(citaId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("citas")
    .update({ atendida_en: new Date().toISOString(), estado: "atendida" })
    .eq("id", citaId)
    .eq("estado", "confirmada")
    .not("llegada_en", "is", null);
  if (error) throw error;
}

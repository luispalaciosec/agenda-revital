import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

const ESTADOS_CANCELABLES = ["solicitada", "en_gestion", "confirmada"] as const;

/**
 * Cancela una cita desde el panel. 'cancelada_paciente' vs 'cancelada_centro'
 * (§4.1) importa para reportes de no-show/cancelación (§8.4) — no es solo
 * un detalle cosmético, así que lo elige quien cancela, no se asume.
 */
export async function cancelarCitaPanel(citaId: string, quienCancela: "paciente" | "centro", motivo?: string) {
  const supabase = await crearClienteServidor();

  const { data: cita, error: errorLectura } = await supabase
    .from("citas")
    .select("id, estado, nota_admision")
    .eq("id", citaId)
    .single();
  if (errorLectura) throw errorLectura;
  if (!ESTADOS_CANCELABLES.includes(cita.estado as (typeof ESTADOS_CANCELABLES)[number])) {
    throw new Error("Esta cita ya no se puede cancelar (no está activa).");
  }

  const notaAdmision = motivo
    ? [cita.nota_admision, `Cancelada: ${motivo}`].filter(Boolean).join("\n")
    : cita.nota_admision;

  const { error } = await supabase
    .from("citas")
    .update({
      estado: quienCancela === "paciente" ? "cancelada_paciente" : "cancelada_centro",
      nota_admision: notaAdmision,
    })
    .eq("id", citaId);
  if (error) throw error;
}

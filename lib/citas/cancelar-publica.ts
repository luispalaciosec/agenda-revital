import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

const ESTADOS_CANCELABLES = ["solicitada", "en_gestion", "confirmada"] as const;

/**
 * Cancela una cita desde el bot o /mis-citas. `contactoId` es quien pide
 * la cancelación (verificado por WhatsApp u OTP) — solo puede cancelar
 * citas que él mismo agendó, nunca las de otro contacto por adivinar un id.
 */
export async function cancelarCitaPublica(citaId: string, contactoId: string, motivo?: string) {
  const supabase = crearClienteServicio();

  const { data: cita, error: errorLectura } = await supabase
    .from("citas")
    .select("id, estado, nota_admision, contacto_id")
    .eq("id", citaId)
    .single();
  if (errorLectura) throw errorLectura;
  if (cita.contacto_id !== contactoId) throw new Error("Esta cita no pertenece a este contacto");
  if (!ESTADOS_CANCELABLES.includes(cita.estado as (typeof ESTADOS_CANCELABLES)[number])) {
    throw new Error("Esta cita ya no se puede cancelar (no está activa).");
  }

  const notaAdmision = motivo ? [cita.nota_admision, `Cancelada por el paciente: ${motivo}`].filter(Boolean).join("\n") : cita.nota_admision;

  const { error } = await supabase
    .from("citas")
    .update({ estado: "cancelada_paciente", nota_admision: notaAdmision })
    .eq("id", citaId);
  if (error) throw error;
}

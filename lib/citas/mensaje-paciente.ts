import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

/** Texto ya redactado por estado (§6.2) para que el bot solo lo repita. */
export function mensajeParaPaciente(estado: EstadoCita, codigoPublico: string | null, direccionSede?: string | null): string {
  const codigo = codigoPublico ?? "";
  const ubicacion = direccionSede ? ` Te esperamos en ${direccionSede}.` : " Te esperamos.";
  switch (estado) {
    case "confirmada":
      return `Tu cita quedó confirmada${codigo ? ` (código ${codigo})` : ""}.${ubicacion}`;
    case "solicitada":
    case "en_gestion":
      return "Estamos confirmando tu cita, te avisamos en breve.";
    default:
      return "Tu cita fue registrada.";
  }
}

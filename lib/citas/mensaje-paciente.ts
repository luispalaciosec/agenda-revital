import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

export interface InfoPracticaCita {
  direccionSede?: string | null;
  anticipacionMinutos?: number | null;
  infoPago?: string | null;
  infoParqueo?: string | null;
}

/** Texto ya redactado por estado (§6.2) para que el bot solo lo repita. */
export function mensajeParaPaciente(estado: EstadoCita, codigoPublico: string | null, info?: InfoPracticaCita): string {
  const codigo = codigoPublico ?? "";
  switch (estado) {
    case "confirmada": {
      const partes = [`¡Listo! Tu cita quedó confirmada${codigo ? ` (código ${codigo})` : ""}.`];
      if (info?.direccionSede) partes.push(`Nos encontramos en ${info.direccionSede}.`);
      if (info?.anticipacionMinutos) partes.push(`Te recomendamos llegar unos ${info.anticipacionMinutos} minutos antes.`);
      if (info?.infoPago) partes.push(info.infoPago);
      if (info?.infoParqueo) partes.push(info.infoParqueo);
      partes.push("¡Te esperamos!");
      return partes.join(" ");
    }
    case "solicitada":
    case "en_gestion":
      return "Ya recibimos tu solicitud, en breve te confirmamos tu cita.";
    default:
      return "Tu cita fue registrada.";
  }
}

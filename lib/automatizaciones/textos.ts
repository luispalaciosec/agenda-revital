import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { formatoFechaDMY, formatoHora } from "@/lib/formato";
import { aLocal } from "@/lib/disponibilidad/tiempo";

type TipoNotificacion = Database["public"]["Enums"]["tipo_notificacion_enum"];

async function dominioPublico(supabase: SupabaseClient<Database>): Promise<string> {
  const { data } = await supabase.from("configuracion").select("valor").eq("clave", "dominio_publico").single();
  const valor = data?.valor as Json;
  return typeof valor === "string" && valor ? valor : "https://agenda-revital.vercel.app";
}

/** Arma el texto de cada tipo de notificación (§9.1). Nunca menciona la especialidad fuera de lo estrictamente necesario para que el paciente reconozca su cita — nunca a plataformas publicitarias (eso es un canal totalmente distinto, ver lib/analitica). */
export async function textoNotificacion(
  supabase: SupabaseClient<Database>,
  tipo: TipoNotificacion,
  citaId: string | null,
  plantilla?: string | null
): Promise<string> {
  if (plantilla === "aviso:cupo_liberado") {
    const dominio = await dominioPublico(supabase);
    return `Se liberó un cupo que esperabas en Revital. Agéndalo pronto antes de que se lo demos al siguiente en la lista: ${dominio}/agendar`;
  }
  if (!citaId) return "Tienes una novedad en Agenda Revital.";

  const { data: cita } = await supabase
    .from("citas")
    .select(
      "codigo_publico, inicio, nota_admision, paciente:pacientes(nombres, apellidos), medico:medicos(nombres, apellidos, titulo), servicio:servicios(descripcion, preparacion_previa), sede:sedes(direccion)"
    )
    .eq("id", citaId)
    .maybeSingle();
  if (!cita) return "Tienes una novedad sobre una cita en Agenda Revital.";

  const local = aLocal(new Date(cita.inicio));
  const fechaHora = `${formatoFechaDMY(local.fecha)} a las ${formatoHora(cita.inicio)}`;
  const medico = cita.medico ? `con ${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`.replace(/\s+/g, " ").trim() : "";
  const dominio = await dominioPublico(supabase);
  const enlaceMisCitas = `${dominio}/mis-citas`;

  switch (tipo) {
    case "confirmacion": {
      const preparacion = cita.servicio?.preparacion_previa ? ` ${cita.servicio.preparacion_previa}` : "";
      return `Tu cita de ${cita.servicio?.descripcion ?? "Revital"} ${medico} es el ${fechaHora}, en ${cita.sede?.direccion ?? "Revital Centros Médicos"}.${preparacion} Gestiona tu cita en ${enlaceMisCitas} (código ${cita.codigo_publico ?? ""}).`;
    }
    case "recordatorio_24h":
      return `Recordatorio: mañana ${formatoHora(cita.inicio)} tienes cita ${medico} en Revital. Responde "Sí, voy a ir" o "Necesito cambiarla".`;
    case "recordatorio_3h":
      return `Tu cita es hoy a las ${formatoHora(cita.inicio)} ${medico}. Te esperamos en Revital.`;
    case "cancelacion":
      return `Tu cita del ${fechaHora} fue cancelada.${cita.nota_admision ? ` ${cita.nota_admision}` : ""} Si quieres agendar de nuevo: ${dominio}/agendar`;
    case "encuesta":
      return `Gracias por visitarnos hoy. ¿Cómo calificarías tu atención en Revital del 1 al 5?`;
    case "aviso_interno": {
      const paciente = cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : "un paciente";
      const etiquetas: Record<string, string> = {
        "aviso:cita_nueva": "Cita nueva",
        "aviso:solicitud_por_gestionar": "Solicitud por gestionar",
        "aviso:solicitud_proxima_vencer": "Solicitud próxima a vencer",
        "aviso:cancelacion_paciente": "El paciente canceló",
      };
      const etiqueta = (plantilla && etiquetas[plantilla]) || "Aviso";
      return `[${etiqueta}] ${paciente} — cita ${cita.codigo_publico ?? ""} el ${fechaHora}.`;
    }
    default:
      return `Tienes una novedad sobre tu cita del ${fechaHora}.`;
  }
}

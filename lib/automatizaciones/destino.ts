import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";

type CanalNotificacion = Database["public"]["Enums"]["canal_notificacion_enum"];
type TipoNotificacion = Database["public"]["Enums"]["tipo_notificacion_enum"];

/** Plantillas de aviso_interno que de verdad van al staff (§9.3). "Cupo liberado" también usa tipo=aviso_interno pero le habla al paciente que espera, no al centro — por eso la ruta se decide por plantilla, no por tipo. */
const PLANTILLAS_PARA_STAFF = new Set([
  "aviso:cita_nueva",
  "aviso:solicitud_por_gestionar",
  "aviso:solicitud_proxima_vencer",
  "aviso:cancelacion_paciente",
]);

/**
 * A quién le llega cada notificación (§9.3): los avisos al staff van a
 * los destinos de respaldo del centro, todas las demás al propio
 * paciente. Las preferencias por usuario (celular/correo propio, qué
 * avisos recibe cada quien) quedan pendientes — hoy solo existe el
 * destino de respaldo único, ver docs/AUTOMATIZACIONES_PENDIENTES.md.
 */
export async function resolverDestino(
  supabase: SupabaseClient<Database>,
  pacienteId: string,
  canal: CanalNotificacion,
  tipo: TipoNotificacion,
  plantilla?: string | null
): Promise<string | null> {
  if (tipo === "aviso_interno" && plantilla && PLANTILLAS_PARA_STAFF.has(plantilla)) {
    const config = await leerConfiguracionServicio(["notificaciones_whatsapp_respaldo", "notificaciones_correo_respaldo"]);
    const valor = canal === "whatsapp" ? config.get("notificaciones_whatsapp_respaldo") : config.get("notificaciones_correo_respaldo");
    return typeof valor === "string" && valor ? valor : null;
  }

  if (canal === "correo") {
    const { data } = await supabase.from("pacientes").select("correo").eq("id", pacienteId).maybeSingle();
    return data?.correo ?? null;
  }

  const { data } = await supabase
    .from("contacto_paciente")
    .select("contacto:contactos(celular)")
    .eq("paciente_id", pacienteId)
    .limit(1)
    .maybeSingle();
  return data?.contacto?.celular ?? null;
}

import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";

/** Encuesta post-cita (§9.1): solo a quien asistió, horas_encuesta_post_cita después de marcarla atendida. */
export async function encolarEncuestasPostCita(): Promise<number> {
  const config = await leerConfiguracionServicio(["encuesta_activa", "horas_encuesta_post_cita"]);
  if (config.get("encuesta_activa") !== true) return 0;
  const horas = typeof config.get("horas_encuesta_post_cita") === "number" ? (config.get("horas_encuesta_post_cita") as number) : 3;

  const supabase = crearClienteServicio();
  const limite = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

  const { data: candidatas, error } = await supabase
    .from("citas")
    .select("id, paciente_id")
    .eq("estado", "atendida")
    .not("atendida_en", "is", null)
    .lte("atendida_en", limite);
  if (error) throw error;
  if (!candidatas || candidatas.length === 0) return 0;

  const { data: existentes } = await supabase
    .from("notificaciones")
    .select("cita_id")
    .eq("tipo", "encuesta")
    .in(
      "cita_id",
      candidatas.map((c) => c.id)
    );
  const yaTienen = new Set((existentes ?? []).map((e) => e.cita_id));
  const pendientes = candidatas.filter((c) => !yaTienen.has(c.id));
  if (pendientes.length === 0) return 0;

  const { error: errorInsert } = await supabase.from("notificaciones").insert(
    pendientes.map((c) => ({
      cita_id: c.id,
      paciente_id: c.paciente_id,
      canal: "whatsapp" as const,
      tipo: "encuesta" as const,
      estado: "pendiente" as const,
      programada_para: new Date().toISOString(),
    }))
  );
  if (errorInsert) throw errorInsert;

  return pendientes.length;
}

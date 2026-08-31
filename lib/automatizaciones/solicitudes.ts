import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

/** SLA de solicitud en gestión (§4.3, 6 horas laborables): pasado vence_en sin resolver, la solicitud vence y la cita se rechaza. */
export async function vencerSolicitudes(): Promise<number> {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase.rpc("vencer_solicitudes");
  if (error) throw error;
  return data ?? 0;
}

/** Aviso a las admisionistas cuando falta poco para que una solicitud venza (§9.3), una sola vez por solicitud. */
export async function avisarSolicitudesProximasAVencer(): Promise<number> {
  const supabase = crearClienteServicio();
  const enUnaHora = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { data: candidatas, error } = await supabase
    .from("solicitudes_gestion")
    .select("id, cita_id, citas!inner(paciente_id)")
    .is("resuelta_en", null)
    .lte("vence_en", enUnaHora);
  if (error) throw error;
  if (!candidatas || candidatas.length === 0) return 0;

  const marcador = "aviso:solicitud_proxima_vencer";
  const { data: existentes } = await supabase
    .from("notificaciones")
    .select("cita_id")
    .eq("plantilla", marcador)
    .in(
      "cita_id",
      candidatas.map((c) => c.cita_id)
    );
  const yaTienen = new Set((existentes ?? []).map((e) => e.cita_id));
  const pendientes = candidatas.filter((c) => !yaTienen.has(c.cita_id));
  if (pendientes.length === 0) return 0;

  const { error: errorInsert } = await supabase.from("notificaciones").insert(
    pendientes.map((c) => ({
      cita_id: c.cita_id,
      paciente_id: c.citas.paciente_id,
      canal: "whatsapp" as const,
      tipo: "aviso_interno" as const,
      plantilla: marcador,
      estado: "pendiente" as const,
      programada_para: new Date().toISOString(),
    }))
  );
  if (errorInsert) throw errorInsert;

  return pendientes.length;
}

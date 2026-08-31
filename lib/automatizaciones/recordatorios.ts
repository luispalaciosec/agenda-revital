import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";

/** Debe coincidir con la cadencia del cron en vercel.json — la ventana de cada corrida cubre exactamente un tick, con margen por si un tick se atrasa. */
const MARGEN_MINUTOS = 20;

type TipoRecordatorio = "recordatorio_24h" | "recordatorio_3h";

async function encolarRecordatorios(tipo: TipoRecordatorio, horas: number): Promise<number> {
  const supabase = crearClienteServicio();
  const ahora = Date.now();
  const desde = new Date(ahora + horas * 60 * 60 * 1000).toISOString();
  const hasta = new Date(ahora + horas * 60 * 60 * 1000 + MARGEN_MINUTOS * 60 * 1000).toISOString();

  const { data: candidatas, error } = await supabase
    .from("citas")
    .select("id, paciente_id")
    .eq("estado", "confirmada")
    .gte("inicio", desde)
    .lt("inicio", hasta);
  if (error) throw error;
  if (!candidatas || candidatas.length === 0) return 0;

  const { data: existentes } = await supabase
    .from("notificaciones")
    .select("cita_id")
    .eq("tipo", tipo)
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
      tipo,
      estado: "pendiente" as const,
      programada_para: new Date().toISOString(),
    }))
  );
  if (errorInsert) throw errorInsert;

  return pendientes.length;
}

/** Encola los dos recordatorios de §9.1 — solo 2, nunca 3 (decisión de costo, §18). */
export async function encolarTodosLosRecordatorios(): Promise<{ recordatorio24h: number; recordatorio3h: number }> {
  const config = await leerConfiguracionServicio(["horas_recordatorio_24h", "horas_recordatorio_3h"]);
  const horas24 = typeof config.get("horas_recordatorio_24h") === "number" ? (config.get("horas_recordatorio_24h") as number) : 24;
  const horas3 = typeof config.get("horas_recordatorio_3h") === "number" ? (config.get("horas_recordatorio_3h") as number) : 3;

  const [recordatorio24h, recordatorio3h] = await Promise.all([
    encolarRecordatorios("recordatorio_24h", horas24),
    encolarRecordatorios("recordatorio_3h", horas3),
  ]);

  return { recordatorio24h, recordatorio3h };
}

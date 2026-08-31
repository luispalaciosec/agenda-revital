import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { aLocal, compararHoras } from "@/lib/disponibilidad/tiempo";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";

/** No-show automático (§4.3): al cierre del día + margen, toda cita confirmada sin llegada marcada pasa a no_show. */
export async function marcarNoShowDelDia(): Promise<number> {
  const supabase = crearClienteServicio();
  const config = await leerConfiguracionServicio(["no_show_cierre_offset_minutos"]);
  const offsetMinutos = typeof config.get("no_show_cierre_offset_minutos") === "number" ? (config.get("no_show_cierre_offset_minutos") as number) : 30;

  const local = aLocal(new Date());
  if (local.diaSemana === 7) return 0; // domingo: cerrado, nada que marcar

  const { data: sedes, error } = await supabase
    .from("sedes")
    .select("id, hora_apertura_lv, hora_cierre_lv, hora_apertura_sab, hora_cierre_sab")
    .eq("activa", true);
  if (error) throw error;

  let total = 0;
  for (const sede of sedes ?? []) {
    const cierre = local.diaSemana === 6 ? sede.hora_cierre_sab : sede.hora_cierre_lv;
    if (!cierre) continue; // sábado sin horario definido: cerrado

    const cierreConMargen = sumarMinutosAHora(cierre, offsetMinutos);
    if (compararHoras(local.hora, cierreConMargen) < 0) continue; // todavía no cierra + margen

    const cantidad = await supabase.rpc("marcar_no_show_del_dia", { p_sede_id: sede.id, p_fecha: local.fecha });
    total += cantidad.data ?? 0;
  }
  return total;
}

function sumarMinutosAHora(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const totalMin = h * 60 + m + minutos;
  const hh = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

import { NextResponse } from "next/server";
import { autenticarCron } from "@/lib/seguridad/autenticar-cron";
import { encolarTodosLosRecordatorios } from "@/lib/automatizaciones/recordatorios";
import { marcarNoShowDelDia } from "@/lib/automatizaciones/no-show";
import { vencerSolicitudes, avisarSolicitudesProximasAVencer } from "@/lib/automatizaciones/solicitudes";
import { procesarListaEspera } from "@/lib/automatizaciones/lista-espera";
import { encolarEncuestasPostCita } from "@/lib/automatizaciones/encuesta";
import { enviarNotificacionesPendientes } from "@/lib/automatizaciones/enviar-pendientes";

const TAREAS: Array<[string, () => Promise<unknown>]> = [
  ["recordatorios", encolarTodosLosRecordatorios],
  ["noShow", marcarNoShowDelDia],
  ["solicitudesVencidas", vencerSolicitudes],
  ["solicitudesProximasAVencer", avisarSolicitudesProximasAVencer],
  ["listaEspera", procesarListaEspera],
  ["encuestas", encolarEncuestasPostCita],
  // El envío va al final: las tareas de arriba encolan notificaciones nuevas que esta misma corrida ya puede drenar.
  ["envio", enviarNotificacionesPendientes],
];

/** Un solo cron (Fase 5, §9 y §4.3) para todo el trabajo periódico. Un paso que falla no tumba a los demás — cada uno se reporta por separado. */
export async function GET(request: Request) {
  const rechazo = autenticarCron(request);
  if (rechazo) return rechazo;

  const resultados: Record<string, unknown> = {};
  for (const [nombre, tarea] of TAREAS) {
    try {
      resultados[nombre] = await tarea();
    } catch (error) {
      resultados[nombre] = { error: error instanceof Error ? error.message : "Error desconocido" };
    }
  }

  return NextResponse.json({ ok: true, ejecutadoEn: new Date().toISOString(), resultados });
}

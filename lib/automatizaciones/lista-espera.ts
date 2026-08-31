import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";

/**
 * Cupo liberado → notifica solo al primero en espera (§4.5 lista_espera),
 * con ventana de 30 minutos para tomarlo antes de pasar al siguiente. Sin
 * un evento nativo de "se liberó un cupo", cada corrida revisa las filas
 * 'esperando' contra la disponibilidad real — la tabla es chica en la
 * práctica, así que este barrido es barato.
 */
export async function procesarListaEspera(): Promise<{ notificados: number; expirados: number }> {
  const supabase = crearClienteServicio();
  const config = await leerConfiguracionServicio(["lista_espera_activa", "lista_espera_ventana_minutos"]);
  if (config.get("lista_espera_activa") !== true) return { notificados: 0, expirados: 0 };
  const ventanaMinutos = typeof config.get("lista_espera_ventana_minutos") === "number" ? (config.get("lista_espera_ventana_minutos") as number) : 30;

  // 1. Expirar a quien ya tuvo su ventana y no tomó el cupo, pasando al siguiente en la próxima corrida.
  const { data: expirados, error: errorExpirar } = await supabase
    .from("lista_espera")
    .update({ estado: "expirado" })
    .eq("estado", "notificado")
    .lt("expira_en", new Date().toISOString())
    .select("id");
  if (errorExpirar) throw errorExpirar;

  // 2. Al primero en 'esperando' de cada (especialidad, médico, fecha) con cupo real disponible, notificarlo.
  const { data: esperando, error } = await supabase
    .from("lista_espera")
    .select("id, especialidad_id, medico_id, paciente_id, fecha_deseada, creado_en")
    .eq("estado", "esperando")
    .order("creado_en", { ascending: true });
  if (error) throw error;

  let notificados = 0;
  const gruposYaAtendidos = new Set<string>();

  for (const fila of esperando ?? []) {
    const clave = `${fila.especialidad_id}|${fila.medico_id ?? ""}|${fila.fecha_deseada}`;
    if (gruposYaAtendidos.has(clave)) continue; // ya se notificó al primero de este grupo en esta corrida
    gruposYaAtendidos.add(clave);

    const dias = await obtenerDisponibilidad({
      especialidadId: fila.especialidad_id,
      medicoId: fila.medico_id ?? undefined,
      desde: fila.fecha_deseada,
      hasta: fila.fecha_deseada,
    });
    const hayCupo = (dias[0]?.franjas ?? []).some((f) => f.cuposDisponibles > 0);
    if (!hayCupo) continue;

    await supabase
      .from("lista_espera")
      .update({ estado: "notificado", notificado_en: new Date().toISOString(), expira_en: new Date(Date.now() + ventanaMinutos * 60 * 1000).toISOString() })
      .eq("id", fila.id);

    await supabase.from("notificaciones").insert({
      cita_id: null,
      paciente_id: fila.paciente_id,
      canal: "whatsapp",
      tipo: "aviso_interno",
      plantilla: "aviso:cupo_liberado",
      estado: "pendiente",
      programada_para: new Date().toISOString(),
    });
    notificados++;
  }

  return { notificados, expirados: expirados?.length ?? 0 };
}

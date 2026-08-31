import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { obtenerProveedorWhatsApp } from "@/lib/notificaciones/proveedor-whatsapp";
import { obtenerProveedorCorreo } from "@/lib/notificaciones/proveedor-correo";
import { textoNotificacion } from "./textos";
import { resolverDestino } from "./destino";

/** Drena la cola de `notificaciones` (§9): todo lo 'pendiente' cuya hora ya llegó, se envía o se marca fallida. */
export async function enviarNotificacionesPendientes(): Promise<{ enviadas: number; fallidas: number }> {
  const supabase = crearClienteServicio();
  const { data: pendientes, error } = await supabase
    .from("notificaciones")
    .select("id, cita_id, paciente_id, canal, tipo, plantilla")
    .eq("estado", "pendiente")
    .lte("programada_para", new Date().toISOString())
    .limit(200);
  if (error) throw error;

  let enviadas = 0;
  let fallidas = 0;

  for (const n of pendientes ?? []) {
    try {
      const destino = await resolverDestino(supabase, n.paciente_id, n.canal, n.tipo, n.plantilla);
      if (!destino) {
        await supabase.from("notificaciones").update({ estado: "fallida", error: "Sin destino de contacto" }).eq("id", n.id);
        fallidas++;
        continue;
      }

      const texto = await textoNotificacion(supabase, n.tipo, n.cita_id, n.plantilla);
      if (n.canal === "whatsapp") {
        await obtenerProveedorWhatsApp().enviar(destino, texto);
      } else {
        await obtenerProveedorCorreo().enviar(destino, "Agenda Revital", texto);
      }

      await supabase.from("notificaciones").update({ estado: "enviada", enviada_en: new Date().toISOString() }).eq("id", n.id);
      enviadas++;
    } catch (e) {
      await supabase
        .from("notificaciones")
        .update({ estado: "fallida", error: e instanceof Error ? e.message : "Error desconocido" })
        .eq("id", n.id);
      fallidas++;
    }
  }

  return { enviadas, fallidas };
}

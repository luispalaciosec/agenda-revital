import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { obtenerProveedoresConversion } from "./proveedor-conversion";

/**
 * Dispara el evento de conversión cuando una cita queda confirmada
 * (§10.1) — solo para citas de bot o web, los canales pagados. Las citas
 * creadas desde el panel (walk-in, teléfono) no vienen de un clic
 * publicitario y no deben inflar la atribución.
 */
export async function dispararEventoAgendamiento(citaId: string): Promise<void> {
  const supabase = crearClienteServicio();
  const { data: cita } = await supabase
    .from("citas")
    .select("canal, precio_aplicado, fbclid, gclid, ttclid, ctwa_clid, contacto:contactos(celular)")
    .eq("id", citaId)
    .maybeSingle();
  if (!cita || (cita.canal !== "bot" && cita.canal !== "web")) return;

  const evento = {
    valor: cita.precio_aplicado,
    moneda: "USD",
    fbclid: cita.fbclid,
    gclid: cita.gclid,
    ttclid: cita.ttclid,
    ctwaClid: cita.ctwa_clid,
    celular: cita.contacto?.celular ?? null,
    canal: cita.canal,
  };
  await Promise.all(obtenerProveedoresConversion().map((p) => p.enviarAgendamiento(evento).catch(() => undefined)));
}

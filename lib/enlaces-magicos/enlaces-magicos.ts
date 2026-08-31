import "server-only";
import { randomBytes, createHash } from "crypto";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { permitirPorLimiteTasa } from "@/lib/seguridad/limite-tasa";
import { obtenerProveedorWhatsApp, enModoDesarrollo } from "@/lib/notificaciones/proveedor-whatsapp";

const VALIDO_HORAS = 24;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Envía el link mágico de /mis-citas (§7.5) si el celular ya tiene citas
 * registradas. Si no lo tiene, no revela nada — mismo resultado visible
 * para "no existe" y "ya se envió", para no dejar enumerar números.
 */
export async function solicitarEnlaceMagico(celular: string, origen: string): Promise<{ tokenDev: string | null }> {
  const permitido = await permitirPorLimiteTasa(`enlace-magico:${celular}`, 5, 3600);
  if (!permitido) throw new Error("Demasiados intentos para este número. Espera un momento e intenta de nuevo.");

  const supabase = crearClienteServicio();
  const { data: contacto } = await supabase.from("contactos").select("id").eq("celular", celular).maybeSingle();
  if (!contacto) return { tokenDev: null };

  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("enlaces_magicos").insert({
    token_hash: hashToken(token),
    contacto_id: contacto.id,
    expira_en: new Date(Date.now() + VALIDO_HORAS * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw error;

  const enlace = `${origen}/mis-citas/${token}`;
  await obtenerProveedorWhatsApp().enviar(celular, `Revisa, cancela o reprograma tus citas en Agenda Revital: ${enlace} (válido ${VALIDO_HORAS} horas).`);

  return { tokenDev: enModoDesarrollo() ? token : null };
}

export async function validarEnlaceMagico(token: string): Promise<string | null> {
  const supabase = crearClienteServicio();
  const { data: enlace } = await supabase
    .from("enlaces_magicos")
    .select("id, contacto_id, expira_en, usado_en")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!enlace) return null;
  if (new Date(enlace.expira_en) < new Date()) return null;

  if (!enlace.usado_en) {
    await supabase.from("enlaces_magicos").update({ usado_en: new Date().toISOString() }).eq("id", enlace.id);
  }
  return enlace.contacto_id;
}

import "server-only";
import { createHash, randomInt } from "crypto";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { permitirPorLimiteTasa } from "@/lib/seguridad/limite-tasa";
import { obtenerProveedorWhatsApp, enModoDesarrollo } from "@/lib/notificaciones/proveedor-whatsapp";

const VALIDO_MINUTOS = 10;
const MAXIMO_INTENTOS = 3;

function hashCodigo(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Solicita un OTP (§7.2): 6 dígitos, válido 10 minutos, máximo 3 intentos.
 * El límite de tasa por celular evita que alguien llene la agenda de
 * códigos falsos o agote el saldo de mensajería del centro.
 */
export async function solicitarOtp(celular: string): Promise<{ otpId: string; codigoDev: string | null }> {
  const permitido = await permitirPorLimiteTasa(`otp:${celular}`, 5, 3600);
  if (!permitido) throw new Error("Demasiados códigos solicitados para este número. Espera un momento e intenta de nuevo.");

  const codigo = generarCodigo();
  const supabase = crearClienteServicio();
  const { data, error } = await supabase
    .from("otp_codigos")
    .insert({
      celular,
      codigo_hash: hashCodigo(codigo),
      expira_en: new Date(Date.now() + VALIDO_MINUTOS * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;

  await obtenerProveedorWhatsApp().enviar(celular, `Tu código de Agenda Revital es ${codigo}. Válido por ${VALIDO_MINUTOS} minutos.`);

  return { otpId: data.id, codigoDev: enModoDesarrollo() ? codigo : null };
}

export async function verificarOtp(otpId: string, celular: string, codigo: string): Promise<void> {
  const supabase = crearClienteServicio();
  const { data: otp, error } = await supabase
    .from("otp_codigos")
    .select("id, celular, codigo_hash, intentos, verificado_en, expira_en")
    .eq("id", otpId)
    .single();
  if (error || !otp) throw new Error("Código no encontrado. Solicita uno nuevo.");
  if (otp.celular !== celular) throw new Error("Código no encontrado. Solicita uno nuevo.");
  if (otp.verificado_en) return;
  if (new Date(otp.expira_en) < new Date()) throw new Error("Este código expiró. Solicita uno nuevo.");
  if (otp.intentos >= MAXIMO_INTENTOS) throw new Error("Demasiados intentos. Solicita un código nuevo.");

  if (otp.codigo_hash !== hashCodigo(codigo)) {
    await supabase.from("otp_codigos").update({ intentos: otp.intentos + 1 }).eq("id", otpId);
    throw new Error("Código incorrecto.");
  }

  await supabase.from("otp_codigos").update({ verificado_en: new Date().toISOString() }).eq("id", otpId);
}

/** Usado justo antes de crear la cita: confirma que este otpId de verdad verificó este celular hace poco. */
export async function confirmarOtpVerificado(otpId: string, celular: string): Promise<boolean> {
  const supabase = crearClienteServicio();
  const { data: otp } = await supabase.from("otp_codigos").select("celular, verificado_en").eq("id", otpId).single();
  if (!otp || !otp.verificado_en || otp.celular !== celular) return false;
  const minutosDesdeVerificado = (Date.now() - new Date(otp.verificado_en).getTime()) / 60000;
  return minutosDesdeVerificado <= 30;
}

import "server-only";

export interface ProveedorWhatsApp {
  enviar(celular: string, mensaje: string): Promise<void>;
  enviarOtp(celular: string, codigo: string): Promise<void>;
}

const PLANTILLA_OTP = "codigo_otp_agendamiento";
const GRAPH_API_VERSION = "v22.0";

/** Normaliza a formato E.164 sin el "+" (lo que espera la API de WhatsApp Cloud). Asume Ecuador si no hay código de país. */
function aWhatsappId(celular: string): string {
  const soloDigitos = celular.replace(/\D/g, "");
  if (soloDigitos.startsWith("593")) return soloDigitos;
  if (soloDigitos.startsWith("0")) return `593${soloDigitos.slice(1)}`;
  return `593${soloDigitos}`;
}

/**
 * Envía directo a la API de WhatsApp Cloud de Meta (no pasa por Jelou — el
 * OTP es un envío transaccional disparado por nuestro propio backend, sin
 * relación con el bot conversacional). Requiere `WHATSAPP_TOKEN` y
 * `WHATSAPP_PHONE_NUMBER_ID` en las variables de entorno.
 */
class ProveedorMeta implements ProveedorWhatsApp {
  private token: string;
  private phoneNumberId: string;

  constructor(token: string, phoneNumberId: string) {
    this.token = token;
    this.phoneNumberId = phoneNumberId;
  }

  async enviarOtp(celular: string, codigo: string) {
    const respuesta = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: aWhatsappId(celular),
        type: "template",
        template: {
          name: PLANTILLA_OTP,
          language: { code: "es" },
          components: [
            { type: "body", parameters: [{ type: "text", text: codigo }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: codigo }] },
          ],
        },
      }),
    });
    if (!respuesta.ok) {
      throw new Error(`WhatsApp Cloud API respondió ${respuesta.status}: ${await respuesta.text()}`);
    }
  }

  /**
   * Texto libre (enlaces mágicos, recordatorios): todavía no tiene plantilla
   * aprobada propia, así que sigue solo en el log — enviarlo como texto
   * libre fallaría fuera de una ventana de 24h activa con el paciente.
   */
  async enviar(celular: string, mensaje: string) {
    console.log(`[WhatsApp:sin-plantilla] → ${celular}: ${mensaje}`);
  }
}

/**
 * Sin credenciales: el mensaje queda en el log del servidor en vez de salir
 * de verdad.
 */
class ProveedorDesarrollo implements ProveedorWhatsApp {
  async enviar(celular: string, mensaje: string) {
    console.log(`[WhatsApp:desarrollo] → ${celular}: ${mensaje}`);
  }
  async enviarOtp(celular: string, codigo: string) {
    console.log(`[WhatsApp:desarrollo] OTP → ${celular}: ${codigo}`);
  }
}

export function obtenerProveedorWhatsApp(): ProveedorWhatsApp {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneNumberId) return new ProveedorMeta(token, phoneNumberId);
  return new ProveedorDesarrollo();
}

export function enModoDesarrollo(): boolean {
  return process.env.NODE_ENV !== "production";
}

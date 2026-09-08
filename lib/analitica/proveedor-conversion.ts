import "server-only";
import { createHash } from "node:crypto";
import { leerConfiguracionServicio } from "@/lib/configuracion-servicio";

export interface EventoConversion {
  valor: number;
  moneda: string;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  celular?: string | null;
  ctwaClid?: string | null;
  canal: "bot" | "web";
}

export interface ProveedorConversion {
  enviarAgendamiento(evento: EventoConversion): Promise<void>;
}

function hashSha256(valor: string): string {
  return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
}

/**
 * Envía el evento estándar "LeadSubmitted" a Meta Conversions API — mismo
 * nombre de evento en web y bot (agendar una cita no es un pago
 * confirmado, así que "Purchase" no aplica). El cuerpo NUNCA lleva
 * especialidad ni servicio — solo valor y datos de emparejamiento
 * (§10.2, obligatorio). `action_source` distingue web de WhatsApp dentro
 * del mismo dataset (mismo pixel que la web pública).
 *
 * Meta exige `user_data.page_id` y `user_data.ctwa_clid` para todo evento
 * de WhatsApp (action_source=business_messaging) — confirmado en vivo
 * contra la API real. Sin `ctwa_clid` (la cita no vino de un clic en un
 * anuncio "Click to WhatsApp"), Meta rechaza el evento, así que ese caso
 * se omite en vez de reintentar.
 */
class ProveedorMeta implements ProveedorConversion {
  async enviarAgendamiento(evento: EventoConversion) {
    const config = await leerConfiguracionServicio(["meta_capi_pixel_id", "meta_capi_token", "meta_capi_test_event_code", "meta_capi_page_id"]);
    const pixelId = config.get("meta_capi_pixel_id");
    const token = config.get("meta_capi_token");
    if (!pixelId || !token) {
      console.log(`[Meta CAPI:sin credenciales] LeadSubmitted — valor=${evento.valor} ${evento.moneda} fbclid=${evento.fbclid ?? "-"}`);
      return;
    }

    const esBot = evento.canal === "bot";
    if (esBot && !evento.ctwaClid) {
      console.log(`[Meta CAPI:omitido] cita de bot sin ctwa_clid (no vino de un clic en anuncio) — cita ${evento.valor} ${evento.moneda}`);
      return;
    }
    const pageId = config.get("meta_capi_page_id");
    if (esBot && !pageId) {
      console.log("[Meta CAPI:omitido] falta meta_capi_page_id en configuración");
      return;
    }

    const userData: Record<string, unknown> = {};
    if (evento.celular) userData.ph = [hashSha256(evento.celular.replace(/\D/g, ""))];
    if (esBot) {
      userData.page_id = pageId;
      userData.ctwa_clid = evento.ctwaClid;
    } else if (evento.fbclid) {
      userData.fbc = `fb.1.${Date.now()}.${evento.fbclid}`;
    }

    const testEventCode = config.get("meta_capi_test_event_code");
    const body: Record<string, unknown> = {
      data: [
        {
          event_name: "LeadSubmitted",
          event_time: Math.floor(Date.now() / 1000),
          action_source: esBot ? "business_messaging" : "website",
          ...(esBot ? { messaging_channel: "whatsapp" } : {}),
          user_data: userData,
          custom_data: { value: evento.valor, currency: evento.moneda },
        },
      ],
      ...(typeof testEventCode === "string" ? { test_event_code: testEventCode } : {}),
    };

    const respuesta = await fetch(`https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!respuesta.ok) {
      throw new Error(`Meta CAPI respondió ${respuesta.status}: ${await respuesta.text()}`);
    }
  }
}

class ProveedorGoogleDesarrollo implements ProveedorConversion {
  async enviarAgendamiento(evento: EventoConversion) {
    console.log(`[Google Ads:desarrollo] conversión offline — valor=${evento.valor} ${evento.moneda} gclid=${evento.gclid ?? "-"}`);
  }
}

class ProveedorTikTokDesarrollo implements ProveedorConversion {
  async enviarAgendamiento(evento: EventoConversion) {
    console.log(`[TikTok Events:desarrollo] CompleteRegistration — valor=${evento.valor} ${evento.moneda} ttclid=${evento.ttclid ?? "-"}`);
  }
}

export function obtenerProveedoresConversion(): ProveedorConversion[] {
  return [new ProveedorMeta(), new ProveedorGoogleDesarrollo(), new ProveedorTikTokDesarrollo()];
}

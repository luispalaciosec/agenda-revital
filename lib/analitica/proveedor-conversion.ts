import "server-only";

export interface EventoConversion {
  valor: number;
  moneda: string;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
}

export interface ProveedorConversion {
  enviarAgendamiento(evento: EventoConversion): Promise<void>;
}

/**
 * Sin credenciales de Meta/Google/TikTok todavía (mismo caso que
 * WhatsApp): el evento queda en el log en vez de salir de verdad. El
 * cuerpo NUNCA lleva especialidad ni servicio — solo valor y click ID
 * (§10.2, obligatorio). Cuando Luis tenga las credenciales de cada
 * plataforma, cada clase de abajo es el único lugar que cambia.
 */
class ProveedorMetaDesarrollo implements ProveedorConversion {
  async enviarAgendamiento(evento: EventoConversion) {
    console.log(`[Meta CAPI:desarrollo] Schedule — valor=${evento.valor} ${evento.moneda} fbclid=${evento.fbclid ?? "-"}`);
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
  return [new ProveedorMetaDesarrollo(), new ProveedorGoogleDesarrollo(), new ProveedorTikTokDesarrollo()];
}

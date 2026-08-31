import "server-only";

export interface ProveedorWhatsApp {
  enviar(celular: string, mensaje: string): Promise<void>;
}

/**
 * Sin credenciales de un proveedor real (Jelou u otro) todavía: el mensaje
 * queda en el log del servidor en vez de salir de verdad. Cuando Luis
 * tenga las credenciales, este es el único archivo que cambia — el resto
 * del código (OTP, enlaces mágicos, notificaciones) ya llama a
 * `obtenerProveedorWhatsApp()` sin saber qué hay detrás.
 */
class ProveedorDesarrollo implements ProveedorWhatsApp {
  async enviar(celular: string, mensaje: string) {
    console.log(`[WhatsApp:desarrollo] → ${celular}: ${mensaje}`);
  }
}

export function obtenerProveedorWhatsApp(): ProveedorWhatsApp {
  return new ProveedorDesarrollo();
}

export function enModoDesarrollo(): boolean {
  return process.env.NODE_ENV !== "production";
}

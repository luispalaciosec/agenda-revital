import "server-only";

export interface ProveedorCorreo {
  enviar(correo: string, asunto: string, cuerpo: string): Promise<void>;
}

/** Mismo patrón que proveedor-whatsapp.ts: sin credenciales SMTP/API todavía, el correo queda en el log. */
class ProveedorDesarrollo implements ProveedorCorreo {
  async enviar(correo: string, asunto: string, cuerpo: string) {
    console.log(`[Correo:desarrollo] → ${correo} | ${asunto}: ${cuerpo}`);
  }
}

export function obtenerProveedorCorreo(): ProveedorCorreo {
  return new ProveedorDesarrollo();
}

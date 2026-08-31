import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Formato de error consistente para todo /api/v1, con el mensaje de negocio si lo hay (§6.2). */
export function respuestaErrorApi(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", detalles: error.issues }, { status: 400 });
  }
  const mensaje = obtenerMensaje(error);
  if (mensaje === "Error inesperado") console.error("[api/v1] error inesperado:", error);
  const esNoEncontrado = /no encontrad[ao]/i.test(mensaje);
  return NextResponse.json({ error: mensaje }, { status: esNoEncontrado ? 404 : 400 });
}

function obtenerMensaje(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Error inesperado";
}

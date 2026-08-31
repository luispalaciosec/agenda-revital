"use server";

import { revalidatePath } from "next/cache";
import { gestionarSolicitud } from "@/lib/citas/gestionar-solicitud";

export async function accionGestionarSolicitud(solicitudId: string, aceptar: boolean, observacion?: string) {
  try {
    await gestionarSolicitud(solicitudId, aceptar, observacion);
    revalidatePath("/panel/solicitudes");
    revalidatePath("/panel/agenda");
    return { ok: true as const };
  } catch (error) {
    const mensaje =
      error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : null;
    return { ok: false as const, mensaje: mensaje ?? "No se pudo procesar la solicitud." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { moverPacientePunto } from "@/lib/seguimiento/tablero";

export async function accionMoverPaciente(citaId: string, puntoId: string) {
  try {
    await moverPacientePunto(citaId, puntoId);
    revalidatePath("/panel/seguimiento");
    revalidatePath("/panel/mi-agenda");
    return { ok: true as const };
  } catch (error) {
    const mensaje = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo mover al paciente.";
    return { ok: false as const, mensaje };
  }
}

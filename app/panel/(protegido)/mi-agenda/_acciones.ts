"use server";

import { revalidatePath } from "next/cache";
import { moverPacientePunto } from "@/lib/seguimiento/tablero";

export async function accionMoverMiPaciente(citaId: string, puntoId: string) {
  try {
    await moverPacientePunto(citaId, puntoId);
    revalidatePath("/panel/mi-agenda");
    revalidatePath("/panel/seguimiento");
    return { ok: true as const };
  } catch (error) {
    const mensaje = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo actualizar.";
    return { ok: false as const, mensaje };
  }
}

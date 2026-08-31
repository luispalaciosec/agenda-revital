"use server";

import { revalidatePath } from "next/cache";
import { marcarLlegada, marcarAtendida } from "@/lib/citas/sala-espera";

export async function accionMarcarLlegada(citaId: string) {
  try {
    await marcarLlegada(citaId);
    revalidatePath("/panel/sala-espera");
    return { ok: true as const };
  } catch {
    return { ok: false as const, mensaje: "No se pudo marcar la llegada." };
  }
}

export async function accionMarcarAtendida(citaId: string) {
  try {
    await marcarAtendida(citaId);
    revalidatePath("/panel/sala-espera");
    return { ok: true as const };
  } catch {
    return { ok: false as const, mensaje: "No se pudo marcar como atendida." };
  }
}

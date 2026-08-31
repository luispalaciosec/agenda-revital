"use server";

import { revalidatePath } from "next/cache";
import { crearApiKey, revocarApiKey } from "@/lib/seguridad/gestionar-api-keys";

export async function accionCrearApiKey(nombre: string) {
  try {
    const { llave } = await crearApiKey(nombre);
    revalidatePath("/panel/configuracion/api-keys");
    return { ok: true as const, llave };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo crear la llave." };
  }
}

export async function accionRevocarApiKey(id: string) {
  try {
    await revocarApiKey(id);
    revalidatePath("/panel/configuracion/api-keys");
    return { ok: true as const };
  } catch {
    return { ok: false as const, mensaje: "No se pudo revocar la llave." };
  }
}

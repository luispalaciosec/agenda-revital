"use server";

import { revalidatePath } from "next/cache";
import { crearPromocion, actualizarPromocion, actualizarFlagActivaPromocion, type DatosPromocion } from "@/lib/marketing/promociones";

function mensajeDeError(error: unknown): string {
  return error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo guardar.";
}

export async function accionCrearPromocion(datos: DatosPromocion) {
  try {
    await crearPromocion(datos);
    revalidatePath("/panel/marketing");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarPromocion(id: string, datos: DatosPromocion) {
  try {
    await actualizarPromocion(id, datos);
    revalidatePath("/panel/marketing");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarFlagActivaPromocion(id: string, activa: boolean) {
  try {
    await actualizarFlagActivaPromocion(id, activa);
    revalidatePath("/panel/marketing");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { actualizarMiPerfil, actualizarMiFoto } from "@/lib/usuarios/mi-perfil";

function mensajeDeError(error: unknown): string {
  return error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo guardar.";
}

export async function accionActualizarMiPerfil(datos: { nombres: string; apellidos: string; correo: string }) {
  try {
    await actualizarMiPerfil(datos);
    revalidatePath("/panel/mi-perfil");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarMiFoto(fotoUrl: string) {
  try {
    await actualizarMiFoto(fotoUrl);
    revalidatePath("/panel/mi-perfil");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

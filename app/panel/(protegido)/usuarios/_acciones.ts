"use server";

import { revalidatePath } from "next/cache";
import { invitarUsuario, actualizarRolUsuario, actualizarFlagActivoUsuario, type DatosInvitacion } from "@/lib/usuarios/gestionar";
import type { Database } from "@/lib/supabase/database.types";

type RolUsuario = Database["public"]["Enums"]["rol_usuario_enum"];

function mensajeDeError(error: unknown): string {
  return error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo guardar.";
}

export async function accionInvitarUsuario(datos: DatosInvitacion) {
  try {
    await invitarUsuario(datos);
    revalidatePath("/panel/usuarios");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarRolUsuario(id: string, rol: RolUsuario) {
  try {
    await actualizarRolUsuario(id, rol);
    revalidatePath("/panel/usuarios");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarFlagActivoUsuario(id: string, activo: boolean) {
  try {
    await actualizarFlagActivoUsuario(id, activo);
    revalidatePath("/panel/usuarios");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

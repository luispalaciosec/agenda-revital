"use server";

import { revalidatePath } from "next/cache";
import { crearEspecialidad, actualizarEspecialidad, type DatosEspecialidad } from "@/lib/catalogo/especialidades";
import { crearMedico, actualizarMedico, type DatosMedico } from "@/lib/catalogo/medicos";
import { crearConsultorio, actualizarConsultorio, type DatosConsultorio } from "@/lib/catalogo/consultorios";
import { buscarServicios, actualizarFlagsServicio } from "@/lib/catalogo/servicios";

function mensajeDeError(error: unknown): string {
  return error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo guardar.";
}

export async function accionCrearEspecialidad(sedeId: string, datos: DatosEspecialidad) {
  try {
    await crearEspecialidad(sedeId, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarEspecialidad(id: string, datos: DatosEspecialidad) {
  try {
    await actualizarEspecialidad(id, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionCrearMedico(sedeId: string, datos: DatosMedico) {
  try {
    await crearMedico(sedeId, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarMedico(id: string, datos: DatosMedico) {
  try {
    await actualizarMedico(id, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionCrearConsultorio(sedeId: string, datos: DatosConsultorio) {
  try {
    await crearConsultorio(sedeId, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarConsultorio(id: string, datos: DatosConsultorio) {
  try {
    await actualizarConsultorio(id, datos);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionActualizarFlagServicio(
  id: string,
  campo: "agendable" | "visible_web" | "visible_bot" | "activo",
  valor: boolean
) {
  try {
    await actualizarFlagsServicio(id, campo, valor);
    revalidatePath("/panel/catalogo");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionBuscarServicios(q: string) {
  try {
    return await buscarServicios(q);
  } catch {
    return [];
  }
}

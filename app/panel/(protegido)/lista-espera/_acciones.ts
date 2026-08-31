"use server";

import { revalidatePath } from "next/cache";
import { buscarPacientePorDocumento } from "@/lib/citas/buscar-paciente";
import { agregarAListaEspera, marcarNotificado, marcarEstadoListaEspera, type EntradaListaEspera } from "@/lib/citas/lista-espera";

function mensajeDeError(error: unknown): string {
  return error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "No se pudo completar la acción.";
}

export async function accionBuscarPacienteListaEspera(documento: string) {
  if (!documento.trim()) return null;
  try {
    return await buscarPacientePorDocumento(documento.trim());
  } catch {
    return null;
  }
}

export async function accionAgregarAListaEspera(entrada: EntradaListaEspera) {
  try {
    await agregarAListaEspera(entrada);
    revalidatePath("/panel/lista-espera");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionMarcarNotificado(id: string) {
  try {
    await marcarNotificado(id);
    revalidatePath("/panel/lista-espera");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

export async function accionMarcarEstadoListaEspera(id: string, estado: "tomado" | "cancelado" | "expirado") {
  try {
    await marcarEstadoListaEspera(id, estado);
    revalidatePath("/panel/lista-espera");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

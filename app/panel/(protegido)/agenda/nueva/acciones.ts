"use server";

import { revalidatePath } from "next/cache";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";
import { buscarPacientePorDocumento } from "@/lib/citas/buscar-paciente";
import { crearCitaPanel, type EntradaCrearCita } from "@/lib/citas/crear";

export async function accionBuscarPaciente(documento: string) {
  if (!documento.trim()) return null;
  try {
    return await buscarPacientePorDocumento(documento.trim());
  } catch {
    return null;
  }
}

export async function accionObtenerFranjas(especialidadId: string, medicoId: string | null, fecha: string) {
  const dias = await obtenerDisponibilidad({
    especialidadId,
    medicoId: medicoId ?? undefined,
    desde: fecha,
    hasta: fecha,
  });
  return dias[0]?.franjas ?? [];
}

export async function accionCrearCita(entrada: EntradaCrearCita) {
  try {
    const cita = await crearCitaPanel(entrada);
    revalidatePath("/panel/agenda");
    return { ok: true as const, cita };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error) };
  }
}

function mensajeDeError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const mensaje = String((error as { message: unknown }).message);
    // Los mensajes de los triggers de negocio (límite de citas activas,
    // misma especialidad el mismo día) ya vienen en español, listos para
    // mostrar. Los de Postgres/PostgREST no siempre.
    if (mensaje.includes("cita(s) activa(s)") || mensaje.includes("misma especialidad")) return mensaje;
  }
  return "No se pudo crear la cita. Intenta de nuevo o revisa los datos.";
}

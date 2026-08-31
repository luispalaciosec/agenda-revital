"use server";

import { revalidatePath } from "next/cache";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";
import { buscarPacientePorDocumento } from "@/lib/citas/buscar-paciente";
import { crearCitaPanel, type EntradaCrearCita } from "@/lib/citas/crear";
import { cancelarCitaPanel } from "@/lib/citas/cancelar";
import { reprogramarCitaPanel } from "@/lib/citas/reprogramar";

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
    return { ok: false as const, mensaje: mensajeDeError(error, "No se pudo crear la cita. Intenta de nuevo o revisa los datos.") };
  }
}

export async function accionCancelarCita(citaId: string, quienCancela: "paciente" | "centro", motivo?: string) {
  try {
    await cancelarCitaPanel(citaId, quienCancela, motivo);
    revalidatePath("/panel/agenda");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error, "No se pudo cancelar la cita.") };
  }
}

export async function accionReprogramarCita(input: {
  citaId: string;
  nuevoMedicoId: string | null;
  nuevoConsultorioId: string | null;
  nuevoInicio: string;
  nuevoFin: string;
}) {
  try {
    const cita = await reprogramarCitaPanel(input);
    revalidatePath("/panel/agenda");
    return { ok: true as const, cita };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeDeError(error, "No se pudo reprogramar la cita.") };
  }
}

function mensajeDeError(error: unknown, generico: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const mensaje = String((error as { message: unknown }).message);
    // Los mensajes de los triggers y funciones de negocio (límite de citas
    // activas, misma especialidad el mismo día, máximo de reprogramaciones,
    // cupo lleno) ya vienen en español, listos para mostrar. Los de
    // Postgres/PostgREST crudos no siempre.
    if (
      mensaje.includes("cita(s) activa(s)") ||
      mensaje.includes("misma especialidad") ||
      mensaje.includes("reprogramación") ||
      mensaje.includes("cupos disponibles") ||
      mensaje.includes("no encontrada") ||
      mensaje.includes("no está activa")
    ) {
      return mensaje;
    }
  }
  return generico;
}

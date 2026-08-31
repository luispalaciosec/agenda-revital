"use server";

import { revalidatePath } from "next/cache";
import { validarEnlaceMagico } from "@/lib/enlaces-magicos/enlaces-magicos";
import { cancelarCitaPublica } from "@/lib/citas/cancelar-publica";
import { reprogramarCitaPublica } from "@/lib/citas/reprogramar-publica";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";

async function contactoDelToken(token: string): Promise<string> {
  const contactoId = await validarEnlaceMagico(token);
  if (!contactoId) throw new Error("Este enlace ya no es válido. Solicita uno nuevo en /mis-citas.");
  return contactoId;
}

export async function accionCancelarViaToken(token: string, citaId: string, motivo?: string) {
  try {
    const contactoId = await contactoDelToken(token);
    await cancelarCitaPublica(citaId, contactoId, motivo);
    revalidatePath(`/mis-citas/${token}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo cancelar la cita." };
  }
}

export async function accionObtenerFranjasViaToken(especialidadId: string, medicoId: string | null, fecha: string) {
  const dias = await obtenerDisponibilidad({ especialidadId, medicoId: medicoId ?? undefined, desde: fecha, hasta: fecha });
  return dias[0]?.franjas ?? [];
}

export async function accionReprogramarViaToken(token: string, citaId: string, nuevoInicio: string) {
  try {
    const contactoId = await contactoDelToken(token);
    await reprogramarCitaPublica(citaId, contactoId, nuevoInicio);
    revalidatePath(`/mis-citas/${token}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo reprogramar la cita." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { editarPaciente, type DatosPaciente } from "@/lib/citas/editar-paciente";

export async function accionEditarPaciente(pacienteId: string, datos: DatosPaciente) {
  try {
    await editarPaciente(pacienteId, datos);
    revalidatePath(`/panel/pacientes/${pacienteId}`);
    return { ok: true as const };
  } catch {
    return { ok: false as const, mensaje: "No se pudieron guardar los cambios." };
  }
}

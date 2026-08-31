import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface DatosPaciente {
  nombres: string;
  apellidos: string;
  correo: string;
  historiaClinica: string;
}

export async function editarPaciente(pacienteId: string, datos: DatosPaciente) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("pacientes")
    .update({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      correo: datos.correo || null,
      historia_clinica: datos.historiaClinica || null,
    })
    .eq("id", pacienteId);
  if (error) throw error;
}

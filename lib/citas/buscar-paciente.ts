import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function buscarPacientePorDocumento(documento: string) {
  const supabase = await crearClienteServidor();

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .select("id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, correo")
    .eq("documento", documento)
    .maybeSingle();

  if (error) throw error;
  if (!paciente) return null;

  const { data: vinculos, error: errorVinculos } = await supabase
    .from("contacto_paciente")
    .select("contacto:contactos(id, celular)")
    .eq("paciente_id", paciente.id);
  if (errorVinculos) throw errorVinculos;

  return {
    paciente,
    contactos: (vinculos ?? []).map((v) => v.contacto).filter((c): c is { id: string; celular: string } => c !== null),
  };
}

import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export interface ResultadoBusquedaPublica {
  encontrado: boolean;
  paciente: { id: string; tipoDocumento: string; documento: string; nombres: string; apellidos: string; fechaNacimiento: string } | null;
  pacientesVinculados: Array<{ id: string; nombres: string; apellidos: string }>;
}

/** POST /api/v1/pacientes/buscar (§6.1) — por documento o por celular ya registrado. */
export async function buscarPacientePublico(documento?: string, celular?: string): Promise<ResultadoBusquedaPublica> {
  const supabase = crearClienteServicio();

  if (documento) {
    const { data: paciente, error } = await supabase
      .from("pacientes")
      .select("id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento")
      .eq("documento", documento)
      .maybeSingle();
    if (error) throw error;
    if (!paciente) return { encontrado: false, paciente: null, pacientesVinculados: [] };

    return {
      encontrado: true,
      paciente: {
        id: paciente.id,
        tipoDocumento: paciente.tipo_documento,
        documento: paciente.documento,
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        fechaNacimiento: paciente.fecha_nacimiento,
      },
      pacientesVinculados: [],
    };
  }

  if (celular) {
    const { data: contacto } = await supabase.from("contactos").select("id").eq("celular", celular).maybeSingle();
    if (!contacto) return { encontrado: false, paciente: null, pacientesVinculados: [] };

    const { data: vinculos, error } = await supabase
      .from("contacto_paciente")
      .select("paciente:pacientes(id, nombres, apellidos)")
      .eq("contacto_id", contacto.id);
    if (error) throw error;

    const pacientes = (vinculos ?? [])
      .map((v) => v.paciente)
      .filter((p): p is { id: string; nombres: string; apellidos: string } => p !== null);

    return { encontrado: pacientes.length > 0, paciente: null, pacientesVinculados: pacientes };
  }

  throw new Error("Falta documento o celular");
}

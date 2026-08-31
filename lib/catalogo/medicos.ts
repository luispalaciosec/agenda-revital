import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface DatosMedico {
  nombres: string;
  apellidos: string;
  titulo: string;
  celular: string;
  correo: string;
  activo: boolean;
  especialidadesIds: string[];
}

export async function crearMedico(sedeId: string, datos: DatosMedico) {
  const supabase = await crearClienteServidor();
  const { data: medico, error } = await supabase
    .from("medicos")
    .insert({
      sede_id: sedeId,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      titulo: datos.titulo || null,
      celular: datos.celular || null,
      correo: datos.correo || null,
      activo: datos.activo,
    })
    .select("id")
    .single();
  if (error) throw error;

  await sincronizarEspecialidades(medico.id, datos.especialidadesIds);
  return medico.id;
}

export async function actualizarMedico(id: string, datos: DatosMedico) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("medicos")
    .update({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      titulo: datos.titulo || null,
      celular: datos.celular || null,
      correo: datos.correo || null,
      activo: datos.activo,
    })
    .eq("id", id);
  if (error) throw error;

  await sincronizarEspecialidades(id, datos.especialidadesIds);
}

async function sincronizarEspecialidades(medicoId: string, especialidadesIds: string[]) {
  const supabase = await crearClienteServidor();

  const { data: actuales } = await supabase.from("medico_especialidad").select("especialidad_id").eq("medico_id", medicoId);
  const actualesIds = new Set((actuales ?? []).map((r) => r.especialidad_id));
  const deseadosIds = new Set(especialidadesIds);

  const aQuitar = [...actualesIds].filter((id) => !deseadosIds.has(id));
  const aAgregar = [...deseadosIds].filter((id) => !actualesIds.has(id));

  if (aQuitar.length > 0) {
    const { error } = await supabase.from("medico_especialidad").delete().eq("medico_id", medicoId).in("especialidad_id", aQuitar);
    if (error) throw error;
  }
  if (aAgregar.length > 0) {
    const { error } = await supabase
      .from("medico_especialidad")
      .insert(aAgregar.map((especialidad_id) => ({ medico_id: medicoId, especialidad_id })));
    if (error) throw error;
  }
}

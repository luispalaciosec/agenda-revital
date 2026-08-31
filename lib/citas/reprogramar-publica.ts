import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

/**
 * Reprograma una cita desde el bot o /mis-citas: mantiene médico y
 * consultorio, solo cambia el horario. `contactoId` verifica que quien
 * pide el cambio sea dueño de la cita. La regla de máximo de
 * reprogramaciones vive en la función de Postgres reprogramar_cita.
 */
export async function reprogramarCitaPublica(citaId: string, contactoId: string, nuevoInicio: string) {
  const supabase = crearClienteServicio();

  const { data: cita, error: errorLectura } = await supabase
    .from("citas")
    .select("id, contacto_id, medico_id, consultorio_id, inicio, fin")
    .eq("id", citaId)
    .single();
  if (errorLectura) throw errorLectura;
  if (cita.contacto_id !== contactoId) throw new Error("Esta cita no pertenece a este contacto");

  const duracionMs = new Date(cita.fin).getTime() - new Date(cita.inicio).getTime();
  const nuevoFin = new Date(new Date(nuevoInicio).getTime() + duracionMs).toISOString();

  const { data, error } = await supabase.rpc("reprogramar_cita", {
    p_cita_id: citaId,
    p_nuevo_medico_id: cita.medico_id as string,
    p_nuevo_consultorio_id: cita.consultorio_id as string,
    p_nuevo_inicio: nuevoInicio,
    p_nuevo_fin: nuevoFin,
  });
  if (error) throw error;
  return data;
}

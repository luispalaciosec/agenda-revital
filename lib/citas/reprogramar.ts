import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Reprograma una cita: la vieja pasa a 'reprogramada', se crea una nueva
 * para el horario elegido. Todo el trabajo atómico (marcar + crear +
 * reintentar cupo) vive en la función de Postgres reprogramar_cita, para
 * que un fallo a mitad de camino nunca deje a un paciente sin cita en
 * ningún lado.
 */
export async function reprogramarCitaPanel(input: {
  citaId: string;
  nuevoMedicoId: string | null;
  nuevoConsultorioId: string | null;
  nuevoInicio: string;
  nuevoFin: string;
}) {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.rpc("reprogramar_cita", {
    p_cita_id: input.citaId,
    // El generador de tipos marca estos parámetros uuid como no-nulos
    // porque Postgres no distingue nullability a nivel de parámetro de
    // función; en tiempo de ejecución sí aceptan null (médico/consultorio
    // sin asignar, p. ej. Laboratorio).
    p_nuevo_medico_id: input.nuevoMedicoId as string,
    p_nuevo_consultorio_id: input.nuevoConsultorioId as string,
    p_nuevo_inicio: input.nuevoInicio,
    p_nuevo_fin: input.nuevoFin,
  });
  if (error) throw error;
  return data;
}

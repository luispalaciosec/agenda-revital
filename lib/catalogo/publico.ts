import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export type CanalPublico = "bot" | "web";

/** Especialidades visibles para el bot o la web (§6.1, §7.1) — nunca las internas. */
export async function listarEspecialidadesPublicas(canal: CanalPublico) {
  const supabase = crearClienteServicio();
  const columnaVisible = canal === "bot" ? "visible_bot" : "visible_web";
  const { data, error } = await supabase
    .from("especialidades")
    .select("id, nombre, slug, duracion_min, modo, requiere_aprobacion")
    .eq("activa", true)
    .eq(columnaVisible, true)
    .order("orden_visualizacion");
  if (error) throw error;
  return data;
}

export async function listarMedicosPublicosPorEspecialidadId(especialidadId: string) {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase
    .from("medico_especialidad")
    .select("medico:medicos(id, nombres, apellidos, titulo, activo)")
    .eq("especialidad_id", especialidadId);
  if (error) throw error;

  return (data ?? [])
    .map((v) => v.medico)
    .filter((m): m is { id: string; nombres: string; apellidos: string; titulo: string | null; activo: boolean } => m !== null && m.activo);
}

export async function listarMedicosPublicos(especialidadSlug: string) {
  const supabase = crearClienteServicio();
  const { data: especialidad, error: errorEspecialidad } = await supabase
    .from("especialidades")
    .select("id")
    .eq("slug", especialidadSlug)
    .maybeSingle();
  if (errorEspecialidad) throw errorEspecialidad;
  if (!especialidad) return [];

  return listarMedicosPublicosPorEspecialidadId(especialidad.id);
}

/** Servicios agendables de una especialidad, con su precio PVP/promocional (§7.3: nunca aseguradora/convenio fuera del panel). */
export async function listarServiciosPublicos(especialidadId: string, canal: CanalPublico) {
  const supabase = crearClienteServicio();
  const columnaVisible = canal === "bot" ? "visible_bot" : "visible_web";
  const { data: servicios, error } = await supabase
    .from("servicios")
    .select("id, descripcion, duracion_min, requiere_aprobacion, preparacion_previa")
    .eq("especialidad_id", especialidadId)
    .eq("agendable", true)
    .eq("activo", true)
    .eq(columnaVisible, true)
    .order("descripcion");
  if (error) throw error;

  const conPrecio = await Promise.all(
    (servicios ?? []).map(async (s) => {
      const { data: filas } = await supabase.rpc("precio_vigente_servicio", { p_servicio_id: s.id });
      return { ...s, precio: filas?.[0]?.precio ?? null };
    })
  );
  return conPrecio.filter((s) => s.precio !== null);
}

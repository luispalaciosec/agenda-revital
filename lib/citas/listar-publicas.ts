import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

const ESTADOS_ACTIVOS = ["solicitada", "en_gestion", "confirmada"] as const;

const SELECT_CITA_PUBLICA =
  "id, codigo_publico, inicio, fin, estado, precio_aplicado, reprogramaciones_count, especialidad_id, medico_id, paciente:pacientes(nombres, apellidos), medico:medicos(nombres, apellidos, titulo), especialidad:especialidades(nombre), servicio:servicios(descripcion), consultorio:consultorios(nombre)";

/** GET /api/v1/citas?contacto=&estado=activas y el listado de /mis-citas. */
export async function listarCitasPorContacto(celular: string, soloActivas: boolean) {
  const supabase = crearClienteServicio();
  const { data: contacto } = await supabase.from("contactos").select("id").eq("celular", celular).maybeSingle();
  if (!contacto) return [];

  let query = supabase.from("citas").select(SELECT_CITA_PUBLICA).eq("contacto_id", contacto.id).order("inicio", { ascending: false });
  if (soloActivas) query = query.in("estado", ESTADOS_ACTIVOS);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listarCitasPorContactoId(contactoId: string) {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase
    .from("citas")
    .select(SELECT_CITA_PUBLICA)
    .eq("contacto_id", contactoId)
    .order("inicio", { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerCitaPublica(citaId: string) {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase.from("citas").select(SELECT_CITA_PUBLICA).eq("id", citaId).maybeSingle();
  if (error) throw error;
  return data;
}

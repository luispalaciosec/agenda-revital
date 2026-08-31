import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ServicioResultado {
  id: string;
  codigoRevital: string;
  descripcion: string;
  especialidad: string | null;
  agendable: boolean;
  visibleWeb: boolean;
  visibleBot: boolean;
  activo: boolean;
}

/** Buscador de §11.1: "marcar cualquiera de los 593 servicios como agendable, con buscador". */
export async function buscarServicios(q: string): Promise<ServicioResultado[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("servicios")
    .select("id, codigo_revital, descripcion, agendable, visible_web, visible_bot, activo, especialidad:especialidades(nombre)")
    .order("descripcion")
    .limit(50);

  const termino = q.trim();
  if (termino) consulta = consulta.or(`descripcion.ilike.%${termino}%,codigo_revital.ilike.%${termino}%`);

  const { data, error } = await consulta;
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    codigoRevital: s.codigo_revital,
    descripcion: s.descripcion,
    especialidad: s.especialidad?.nombre ?? null,
    agendable: s.agendable,
    visibleWeb: s.visible_web,
    visibleBot: s.visible_bot,
    activo: s.activo,
  }));
}

export async function actualizarFlagsServicio(
  id: string,
  campo: "agendable" | "visible_web" | "visible_bot" | "activo",
  valor: boolean
) {
  const supabase = await crearClienteServidor();
  const cambios =
    campo === "agendable"
      ? { agendable: valor }
      : campo === "visible_web"
        ? { visible_web: valor }
        : campo === "visible_bot"
          ? { visible_bot: valor }
          : { activo: valor };
  const { error } = await supabase.from("servicios").update(cambios).eq("id", id);
  if (error) throw error;
}

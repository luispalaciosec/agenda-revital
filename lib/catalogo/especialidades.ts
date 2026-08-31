import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ModoAgenda = Database["public"]["Enums"]["modo_agenda_enum"];

export interface DatosEspecialidad {
  nombre: string;
  slug: string;
  modo: ModoAgenda;
  duracionMin: number;
  cuposPorBloque: number;
  activa: boolean;
}

export async function crearEspecialidad(sedeId: string, datos: DatosEspecialidad) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("especialidades").insert({
    sede_id: sedeId,
    nombre: datos.nombre,
    slug: datos.slug,
    modo: datos.modo,
    duracion_min: datos.duracionMin,
    cupos_por_bloque: datos.cuposPorBloque,
    activa: datos.activa,
  });
  if (error) throw error;
}

export async function actualizarEspecialidad(id: string, datos: DatosEspecialidad) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("especialidades")
    .update({
      nombre: datos.nombre,
      slug: datos.slug,
      modo: datos.modo,
      duracion_min: datos.duracionMin,
      cupos_por_bloque: datos.cuposPorBloque,
      activa: datos.activa,
    })
    .eq("id", id);
  if (error) throw error;
}

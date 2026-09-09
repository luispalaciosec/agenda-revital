import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface DatosPromocion {
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  especialidadId: string | null;
  vigenteDesde: string;
  vigenteHasta: string | null;
  activa: boolean;
}

const SELECT_PROMOCION = "id, titulo, descripcion, imagen_url, especialidad_id, vigente_desde, vigente_hasta, activa, especialidad:especialidades(nombre)";

export async function listarPromociones() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("promociones").select(SELECT_PROMOCION).order("vigente_desde", { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearPromocion(datos: DatosPromocion) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("promociones").insert({
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    imagen_url: datos.imagenUrl,
    especialidad_id: datos.especialidadId,
    vigente_desde: datos.vigenteDesde,
    vigente_hasta: datos.vigenteHasta,
    activa: datos.activa,
  });
  if (error) throw error;
}

export async function actualizarPromocion(id: string, datos: DatosPromocion) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("promociones")
    .update({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      imagen_url: datos.imagenUrl,
      especialidad_id: datos.especialidadId,
      vigente_desde: datos.vigenteDesde,
      vigente_hasta: datos.vigenteHasta,
      activa: datos.activa,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function actualizarFlagActivaPromocion(id: string, activa: boolean) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("promociones").update({ activa }).eq("id", id);
  if (error) throw error;
}

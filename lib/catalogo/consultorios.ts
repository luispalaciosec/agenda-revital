import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface DatosConsultorio {
  nombre: string;
  numero: number;
  activo: boolean;
}

export async function crearConsultorio(sedeId: string, datos: DatosConsultorio) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("consultorios").insert({
    sede_id: sedeId,
    nombre: datos.nombre,
    numero: datos.numero,
    activo: datos.activo,
  });
  if (error) throw error;
}

export async function actualizarConsultorio(id: string, datos: DatosConsultorio) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("consultorios")
    .update({ nombre: datos.nombre, numero: datos.numero, activo: datos.activo })
    .eq("id", id);
  if (error) throw error;
}

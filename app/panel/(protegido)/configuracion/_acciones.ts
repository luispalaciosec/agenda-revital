"use server";

import { revalidatePath } from "next/cache";
import { actualizarConfiguracion } from "@/lib/configuracion";
import type { Json } from "@/lib/supabase/database.types";

export async function accionActualizarConfiguracion(clave: string, valor: Json) {
  try {
    await actualizarConfiguracion(clave, valor);
    revalidatePath("/panel/configuracion");
    return { ok: true as const };
  } catch {
    return { ok: false as const, mensaje: "No se pudo guardar. ¿Tienes permiso para editar esta categoría?" };
  }
}

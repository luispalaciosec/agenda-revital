import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export async function actualizarConfiguracion(clave: string, valor: Json) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: usuario } = await supabase.from("usuarios").select("id").eq("auth_user_id", user.id).single();

  const { error } = await supabase
    .from("configuracion")
    .update({ valor, actualizado_por: usuario?.id ?? null })
    .eq("clave", clave);
  if (error) throw error;
}

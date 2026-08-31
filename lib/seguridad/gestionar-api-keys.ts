import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarApiKey } from "./api-keys";

/** Crea una llave nueva; RLS (api_keys_admin_inserta) ya exige rol admin. La llave en claro se devuelve una sola vez. */
export async function crearApiKey(nombre: string) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: usuario } = await supabase.from("usuarios").select("id").eq("auth_user_id", user.id).single();

  const { llave, prefijo, hash } = generarApiKey();
  const { error } = await supabase.from("api_keys").insert({
    nombre,
    prefijo,
    llave_hash: hash,
    creado_por: usuario?.id ?? null,
  });
  if (error) throw error;

  return { llave };
}

export async function revocarApiKey(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("api_keys").update({ activa: false, revocada_en: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

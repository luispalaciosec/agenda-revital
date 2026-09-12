import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface MiPerfil {
  id: string;
  authUserId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fotoUrl: string | null;
  rol: string;
}

/** El propio perfil del usuario autenticado (cualquier rol lo tiene). */
export async function obtenerMiPerfil(): Promise<MiPerfil> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("id, nombres, apellidos, correo, foto_url, rol")
    .eq("auth_user_id", user.id)
    .single();
  if (error || !usuario) redirect("/panel/login");

  return {
    id: usuario.id,
    authUserId: user.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    fotoUrl: usuario.foto_url,
    rol: usuario.rol,
  };
}

/** Cada quien edita su propio nombre/apellido/correo de contacto (RLS: usuarios_update_propio_o_admin). */
export async function actualizarMiPerfil(datos: { nombres: string; apellidos: string; correo: string }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase
    .from("usuarios")
    .update({ nombres: datos.nombres, apellidos: datos.apellidos, correo: datos.correo })
    .eq("auth_user_id", user.id);
  if (error) throw error;
}

export async function actualizarMiFoto(fotoUrl: string) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase.from("usuarios").update({ foto_url: fotoUrl }).eq("auth_user_id", user.id);
  if (error) throw error;
}

import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type RolUsuario = Database["public"]["Enums"]["rol_usuario_enum"];

/** Redirige a la agenda si el usuario actual no tiene uno de los roles permitidos. Usar al inicio de una page.tsx protegida. */
export async function exigirRol(rolesPermitidos: RolUsuario[]) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");

  const { data: usuario } = await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single();
  if (!usuario) redirect("/panel/login");
  if (!rolesPermitidos.includes(usuario.rol)) {
    redirect(usuario.rol === "medico" ? "/panel/mi-agenda" : "/panel/agenda");
  }
}

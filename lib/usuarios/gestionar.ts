import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import type { Database } from "@/lib/supabase/database.types";

type RolUsuario = Database["public"]["Enums"]["rol_usuario_enum"];

export interface DatosInvitacion {
  correo: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}

async function exigirAdmin() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");
  const { data: usuario } = await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single();
  if (usuario?.rol !== "admin") throw new Error("Solo un administrador puede gestionar usuarios.");
}

export async function listarUsuarios() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombres, apellidos, correo, celular, rol, activo, ultimo_acceso, creado_en")
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data;
}

/** Crea el usuario en Supabase Auth (manda el correo de invitación) y su fila en `usuarios`. Solo admin. */
export async function invitarUsuario(datos: DatosInvitacion) {
  await exigirAdmin();

  const servicio = crearClienteServicio();
  const sitioUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agenda-revital.vercel.app";
  const { data: invitado, error: errorInvitacion } = await servicio.auth.admin.inviteUserByEmail(datos.correo, {
    redirectTo: `${sitioUrl}/panel/aceptar-invitacion`,
  });
  if (errorInvitacion) throw errorInvitacion;
  if (!invitado.user) throw new Error("No se pudo crear la invitación.");

  const { error: errorFila } = await servicio.from("usuarios").insert({
    auth_user_id: invitado.user.id,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    correo: datos.correo,
    rol: datos.rol,
    activo: true,
  });
  if (errorFila) throw errorFila;
}

export async function actualizarRolUsuario(id: string, rol: RolUsuario) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("usuarios").update({ rol }).eq("id", id);
  if (error) throw error;
}

export async function actualizarFlagActivoUsuario(id: string, activo: boolean) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("usuarios").update({ activo }).eq("id", id);
  if (error) throw error;
}

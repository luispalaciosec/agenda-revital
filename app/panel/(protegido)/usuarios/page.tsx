import { crearClienteServidor } from "@/lib/supabase/server";
import { listarUsuarios } from "@/lib/usuarios/gestionar";
import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { VistaUsuarios } from "./_componentes/vista-usuarios";

export default async function PaginaUsuarios() {
  await exigirRol(["admin"]);

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuarioActual } = await supabase.from("usuarios").select("id").eq("auth_user_id", user!.id).single();

  const usuarios = await listarUsuarios();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Usuarios</h1>
      <p className="mb-5 text-sm text-text-muted">Invita personas al panel y administra sus roles.</p>
      <VistaUsuarios usuarios={usuarios} idUsuarioActual={usuarioActual?.id ?? ""} />
    </div>
  );
}

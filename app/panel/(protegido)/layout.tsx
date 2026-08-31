import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NavPanel } from "./_componentes/nav-panel";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/panel/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombres, apellidos, rol, activo")
    .eq("auth_user_id", user.id)
    .single();

  if (!usuario || !usuario.activo) {
    await supabase.auth.signOut();
    redirect("/panel/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <NavPanel nombre={`${usuario.nombres} ${usuario.apellidos}`} rol={usuario.rol} />
      <main className="flex-1 bg-surface-sunken">{children}</main>
    </div>
  );
}

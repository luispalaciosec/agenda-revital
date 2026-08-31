import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { VistaApiKeys } from "./_componentes/vista-api-keys";

export default async function PaginaApiKeys() {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = user ? await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single() : { data: null };

  if (usuario?.rol !== "admin") {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">Solo un administrador puede gestionar llaves de API.</p>
      </div>
    );
  }

  const { data: llaves } = await supabase
    .from("api_keys")
    .select("id, nombre, prefijo, activa, creado_en, revocada_en, ultimo_uso_en")
    .order("creado_en", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <Link href="/panel/configuracion" className="mb-3 inline-block text-[13.5px] text-text-muted hover:text-text">
        ← Configuración
      </Link>
      <h1 className="mb-1 text-[22px] font-semibold text-text">Llaves de API</h1>
      <p className="mb-5 text-sm text-text-muted">
        Cada consumidor de <code className="rounded bg-surface-sunken px-1">/api/v1</code> (p. ej. el bot de Jelou) tiene su propia
        llave, revocable de forma independiente sin afectar a las demás (§13). La llave solo se muestra completa una vez, al crearla.
      </p>
      <VistaApiKeys llaves={llaves ?? []} />
    </div>
  );
}

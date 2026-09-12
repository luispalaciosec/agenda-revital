import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { VistaConfiguracion, type FilaConfiguracion } from "./_componentes/vista-configuracion";

const CATEGORIAS_STAFF = new Set(["agenda", "catalogo"]);

export default async function PaginaConfiguracion() {
  await exigirRol(["admin", "supervisor", "admisionista"]);
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = user
    ? await supabase.from("usuarios").select("rol").eq("auth_user_id", user.id).single()
    : { data: null };
  const esAdmin = usuario?.rol === "admin";

  const { data, error } = await supabase.from("configuracion").select("*").order("categoria").order("clave");

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          No se pudo cargar la configuración: {error.message}
        </p>
      </div>
    );
  }

  const filas: FilaConfiguracion[] = (data ?? []).map((c) => ({
    clave: c.clave,
    valor: c.valor,
    categoria: c.categoria,
    descripcion: c.descripcion,
    editable: esAdmin || CATEGORIAS_STAFF.has(c.categoria),
  }));

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold text-text">Configuración</h1>
          <p className="text-sm text-text-muted">
            Todo lo que puede cambiar sin cambiar código (§11). {!esAdmin && "Como admisionista solo editas agenda y catálogo."}
          </p>
        </div>
        {esAdmin && (
          <Link
            href="/panel/configuracion/api-keys"
            className="h-10 shrink-0 rounded-md border border-line-strong px-4 text-sm font-medium leading-10 text-text hover:bg-surface-sunken"
          >
            Llaves de API
          </Link>
        )}
      </div>
      <VistaConfiguracion filas={filas} />
    </div>
  );
}

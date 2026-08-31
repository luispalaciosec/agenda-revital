"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

const ITEMS_NAV = [
  { href: "/panel/agenda", etiqueta: "Agenda del día" },
  { href: "/panel/agenda-semanal", etiqueta: "Agenda semanal" },
  { href: "/panel/sala-espera", etiqueta: "Sala de espera" },
  { href: "/panel/solicitudes", etiqueta: "Solicitudes" },
  { href: "/panel/lista-espera", etiqueta: "Lista de espera" },
  { href: "/panel/pacientes", etiqueta: "Pacientes" },
  { href: "/panel/catalogo", etiqueta: "Catálogo" },
  { href: "/panel/reportes", etiqueta: "Reportes" },
  { href: "/panel/configuracion", etiqueta: "Configuración" },
] as const;

interface NavPanelProps {
  nombre: string;
  rol: string;
}

export function NavPanel({ nombre, rol }: NavPanelProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/panel/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex h-14 items-center gap-4 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy text-sm font-semibold text-text-inverse">
          R
        </div>
        <span className="hidden text-[15px] font-semibold text-text sm:inline">Agenda Revital</span>

        <nav className="scrollbar-none -mx-1 flex flex-1 gap-1 overflow-x-auto px-1" aria-label="Panel">
          {ITEMS_NAV.map((item) => {
            const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                  activo ? "bg-navy text-text-inverse" : "text-text-muted hover:bg-surface-sunken hover:text-text"
                }`}
                aria-current={activo ? "page" : undefined}
              >
                {item.etiqueta}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right leading-tight">
            <div className="text-[13px] font-medium text-text">{nombre}</div>
            <div className="text-[12px] capitalize text-text-muted">{rol}</div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text transition-colors hover:bg-surface-sunken"
          >
            Salir
          </button>
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          className="h-9 shrink-0 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text md:hidden"
        >
          Salir
        </button>
      </div>
    </header>
  );
}

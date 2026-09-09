"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Users,
  Inbox,
  Hourglass,
  Contact,
  LayoutGrid,
  BarChart3,
  Megaphone,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import isotipo from "@/app/assets/favicon.png";

const ITEMS_NAV: Array<{ href: string; etiqueta: string; icono: LucideIcon; roles?: string[] }> = [
  { href: "/panel/agenda", etiqueta: "Agenda del día", icono: CalendarDays },
  { href: "/panel/agenda-semanal", etiqueta: "Agenda semanal", icono: CalendarRange },
  { href: "/panel/sala-espera", etiqueta: "Sala de espera", icono: Users },
  { href: "/panel/solicitudes", etiqueta: "Solicitudes", icono: Inbox },
  { href: "/panel/lista-espera", etiqueta: "Lista de espera", icono: Hourglass },
  { href: "/panel/pacientes", etiqueta: "Pacientes", icono: Contact },
  { href: "/panel/catalogo", etiqueta: "Catálogo", icono: LayoutGrid },
  { href: "/panel/reportes", etiqueta: "Reportes", icono: BarChart3, roles: ["admin", "supervisor"] },
  { href: "/panel/marketing", etiqueta: "Marketing", icono: Megaphone, roles: ["admin", "supervisor"] },
  { href: "/panel/usuarios", etiqueta: "Usuarios", icono: UserCog, roles: ["admin"] },
  { href: "/panel/configuracion", etiqueta: "Configuración", icono: Settings },
];

interface NavPanelProps {
  nombre: string;
  rol: string;
  solicitudesPendientes: number;
}

export function NavPanel({ nombre, rol, solicitudesPendientes }: NavPanelProps) {
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
        <Image src={isotipo} alt="Revital" className="h-8 w-8 shrink-0" priority />
        <span className="text-[15px] font-semibold text-text">Agenda Revital</span>

        <div className="ml-auto hidden items-center gap-3 md:flex">
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
          className="ml-auto h-9 shrink-0 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text md:hidden"
        >
          Salir
        </button>
      </div>

      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-line px-2" aria-label="Panel">
        {ITEMS_NAV.filter((item) => !item.roles || item.roles.includes(rol)).map((item) => {
          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex shrink-0 flex-col items-center gap-1 px-3 pb-2 pt-2.5 text-center transition-colors ${
                activo ? "text-navy" : "text-text-muted hover:text-text"
              }`}
              aria-current={activo ? "page" : undefined}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${activo ? "bg-navy text-text-inverse" : "bg-transparent"}`}>
                <Icono size={20} strokeWidth={2} />
              </span>
              <span className="whitespace-nowrap text-[11.5px] font-medium leading-none">{item.etiqueta}</span>
              {item.href === "/panel/solicitudes" && solicitudesPendientes > 0 && (
                <span className="tabular absolute right-1.5 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-text-inverse">
                  {solicitudesPendientes}
                </span>
              )}
              {activo && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-navy" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

"use client";

import { useState } from "react";
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
  Menu,
  X,
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
];

interface NavPanelProps {
  nombre: string;
  rol: string;
  solicitudesPendientes: number;
}

export function NavPanel({ nombre, rol, solicitudesPendientes }: NavPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const itemsVisibles = ITEMS_NAV.filter((item) => !item.roles || item.roles.includes(rol));

  async function cerrarSesion() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/panel/login");
    router.refresh();
  }

  function esActivo(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text hover:bg-surface-sunken md:hidden"
        >
          {menuAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Image src={isotipo} alt="Revital" className="h-8 w-8 shrink-0" priority />
        <span className="hidden text-[15px] font-semibold text-text sm:inline">Agenda Revital</span>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right leading-tight md:block">
            <div className="text-[13px] font-medium text-text">{nombre}</div>
            <div className="text-[12px] capitalize text-text-muted">{rol}</div>
          </div>
          <Link
            href="/panel/configuracion"
            aria-label="Configuración"
            title="Configuración"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-surface-sunken ${
              esActivo("/panel/configuracion") ? "text-navy" : "text-text-muted"
            }`}
          >
            <Settings size={19} strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={cerrarSesion}
            className="h-9 shrink-0 rounded-md border border-line-strong px-2.5 text-[13px] font-medium text-text transition-colors hover:bg-surface-sunken sm:px-3"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Nav de escritorio/tablet: fila de íconos, siempre visible desde md */}
      <nav className="scrollbar-none hidden gap-1 overflow-x-auto border-t border-line px-2 md:flex" aria-label="Panel">
        {itemsVisibles.map((item) => (
          <ItemNav key={item.href} item={item} activo={esActivo(item.href)} solicitudesPendientes={solicitudesPendientes} />
        ))}
      </nav>

      {/* Menú desplegable de celular/tablet chico */}
      {menuAbierto && (
        <>
          <div className="fixed inset-0 top-14 z-40 bg-black/20 md:hidden" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
          <nav
            className="absolute inset-x-0 top-14 z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-line bg-surface shadow-lg md:hidden"
            aria-label="Panel (menú)"
          >
            <div className="border-b border-line px-4 py-3">
              <div className="text-[13.5px] font-medium text-text">{nombre}</div>
              <div className="text-[12px] capitalize text-text-muted">{rol}</div>
            </div>
            <ul>
              {itemsVisibles.map((item) => {
                const activo = esActivo(item.href);
                const Icono = item.icono;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuAbierto(false)}
                      className={`relative flex items-center gap-3 border-b border-line px-4 py-3 text-[14px] font-medium transition-colors ${
                        activo ? "bg-surface-sunken text-navy" : "text-text hover:bg-surface-sunken"
                      }`}
                      aria-current={activo ? "page" : undefined}
                    >
                      <Icono size={20} strokeWidth={2} />
                      {item.etiqueta}
                      {item.href === "/panel/solicitudes" && solicitudesPendientes > 0 && (
                        <span className="tabular ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-text-inverse">
                          {solicitudesPendientes}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

function ItemNav({
  item,
  activo,
  solicitudesPendientes,
}: {
  item: { href: string; etiqueta: string; icono: LucideIcon };
  activo: boolean;
  solicitudesPendientes: number;
}) {
  const Icono = item.icono;
  return (
    <Link
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
}

"use client";

import { useMemo, useState } from "react";
import { formatoHora } from "@/lib/formato";
import { BadgeEstado } from "./badge-estado";
import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

export interface CitaAgenda {
  id: string;
  codigoPublico: string | null;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  paciente: { nombres: string; apellidos: string } | null;
  medico: { id: string; nombres: string; apellidos: string; titulo: string | null } | null;
  consultorio: { id: string; nombre: string } | null;
  especialidad: { nombre: string } | null;
  servicio: { descripcion: string } | null;
}

type Agrupacion = "medico" | "consultorio";

interface Grupo {
  clave: string;
  etiqueta: string;
  citas: CitaAgenda[];
}

function agrupar(citas: CitaAgenda[], por: Agrupacion): Grupo[] {
  const grupos = new Map<string, Grupo>();

  for (const cita of citas) {
    const referencia = por === "medico" ? cita.medico : cita.consultorio;
    const clave = referencia?.id ?? "sin-asignar";
    const etiqueta =
      por === "medico"
        ? cita.medico
          ? `${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`.trim()
          : "Sin médico asignado"
        : (cita.consultorio?.nombre ?? "Sin consultorio asignado");

    if (!grupos.has(clave)) grupos.set(clave, { clave, etiqueta, citas: [] });
    grupos.get(clave)!.citas.push(cita);
  }

  return [...grupos.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"));
}

export function VistaAgenda({ citas }: { citas: CitaAgenda[] }) {
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("medico");
  const grupos = useMemo(() => agrupar(citas, agrupacion), [citas, agrupacion]);

  if (citas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-text">No hay citas agendadas para hoy</p>
        <p className="mt-1 text-sm text-text-muted">
          Las citas que se agenden por web, bot o panel van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-line-strong bg-surface p-0.5">
        <BotonAgrupacion activo={agrupacion === "medico"} onClick={() => setAgrupacion("medico")}>
          Por médico
        </BotonAgrupacion>
        <BotonAgrupacion activo={agrupacion === "consultorio"} onClick={() => setAgrupacion("consultorio")}>
          Por consultorio
        </BotonAgrupacion>
      </div>

      <div className="space-y-5">
        {grupos.map((grupo) => (
          <section key={grupo.clave} className="overflow-hidden rounded-lg border border-line bg-surface">
            <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
              {grupo.etiqueta}
              <span className="ml-2 font-normal text-text-muted">
                {grupo.citas.length} {grupo.citas.length === 1 ? "cita" : "citas"}
              </span>
            </h2>
            <ul>
              {grupo.citas.map((cita) => (
                <li
                  key={cita.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <span className="tabular w-[92px] shrink-0 text-[14px] font-medium text-text">
                    {formatoHora(cita.inicio)}–{formatoHora(cita.fin)}
                  </span>
                  <span className="min-w-[160px] flex-1 text-[14px] text-text">
                    {cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : "—"}
                  </span>
                  <span className="text-[13px] text-text-muted">
                    {cita.servicio?.descripcion ?? cita.especialidad?.nombre ?? "—"}
                  </span>
                  {agrupacion === "medico" && cita.consultorio && (
                    <span className="text-[13px] text-text-muted">{cita.consultorio.nombre}</span>
                  )}
                  <BadgeEstado estado={cita.estado} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function BotonAgrupacion({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-8 rounded-[5px] px-3 text-[13px] font-medium transition-colors ${
        activo ? "bg-navy text-text-inverse" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

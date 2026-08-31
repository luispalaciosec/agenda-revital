"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora } from "@/lib/formato";
import { accionMarcarAtendida, accionMarcarLlegada } from "../_acciones";
import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

export interface CitaSala {
  id: string;
  codigoPublico: string | null;
  inicio: string;
  estado: EstadoCita;
  llegadaEn: string | null;
  atendidaEn: string | null;
  paciente: { nombres: string; apellidos: string } | null;
  medico: { nombres: string; apellidos: string; titulo: string | null } | null;
  especialidad: { nombre: string } | null;
  servicio: { descripcion: string } | null;
}

function nombrePaciente(c: CitaSala) {
  return c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : "—";
}

function nombreMedico(c: CitaSala) {
  return c.medico ? `${c.medico.titulo ?? ""} ${c.medico.nombres} ${c.medico.apellidos}`.trim() : "Sin médico asignado";
}

function minutosDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
}

export function VistaSalaEspera({ citas }: { citas: CitaSala[] }) {
  const router = useRouter();
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const porLlegar = useMemo(
    () => citas.filter((c) => c.estado === "confirmada" && !c.llegadaEn).sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [citas]
  );
  const enEspera = useMemo(
    () =>
      citas
        .filter((c) => c.estado === "confirmada" && c.llegadaEn && !c.atendidaEn)
        .sort((a, b) => a.llegadaEn!.localeCompare(b.llegadaEn!)),
    [citas]
  );
  const atendidos = useMemo(() => citas.filter((c) => c.estado === "atendida"), [citas]);

  if (citas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-text">No hay citas confirmadas para hoy</p>
        <p className="mt-1 text-sm text-text-muted">Cuando lleguen pacientes con cita del día, aparecen acá.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
          Por llegar <span className="ml-1 font-normal text-text-muted">{porLlegar.length}</span>
        </h2>
        {porLlegar.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">Todos los que tenían cita ya llegaron.</p>
        ) : (
          <ul>
            {porLlegar.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0">
                <span className="tabular w-[56px] shrink-0 text-[14px] font-medium text-text">{formatoHora(c.inicio)}</span>
                <div className="min-w-[140px] flex-1">
                  <p className="text-[14px] text-text">{nombrePaciente(c)}</p>
                  <p className="text-[12.5px] text-text-muted">{nombreMedico(c)}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await accionMarcarLlegada(c.id);
                    router.refresh();
                  }}
                  className="h-8 shrink-0 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90"
                >
                  Marcar llegada
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
          En espera <span className="ml-1 font-normal text-text-muted">{enEspera.length}</span>
        </h2>
        {enEspera.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">Nadie esperando en el centro ahora mismo.</p>
        ) : (
          <ul>
            {enEspera.map((c) => {
              const espera = minutosDesde(c.llegadaEn!, ahora);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="min-w-[140px] flex-1">
                    <p className="text-[14px] text-text">{nombrePaciente(c)}</p>
                    <p className="text-[12.5px] text-text-muted">{nombreMedico(c)}</p>
                  </div>
                  <span
                    className={`tabular text-[12.5px] font-medium ${espera >= 20 ? "text-danger" : espera >= 10 ? "text-warning" : "text-text-muted"}`}
                  >
                    esperando {espera} min
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await accionMarcarAtendida(c.id);
                      router.refresh();
                    }}
                    className="h-8 shrink-0 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                  >
                    Marcar atendido
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {atendidos.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-line bg-surface lg:col-span-2">
          <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
            Atendidos hoy <span className="ml-1 font-normal text-text-muted">{atendidos.length}</span>
          </h2>
          <ul>
            {atendidos.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 text-[13.5px] last:border-b-0">
                <span className="tabular w-[56px] shrink-0 text-text-muted">{formatoHora(c.inicio)}</span>
                <span className="flex-1 text-text">{nombrePaciente(c)}</span>
                <span className="text-text-muted">{c.servicio?.descripcion ?? c.especialidad?.nombre}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

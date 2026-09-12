"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora } from "@/lib/formato";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { accionMoverMiPaciente } from "../_acciones";
import type { TurnoMedico } from "@/lib/medicos/mi-agenda";
import type { PuntoAtencion } from "@/lib/seguimiento/tablero";

function nombrePaciente(p: { nombres: string; apellidos: string } | null) {
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

function minutosDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
}

function duracionMin(inicio: string, fin: string): number {
  return Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
}

export function VistaMiAgenda({ turnos, puntos }: { turnos: TurnoMedico[]; puntos: PuntoAtencion[] }) {
  const router = useRouter();
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    const canal = supabase
      .channel("mi-agenda-cita-eventos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cita_eventos" }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  async function mover(citaId: string, puntoId: string) {
    const resultado = await accionMoverMiPaciente(citaId, puntoId);
    if (!resultado.ok) alert(resultado.mensaje);
    router.refresh();
  }

  const esperandome = useMemo(
    () => turnos.filter((t) => t.estado !== "atendida" && t.puntoAtencion && !t.puntoAtencion.esPuntoSalida).length,
    [turnos]
  );
  const atendidos = useMemo(() => turnos.filter((t) => t.estado === "atendida").length, [turnos]);

  if (turnos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-text">No tienes citas confirmadas para hoy</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {turnos.map((t) => {
            const indicePunto = t.puntoAtencion ? puntos.findIndex((p) => p.id === t.puntoAtencion!.id) : -1;
            const siguiente = indicePunto >= 0 ? (puntos[indicePunto + 1] ?? null) : null;
            const espera = t.puntoAtencionDesde ? minutosDesde(t.puntoAtencionDesde, ahora) : 0;

            let etiquetaAccion: string | null = null;
            if (siguiente) {
              etiquetaAccion = siguiente.nombre === "Consultorio" ? "Iniciar consulta" : siguiente.esPuntoSalida ? "Finalizar consulta" : `Marcar en ${siguiente.nombre}`;
            }

            return (
              <li
                key={t.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 ${
                  t.puntoAtencion && !t.puntoAtencion.esPuntoSalida && t.estado !== "atendida" ? "bg-surface-brand" : ""
                }`}
              >
                <div className="tabular w-[64px] shrink-0">
                  <p className="text-[15px] font-semibold text-navy">{formatoHora(t.inicio)}</p>
                  <p className="text-[11px] text-text-muted">{duracionMin(t.inicio, t.fin)} min</p>
                </div>
                <div className="min-w-[160px] flex-1">
                  <p className="text-[14.5px] font-medium text-text">{nombrePaciente(t.paciente)}</p>
                  <p className="text-[12.5px] text-text-muted">{t.servicio?.descripcion ?? t.especialidad?.nombre}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {t.estado === "atendida" ? (
                    <span className="rounded-full bg-info-bg px-2.5 py-1 text-[11.5px] font-semibold text-teal-deep">Atendido</span>
                  ) : t.puntoAtencion ? (
                    <span className="rounded-full bg-warning-bg px-2.5 py-1 text-[11.5px] font-semibold text-warning">
                      Esperándote · {espera} min
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-semibold text-text-muted">Aún no llega</span>
                  )}
                  {siguiente && t.estado !== "atendida" && (
                    <button
                      type="button"
                      onClick={() => mover(t.id, siguiente.id)}
                      className="h-8 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90"
                    >
                      {etiquetaAccion}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="mb-2.5 text-[13.5px] font-semibold text-text">Ahora mismo</h3>
          <div className="flex items-baseline justify-between border-b border-line py-1.5 text-[13px] text-text-muted">
            Esperándote <b className="text-[18px] font-bold text-navy">{esperandome}</b>
          </div>
          <div className="flex items-baseline justify-between border-b border-line py-1.5 text-[13px] text-text-muted">
            Atendidos hoy <b className="text-[18px] font-bold text-navy">{atendidos}</b>
          </div>
          <div className="flex items-baseline justify-between py-1.5 text-[13px] text-text-muted">
            Total del día <b className="text-[18px] font-bold text-navy">{turnos.length}</b>
          </div>
        </div>
        <div className="rounded-lg bg-info-bg p-3.5 text-[12.5px] leading-relaxed text-text-muted">
          El sistema no guarda diagnóstico ni motivo de consulta — solo el punto por el que va el paciente, para que admisión y farmacia sepan dónde está.
        </div>
      </div>
    </div>
  );
}

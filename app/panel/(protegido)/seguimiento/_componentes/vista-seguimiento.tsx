"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora } from "@/lib/formato";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { accionMoverPaciente } from "../_acciones";
import type { PuntoAtencion, PacienteEnRecorrido, CitaPorLlegar } from "@/lib/seguimiento/tablero";

/** Minutos de espera desde los que se avisa en ámbar. La marca no usa rojo decorativo (TOKENS_DISENO §7): solo señala "más de lo usual". */
const UMBRAL_ESPERA_MIN = 15;

function nombrePaciente(p: { nombres: string; apellidos: string } | null) {
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

function minutosDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
}

export function VistaSeguimiento({
  puntos,
  pacientesIniciales,
  porLlegarIniciales,
}: {
  puntos: PuntoAtencion[];
  pacientesIniciales: PacienteEnRecorrido[];
  porLlegarIniciales: CitaPorLlegar[];
}) {
  const router = useRouter();
  const [ahora, setAhora] = useState(() => Date.now());

  const puntoLlegada = useMemo(() => puntos.find((p) => p.esPuntoLlegada), [puntos]);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Primera tabla del repo con Supabase Realtime: cualquier movimiento de
  // cualquier admisionista/médico refresca el tablero de todos, sin polling.
  useEffect(() => {
    const supabase = crearClienteNavegador();
    const canal = supabase
      .channel("seguimiento-cita-eventos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cita_eventos" }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  async function mover(citaId: string, puntoId: string) {
    const resultado = await accionMoverPaciente(citaId, puntoId);
    if (!resultado.ok) alert(resultado.mensaje);
    router.refresh();
  }

  return (
    <div>
      {porLlegarIniciales.length > 0 && puntoLlegada && (
        <section className="mb-5 overflow-hidden rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
            Por llegar hoy <span className="ml-1 font-normal text-text-muted">{porLlegarIniciales.length}</span>
          </h2>
          <ul>
            {porLlegarIniciales.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0">
                <span className="tabular w-[56px] shrink-0 text-[14px] font-medium text-text">{formatoHora(c.inicio)}</span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-[14px] text-text">{nombrePaciente(c.paciente)}</p>
                  <p className="text-[12.5px] text-text-muted">{c.servicio?.descripcion ?? c.especialidad?.nombre}</p>
                </div>
                <button
                  type="button"
                  onClick={() => mover(c.id, puntoLlegada.id)}
                  className="h-8 shrink-0 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90"
                >
                  Marcar llegada
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {puntos.map((punto, i) => {
          const siguiente = puntos[i + 1] ?? null;
          const enEstePunto = pacientesIniciales.filter((p) => p.puntoAtencionId === punto.id);
          return (
            <div key={punto.id} className="flex min-h-[280px] flex-col rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
                <span className="text-[13px] font-semibold text-text">{punto.nombre}</span>
                <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[11.5px] font-semibold text-text-muted">
                  {enEstePunto.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {enEstePunto.length === 0 ? (
                  <p className="m-auto px-2 text-center text-[12px] text-text-muted">Nadie aquí</p>
                ) : (
                  enEstePunto.map((p) => {
                    const espera = p.puntoAtencionDesde ? minutosDesde(p.puntoAtencionDesde, ahora) : 0;
                    const enAlerta = espera >= UMBRAL_ESPERA_MIN && !punto.esPuntoSalida;
                    return (
                      <div key={p.id} className="rounded-md border border-line p-2.5 text-[12.5px]">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <span className="font-medium text-text">{nombrePaciente(p.paciente)}</span>
                          <span className="tabular shrink-0 text-[11.5px] text-text-muted">{formatoHora(p.inicio)}</span>
                        </div>
                        <p className="mb-2 text-[11.5px] text-text-muted">
                          {p.servicio?.descripcion ?? p.especialidad?.nombre}
                          {p.medico && <> · {p.medico.nombres} {p.medico.apellidos}</>}
                          {p.consultorio && <> · {p.consultorio.nombre}</>}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              enAlerta ? "bg-warning-bg text-warning" : "bg-success-bg text-success"
                            }`}
                          >
                            {espera} min aquí
                          </span>
                          {siguiente && (
                            <button
                              type="button"
                              onClick={() => mover(p.id, siguiente.id)}
                              className="h-7 shrink-0 rounded-md border border-line-strong px-2 text-[11.5px] font-medium text-text hover:bg-surface-sunken"
                            >
                              {siguiente.nombre} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {porLlegarIniciales.length === 0 && pacientesIniciales.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-[14px] text-text-muted">
          No hay citas confirmadas para hoy.
        </p>
      )}
    </div>
  );
}

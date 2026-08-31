"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora } from "@/lib/formato";
import { accionGestionarSolicitud } from "../_acciones";

export interface SolicitudPendiente {
  id: string;
  venceEn: string;
  creadoEn: string;
  cita: {
    id: string;
    codigoPublico: string | null;
    inicio: string;
    paciente: { nombres: string; apellidos: string } | null;
    especialidad: { nombre: string } | null;
    servicio: { descripcion: string } | null;
  };
}

function estaVencida(venceEn: string): boolean {
  return new Date(venceEn).getTime() < Date.now();
}

export function VistaSolicitudes({ solicitudes }: { solicitudes: SolicitudPendiente[] }) {
  if (solicitudes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-text">No hay solicitudes pendientes</p>
        <p className="mt-1 text-sm text-text-muted">
          Los procedimientos pedidos por web o bot van a esperar acá hasta que los apruebes o rechaces.
        </p>
      </div>
    );
  }

  const vencidas = solicitudes.filter((s) => estaVencida(s.venceEn)).length;

  return (
    <div>
      {vencidas > 0 && (
        <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-[13.5px] text-danger">
          {vencidas} {vencidas === 1 ? "solicitud lleva" : "solicitudes llevan"} más del SLA de 6 horas laborables sin resolver.
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {solicitudes.map((s) => (
            <FilaSolicitud key={s.id} solicitud={s} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function FilaSolicitud({ solicitud }: { solicitud: SolicitudPendiente }) {
  const router = useRouter();
  const [gestionando, setGestionando] = useState<"aceptar" | "rechazar" | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const vencida = estaVencida(solicitud.venceEn);
  const { cita } = solicitud;

  async function resolver(aceptar: boolean) {
    setGestionando(aceptar ? "aceptar" : "rechazar");
    setError(null);
    const resultado = await accionGestionarSolicitud(solicitud.id, aceptar, aceptar ? undefined : motivo || undefined);
    setGestionando(null);
    if (resultado.ok) {
      router.refresh();
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="min-w-[180px] flex-1">
          <p className="text-[14px] font-medium text-text">
            {cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : "—"}
          </p>
          <p className="text-[12.5px] text-text-muted">
            {cita.servicio?.descripcion ?? cita.especialidad?.nombre} · pidió {formatoHora(cita.inicio)}
          </p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${vencida ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"}`}>
          {vencida ? "Vencida" : "Vence " + new Date(solicitud.venceEn).toLocaleString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>

        {!rechazando && (
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={gestionando !== null}
              onClick={() => resolver(true)}
              className="h-8 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90 disabled:opacity-50"
            >
              {gestionando === "aceptar" ? "Aprobando…" : "Aprobar"}
            </button>
            <button
              type="button"
              disabled={gestionando !== null}
              onClick={() => setRechazando(true)}
              className="h-8 rounded-md border border-danger px-3 text-[12.5px] font-medium text-danger hover:bg-danger-bg disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>

      {rechazando && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-md bg-surface-sunken px-3 py-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            className="h-8 min-w-[200px] flex-1 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-text"
          />
          <button
            type="button"
            disabled={gestionando !== null}
            onClick={() => resolver(false)}
            className="h-8 rounded-md bg-danger px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90 disabled:opacity-50"
          >
            {gestionando === "rechazar" ? "Rechazando…" : "Confirmar rechazo"}
          </button>
          <button
            type="button"
            onClick={() => setRechazando(false)}
            className="h-8 rounded-md px-2.5 text-[12.5px] font-medium text-text-muted hover:text-text"
          >
            Deshacer
          </button>
        </div>
      )}

      {error && (
        <p role="alert" aria-live="polite" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

"use client";

import { useState } from "react";
import { formatoFechaDMY, formatoHora, hoyGuayaquil } from "@/lib/formato";
import { accionCancelarViaToken, accionObtenerFranjasViaToken, accionReprogramarViaToken } from "../_acciones";

interface CitaMisCitas {
  id: string;
  codigo_publico: string | null;
  inicio: string;
  fin: string;
  estado: string;
  especialidad_id: string;
  medico_id: string | null;
  precio_aplicado: number;
  medico: { nombres: string; apellidos: string; titulo: string | null } | null;
  especialidad: { nombre: string } | null;
  servicio: { descripcion: string } | null;
}

const ESTADOS_ACTIVOS = new Set(["solicitada", "en_gestion", "confirmada"]);

const ETIQUETAS_ESTADO: Record<string, string> = {
  solicitada: "En revisión",
  en_gestion: "En revisión",
  confirmada: "Confirmada",
  atendida: "Atendida",
  no_show: "No asistió",
  cancelada_paciente: "Cancelada",
  cancelada_centro: "Cancelada por el centro",
  reprogramada: "Reprogramada",
  rechazada: "Rechazada",
};

export function ListaMisCitas({ token, citas }: { token: string; citas: CitaMisCitas[] }) {
  if (citas.length === 0) {
    return <p className="rounded-lg border border-line bg-surface p-6 text-center text-[14.5px] text-text-muted">No tienes citas registradas con este número.</p>;
  }

  return (
    <ul className="space-y-3">
      {citas.map((cita) => (
        <FilaCita key={cita.id} token={token} cita={cita} />
      ))}
    </ul>
  );
}

function FilaCita({ token, cita }: { token: string; cita: CitaMisCitas }) {
  const [modo, setModo] = useState<"ver" | "cancelar" | "reprogramar">("ver");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activa = ESTADOS_ACTIVOS.has(cita.estado);

  async function cancelar() {
    setEnviando(true);
    setError(null);
    const r = await accionCancelarViaToken(token, cita.id);
    setEnviando(false);
    if (!r.ok) setError(r.mensaje);
    else setModo("ver");
  }

  return (
    <li className="rounded-lg border border-line bg-surface p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-text">{cita.servicio?.descripcion ?? cita.especialidad?.nombre}</p>
          <p className="tabular text-[13.5px] text-text-muted">
            {formatoFechaDMY(cita.inicio.slice(0, 10))} · {formatoHora(cita.inicio)}
            {cita.medico && ` · ${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-sunken px-2.5 py-1 text-[12px] font-medium text-text-muted">
          {ETIQUETAS_ESTADO[cita.estado] ?? cita.estado}
        </span>
      </div>

      {error && <p className="mt-2 rounded-md bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>}

      {activa && modo === "ver" && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setModo("reprogramar")} className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text hover:bg-surface-sunken">
            Reprogramar
          </button>
          <button type="button" onClick={() => setModo("cancelar")} className="h-9 rounded-md border border-danger px-3 text-[13px] font-medium text-danger hover:bg-danger-bg">
            Cancelar
          </button>
        </div>
      )}

      {modo === "cancelar" && (
        <div className="mt-3 rounded-md bg-danger-bg p-3">
          <p className="mb-2 text-[13px] text-text">¿Cancelar esta cita? No se puede deshacer.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={cancelar}
              className="h-9 rounded-md bg-danger px-3.5 text-[13px] font-medium text-text-inverse hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Cancelando…" : "Sí, cancelar"}
            </button>
            <button type="button" onClick={() => setModo("ver")} className="h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken">
              Volver
            </button>
          </div>
        </div>
      )}

      {modo === "reprogramar" && <ReprogramarCita token={token} cita={cita} onCerrar={() => setModo("ver")} />}
    </li>
  );
}

function ReprogramarCita({ token, cita, onCerrar }: { token: string; cita: CitaMisCitas; onCerrar: () => void }) {
  const [fecha, setFecha] = useState(hoyGuayaquil());
  const [franjas, setFranjas] = useState<Array<{ inicio: string; fin: string; medicoId: string | null }>>([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar(nuevaFecha: string) {
    setFecha(nuevaFecha);
    setCargando(true);
    setSeleccionada(null);
    const r = await accionObtenerFranjasViaToken(cita.especialidad_id, cita.medico_id, nuevaFecha);
    setFranjas(r);
    setCargando(false);
  }

  async function confirmar() {
    if (!seleccionada) return;
    setEnviando(true);
    setError(null);
    const r = await accionReprogramarViaToken(token, cita.id, seleccionada);
    setEnviando(false);
    if (r.ok) onCerrar();
    else setError(r.mensaje);
  }

  return (
    <div className="mt-3 space-y-3 rounded-md bg-surface-sunken p-3">
      <input
        type="date"
        min={hoyGuayaquil()}
        value={fecha}
        onChange={(e) => buscar(e.target.value)}
        className="tabular h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14px] text-text"
      />
      {cargando ? (
        <p className="text-[13px] text-text-muted">Buscando horarios…</p>
      ) : franjas.length === 0 ? (
        <p className="text-[13px] text-text-muted">No hay cupos ese día.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {franjas.map((f) => (
            <button
              key={f.inicio}
              type="button"
              onClick={() => setSeleccionada(f.inicio)}
              className={`tabular h-9 rounded-md border px-3 text-[13px] font-medium ${
                seleccionada === f.inicio ? "border-navy bg-navy text-text-inverse" : "border-line-strong bg-surface text-text hover:bg-surface-sunken"
              }`}
            >
              {formatoHora(f.inicio)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!seleccionada || enviando}
          onClick={confirmar}
          className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {enviando ? "Guardando…" : "Confirmar nuevo horario"}
        </button>
        <button type="button" onClick={onCerrar} className="h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken">
          Cancelar
        </button>
      </div>
    </div>
  );
}

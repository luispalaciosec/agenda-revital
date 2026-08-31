"use client";

import { useMemo, useState } from "react";
import { accionActualizarConfiguracion } from "../_acciones";
import type { Json } from "@/lib/supabase/database.types";

export interface FilaConfiguracion {
  clave: string;
  valor: Json;
  categoria: string;
  descripcion: string | null;
  editable: boolean;
}

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  agenda: "Agenda",
  catalogo: "Catálogo",
  integraciones: "Integraciones",
  mensajes: "Mensajes",
  precios: "Precios",
  legal: "Legal",
  marca: "Marca",
};

function agruparPorCategoria(filas: FilaConfiguracion[]): [string, FilaConfiguracion[]][] {
  const grupos = new Map<string, FilaConfiguracion[]>();
  for (const fila of filas) {
    if (!grupos.has(fila.categoria)) grupos.set(fila.categoria, []);
    grupos.get(fila.categoria)!.push(fila);
  }
  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function VistaConfiguracion({ filas }: { filas: FilaConfiguracion[] }) {
  const grupos = useMemo(() => agruparPorCategoria(filas), [filas]);

  return (
    <div className="space-y-6">
      {grupos.map(([categoria, filasDeCategoria]) => (
        <section key={categoria}>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
            {ETIQUETAS_CATEGORIA[categoria] ?? categoria}
          </h2>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <ul>
              {filasDeCategoria.map((fila) => (
                <FilaEditable key={fila.clave} fila={fila} />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}

function FilaEditable({ fila }: { fila: FilaConfiguracion }) {
  const [valor, setValor] = useState<Json>(fila.valor);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [huboCambio, setHuboCambio] = useState(false);

  async function guardar(nuevoValor: Json) {
    setValor(nuevoValor);
    setHuboCambio(true);
    setGuardado(false);
    setGuardando(true);
    setError(null);
    const resultado = await accionActualizarConfiguracion(fila.clave, nuevoValor);
    setGuardando(false);
    if (resultado.ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line px-4 py-3 last:border-b-0">
      <div className="min-w-[220px] flex-1">
        <p className="tabular text-[13.5px] font-medium text-text">{fila.clave}</p>
        {fila.descripcion && <p className="text-[12.5px] text-text-muted">{fila.descripcion}</p>}
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
        {!fila.editable ? (
          <span className="tabular rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] text-text-muted">
            {formatoValorSoloLectura(valor)}
          </span>
        ) : typeof fila.valor === "boolean" ? (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(valor)}
            onClick={() => guardar(!valor)}
            disabled={guardando}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${valor ? "bg-green-deep" : "bg-line-strong"}`}
          >
            <span
              className={`block h-5 w-5 translate-x-1 rounded-full bg-surface shadow transition-transform ${valor ? "translate-x-6" : ""}`}
            />
          </button>
        ) : typeof fila.valor === "number" ? (
          <input
            type="number"
            defaultValue={valor as number}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n) && n !== valor) guardar(n);
            }}
            disabled={guardando}
            className="tabular h-9 w-24 rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text"
          />
        ) : (
          <input
            type="text"
            defaultValue={typeof valor === "string" ? valor : JSON.stringify(valor)}
            onBlur={(e) => {
              if (e.target.value !== valor) guardar(e.target.value);
            }}
            disabled={guardando}
            className="h-9 w-56 rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text"
          />
        )}
        {huboCambio && guardado && <span className="text-[12px] text-success">Guardado</span>}
      </div>
    </li>
  );
}

function formatoValorSoloLectura(valor: Json): string {
  if (typeof valor === "boolean") return valor ? "Activo" : "Apagado";
  if (valor === null) return "—";
  if (typeof valor === "string") return valor;
  return JSON.stringify(valor);
}

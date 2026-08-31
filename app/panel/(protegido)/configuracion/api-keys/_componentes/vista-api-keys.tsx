"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatoFechaHoraDMY } from "@/lib/formato";
import { accionCrearApiKey, accionRevocarApiKey } from "../_acciones";

interface FilaApiKey {
  id: string;
  nombre: string;
  prefijo: string;
  activa: boolean;
  creado_en: string;
  revocada_en: string | null;
  ultimo_uso_en: string | null;
}

export function VistaApiKeys({ llaves }: { llaves: FilaApiKey[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [llaveRevelada, setLlaveRevelada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    if (!nombre.trim()) return;
    setCreando(true);
    setError(null);
    const r = await accionCrearApiKey(nombre.trim());
    setCreando(false);
    if (r.ok) {
      setLlaveRevelada(r.llave);
      setNombre("");
      router.refresh();
    } else {
      setError(r.mensaje);
    }
  }

  async function revocar(id: string) {
    if (!confirm("¿Revocar esta llave? Cualquier consumidor que la use dejará de poder llamar al API de inmediato.")) return;
    await accionRevocarApiKey(id);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {llaveRevelada && (
        <div className="rounded-md border border-line-strong bg-surface-sunken p-4">
          <p className="mb-2 text-[13.5px] font-medium text-text">
            Copia esta llave ahora — no se puede volver a ver completa.
          </p>
          <code className="block break-all rounded bg-surface px-3 py-2 text-[13px] text-text">{llaveRevelada}</code>
          <button
            type="button"
            onClick={() => setLlaveRevelada(null)}
            className="mt-3 h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
          >
            Ya la copié
          </button>
        </div>
      )}

      <div className="flex gap-2 rounded-lg border border-line bg-surface p-4 shadow">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del consumidor (p. ej. Bot de Jelou)"
          className="h-10 flex-1 rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted"
        />
        <button
          type="button"
          disabled={creando || !nombre.trim()}
          onClick={crear}
          className="h-10 shrink-0 rounded-md bg-navy px-4 text-sm font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {creando ? "Creando…" : "+ Nueva llave"}
        </button>
      </div>
      {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

      <ul className="overflow-hidden rounded-lg border border-line shadow">
        {llaves.length === 0 && <li className="px-4 py-6 text-center text-[13.5px] text-text-muted">Todavía no hay llaves creadas.</li>}
        {llaves.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0">
            <div>
              <p className="text-[14px] font-medium text-text">{k.nombre}</p>
              <p className="tabular text-[12.5px] text-text-muted">
                {k.prefijo}… · creada {formatoFechaHoraDMY(k.creado_en)}
                {k.ultimo_uso_en && ` · último uso ${formatoFechaHoraDMY(k.ultimo_uso_en)}`}
              </p>
            </div>
            {k.activa ? (
              <button
                type="button"
                onClick={() => revocar(k.id)}
                className="h-8 shrink-0 rounded-md border border-danger px-3 text-[12.5px] font-medium text-danger hover:bg-danger-bg"
              >
                Revocar
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-surface-sunken px-2.5 py-1 text-[12px] font-medium text-text-muted">Revocada</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

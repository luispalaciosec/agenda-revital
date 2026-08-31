"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora, hoyGuayaquil } from "@/lib/formato";
import { accionObtenerFranjas, accionReprogramarCita } from "../../../_acciones";

interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  titulo: string | null;
  activo: boolean;
}
interface Franja {
  inicio: string;
  fin: string;
  cuposDisponibles: number;
  medicoId: string | null;
  consultorioId: string | null;
}

const clasesCampo =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1.5 block text-[13.5px] font-medium text-text";

export function FormularioReprogramar({
  citaId,
  especialidadId,
  medicos,
  medicoActualId,
}: {
  citaId: string;
  especialidadId: string;
  medicos: Medico[];
  medicoActualId: string | null;
}) {
  const router = useRouter();
  const [medicoId, setMedicoId] = useState(medicoActualId ?? "");
  const [fecha, setFecha] = useState(hoyGuayaquil());
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<Franja | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  useEffect(() => {
    if (!fecha) return;
    let cancelado = false;
    setCargando(true);
    setFranjaSeleccionada(null);
    accionObtenerFranjas(especialidadId, medicoId || null, fecha)
      .then((r) => !cancelado && setFranjas(r))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [especialidadId, medicoId, fecha]);

  async function confirmar() {
    if (!franjaSeleccionada) return;
    setEnviando(true);
    setError(null);
    const resultado = await accionReprogramarCita({
      citaId,
      nuevoMedicoId: franjaSeleccionada.medicoId,
      nuevoConsultorioId: franjaSeleccionada.consultorioId,
      nuevoInicio: franjaSeleccionada.inicio,
      nuevoFin: franjaSeleccionada.fin,
    });
    setEnviando(false);
    if (resultado.ok) setHecho(true);
    else setError(resultado.mensaje);
  }

  if (hecho) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6 text-center shadow">
        <p className="text-[15px] font-medium text-text">Cita reprogramada</p>
        <button
          type="button"
          onClick={() => router.push("/panel/agenda")}
          className="mt-5 h-10 rounded-md bg-navy px-4 text-sm font-medium text-text-inverse hover:bg-navy-deep"
        >
          Volver a la agenda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-5 shadow">
      {medicos.length > 0 && (
        <div>
          <label className={clasesEtiqueta} htmlFor="medico">
            Médico (opcional)
          </label>
          <select id="medico" value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={clasesCampo}>
            <option value="">Cualquiera</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo} {m.nombres} {m.apellidos}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={clasesEtiqueta} htmlFor="fecha">
          Nueva fecha
        </label>
        <input
          id="fecha"
          type="date"
          min={hoyGuayaquil()}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={`tabular ${clasesCampo}`}
        />
      </div>

      <div>
        <span className={clasesEtiqueta}>Horario disponible</span>
        {cargando ? (
          <p className="text-sm text-text-muted">Buscando franjas…</p>
        ) : franjas.length === 0 ? (
          <p className="text-sm text-text-muted">No hay cupos disponibles ese día.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {franjas.map((f) => {
              const seleccionada = franjaSeleccionada?.inicio === f.inicio && franjaSeleccionada?.medicoId === f.medicoId;
              return (
                <button
                  key={`${f.medicoId}-${f.inicio}`}
                  type="button"
                  onClick={() => setFranjaSeleccionada(f)}
                  className={`tabular h-9 rounded-md border px-3 text-[13.5px] font-medium transition-colors ${
                    seleccionada
                      ? "border-navy bg-navy text-text-inverse"
                      : "border-line-strong bg-surface text-text hover:bg-surface-sunken"
                  }`}
                >
                  {formatoHora(f.inicio)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 rounded-md border border-line-strong px-4 text-sm font-medium text-text hover:bg-surface-sunken"
        >
          Atrás
        </button>
        <button
          type="button"
          disabled={!franjaSeleccionada || enviando}
          onClick={confirmar}
          className="h-10 rounded-md bg-green-deep px-5 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40"
        >
          {enviando ? "Reprogramando…" : "Confirmar nueva hora"}
        </button>
      </div>
    </div>
  );
}

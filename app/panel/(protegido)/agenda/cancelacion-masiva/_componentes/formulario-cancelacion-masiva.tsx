"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoFechaDMY, formatoHora, hoyGuayaquil } from "@/lib/formato";
import { accionCancelarDiaMedico, accionListarCitasDelDia } from "../../_acciones";

interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  titulo: string | null;
}
interface CitaAfectada {
  id: string;
  codigoPublico: string | null;
  inicio: string;
  paciente: { nombres: string; apellidos: string } | null;
  servicio: { descripcion: string } | null;
}

const clasesCampo =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1.5 block text-[13.5px] font-medium text-text";

export function FormularioCancelacionMasiva({ medicos }: { medicos: Medico[] }) {
  const router = useRouter();
  const [medicoId, setMedicoId] = useState("");
  const [fecha, setFecha] = useState(hoyGuayaquil());
  const [citas, setCitas] = useState<CitaAfectada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<number | null>(null);

  useEffect(() => {
    if (!medicoId || !fecha) {
      setCitas([]);
      return;
    }
    setCargando(true);
    setResultado(null);
    accionListarCitasDelDia(medicoId, fecha).then((r) => {
      setCitas(r);
      setCargando(false);
    });
  }, [medicoId, fecha]);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    const r = await accionCancelarDiaMedico(medicoId, fecha, motivo);
    setEnviando(false);
    if (r.ok) {
      setResultado(r.cantidad);
      setConfirmando(false);
      setCitas([]);
    } else {
      setError(r.mensaje);
    }
  }

  const medico = medicos.find((m) => m.id === medicoId);

  if (resultado !== null) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6 text-center shadow">
        <p className="text-[15px] font-medium text-text">
          {resultado === 0 ? "No había citas activas ese día." : `${resultado} cita(s) cancelada(s) y notificación en cola.`}
        </p>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clasesEtiqueta}>Médico</label>
          <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={clasesCampo}>
            <option value="">Selecciona…</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo} {m.nombres} {m.apellidos}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`tabular ${clasesCampo}`} />
        </div>
      </div>

      {medicoId && (
        <div>
          <span className={clasesEtiqueta}>Citas afectadas</span>
          {cargando ? (
            <p className="text-[13.5px] text-text-muted">Buscando…</p>
          ) : citas.length === 0 ? (
            <p className="text-[13.5px] text-text-muted">Sin citas activas ese día.</p>
          ) : (
            <ul className="overflow-hidden rounded-md border border-line">
              {citas.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-b border-line px-3 py-2 text-[13.5px] last:border-b-0">
                  <span className="tabular w-14 shrink-0 text-text-muted">{formatoHora(c.inicio)}</span>
                  <span className="flex-1 text-text">{c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : "—"}</span>
                  <span className="text-text-muted">{c.servicio?.descripcion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {citas.length > 0 && (
        <div>
          <label className={clasesEtiqueta}>Motivo (opcional, va en la nota de cada cita)</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={clasesCampo} placeholder="Médico con licencia médica…" />
        </div>
      )}

      {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

      {citas.length > 0 && !confirmando && (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="h-10 rounded-md border border-danger px-4 text-sm font-medium text-danger hover:bg-danger-bg"
        >
          Cancelar el día completo ({citas.length} {citas.length === 1 ? "cita" : "citas"})
        </button>
      )}

      {confirmando && (
        <div className="rounded-md bg-danger-bg p-3">
          <p className="mb-2 text-[13.5px] text-text">
            Vas a cancelar {citas.length} cita(s) de {medico?.titulo} {medico?.nombres} {medico?.apellidos} el{" "}
            {formatoFechaDMY(fecha)}. Esto no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={confirmar}
              className="h-9 rounded-md bg-danger px-3.5 text-[13px] font-medium text-text-inverse hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Cancelando…" : "Sí, cancelar todo"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
            >
              Deshacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

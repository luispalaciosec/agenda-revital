"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accionEditarPaciente } from "../_acciones";

const clasesCampo =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1.5 block text-[13.5px] font-medium text-text";

export function EditorPaciente({
  pacienteId,
  nombres: nombresIniciales,
  apellidos: apellidosIniciales,
  correo: correoInicial,
  historiaClinica: historiaClinicaInicial,
}: {
  pacienteId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  historiaClinica: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombres, setNombres] = useState(nombresIniciales);
  const [apellidos, setApellidos] = useState(apellidosIniciales);
  const [correo, setCorreo] = useState(correoInicial);
  const [historiaClinica, setHistoriaClinica] = useState(historiaClinicaInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editando) {
    return (
      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-text">Datos del paciente</h2>
          <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-medium text-navy hover:underline">
            Editar
          </button>
        </div>
        <dl className="space-y-1.5 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-text-muted">Correo</dt>
            <dd className="text-text">{correoInicial || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Historia clínica</dt>
            <dd className="text-text">{historiaClinicaInicial || "—"}</dd>
          </div>
        </dl>
      </section>
    );
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const resultado = await accionEditarPaciente(pacienteId, { nombres, apellidos, correo, historiaClinica });
    setGuardando(false);
    if (resultado.ok) {
      setEditando(false);
      router.refresh();
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="text-[14px] font-semibold text-text">Editar paciente</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clasesEtiqueta} htmlFor="nombres">
            Nombres
          </label>
          <input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} className={clasesCampo} />
        </div>
        <div>
          <label className={clasesEtiqueta} htmlFor="apellidos">
            Apellidos
          </label>
          <input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={clasesCampo} />
        </div>
      </div>
      <div>
        <label className={clasesEtiqueta} htmlFor="correo">
          Correo
        </label>
        <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={clasesCampo} />
      </div>
      <div>
        <label className={clasesEtiqueta} htmlFor="historia">
          Historia clínica (opcional, la llena admisión)
        </label>
        <input id="historia" value={historiaClinica} onChange={(e) => setHistoriaClinica(e.target.value)} className={clasesCampo} />
      </div>

      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando}
          onClick={guardar}
          className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}

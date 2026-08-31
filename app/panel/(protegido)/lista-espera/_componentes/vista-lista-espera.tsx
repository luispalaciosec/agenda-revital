"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoFechaDMY, hoyGuayaquil } from "@/lib/formato";
import {
  accionAgregarAListaEspera,
  accionBuscarPacienteListaEspera,
  accionMarcarEstadoListaEspera,
  accionMarcarNotificado,
} from "../_acciones";

interface Especialidad {
  id: string;
  nombre: string;
}
interface MedicoVinculo {
  especialidadId: string;
  medico: { id: string; nombres: string; apellidos: string; titulo: string | null; activo: boolean };
}
export interface EntradaListaEsperaVista {
  id: string;
  fechaDeseada: string;
  notificadoEn: string | null;
  expiraEn: string | null;
  estado: string;
  paciente: { nombres: string; apellidos: string } | null;
  especialidad: { nombre: string } | null;
  medico: { nombres: string; apellidos: string; titulo: string | null } | null;
}

const clasesCampo =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1 block text-[12.5px] font-medium text-text";

function minutosRestantes(expiraEn: string, ahora: number): number {
  return Math.max(0, Math.round((new Date(expiraEn).getTime() - ahora) / 60000));
}

export function VistaListaEspera({
  especialidades,
  medicosVinculos,
  entradas,
}: {
  especialidades: Especialidad[];
  medicosVinculos: MedicoVinculo[];
  entradas: EntradaListaEsperaVista[];
}) {
  const router = useRouter();
  const [agregando, setAgregando] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const esperando = entradas.filter((e) => e.estado === "esperando");
  const notificados = entradas.filter((e) => e.estado === "notificado");

  // Solo el primero de cada especialidad puede notificarse (§3.2: "al primero de la lista").
  const primeroPorEspecialidad = new Set<string>();
  for (const e of esperando) {
    if (!primeroPorEspecialidad.has(e.especialidad?.nombre ?? "")) primeroPorEspecialidad.add(e.especialidad?.nombre ?? "");
  }
  const primerosIds = new Set<string>();
  const vistos = new Set<string>();
  for (const e of esperando) {
    const clave = e.especialidad?.nombre ?? "";
    if (!vistos.has(clave)) {
      vistos.add(clave);
      primerosIds.add(e.id);
    }
  }

  async function accionar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    const resultado = await accion();
    if (resultado.ok) router.refresh();
    else alert(resultado.mensaje ?? "No se pudo completar la acción.");
  }

  return (
    <div className="space-y-6">
      {agregando ? (
        <FormularioAgregar
          especialidades={especialidades}
          medicosVinculos={medicosVinculos}
          onCancelar={() => setAgregando(false)}
          onGuardado={() => {
            setAgregando(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep"
        >
          + Agregar a la lista
        </button>
      )}

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
          Esperando <span className="ml-1 font-normal text-text-muted">{esperando.length}</span>
        </h2>
        {esperando.length === 0 ? (
          <p className="px-4 py-6 text-[13.5px] text-text-muted">Nadie en espera.</p>
        ) : (
          <ul>
            {esperando.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
                <div className="min-w-[160px] flex-1">
                  <p className="text-[14px] text-text">{e.paciente ? `${e.paciente.nombres} ${e.paciente.apellidos}` : "—"}</p>
                  <p className="text-[12.5px] text-text-muted">
                    {e.especialidad?.nombre} · desde {formatoFechaDMY(e.fechaDeseada)}
                    {e.medico && ` · ${e.medico.titulo ?? ""} ${e.medico.nombres} ${e.medico.apellidos}`.trim()}
                  </p>
                </div>
                {primerosIds.has(e.id) ? (
                  <button
                    type="button"
                    onClick={() => accionar(() => accionMarcarNotificado(e.id))}
                    className="h-8 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90"
                  >
                    Notificar
                  </button>
                ) : (
                  <span className="text-[12px] text-text-muted">En cola</span>
                )}
                <button
                  type="button"
                  onClick={() => accionar(() => accionMarcarEstadoListaEspera(e.id, "cancelado"))}
                  className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
          Notificados, esperando respuesta <span className="ml-1 font-normal text-text-muted">{notificados.length}</span>
        </h2>
        {notificados.length === 0 ? (
          <p className="px-4 py-6 text-[13.5px] text-text-muted">Nadie notificado ahora.</p>
        ) : (
          <ul>
            {notificados.map((e) => {
              const minutos = e.expiraEn ? minutosRestantes(e.expiraEn, ahora) : 0;
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
                  <div className="min-w-[160px] flex-1">
                    <p className="text-[14px] text-text">{e.paciente ? `${e.paciente.nombres} ${e.paciente.apellidos}` : "—"}</p>
                    <p className="text-[12.5px] text-text-muted">{e.especialidad?.nombre}</p>
                  </div>
                  <span className={`tabular text-[12.5px] font-medium ${minutos === 0 ? "text-danger" : "text-warning"}`}>
                    {minutos === 0 ? "Ventana vencida" : `${minutos} min restantes`}
                  </span>
                  <button
                    type="button"
                    onClick={() => accionar(() => accionMarcarEstadoListaEspera(e.id, "tomado"))}
                    className="h-8 rounded-md bg-green-deep px-3 text-[12.5px] font-medium text-text-inverse hover:opacity-90"
                  >
                    Tomó el cupo
                  </button>
                  <button
                    type="button"
                    onClick={() => accionar(() => accionMarcarEstadoListaEspera(e.id, "expirado"))}
                    className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                  >
                    No respondió
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function FormularioAgregar({
  especialidades,
  medicosVinculos,
  onCancelar,
  onGuardado,
}: {
  especialidades: Especialidad[];
  medicosVinculos: MedicoVinculo[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [especialidadId, setEspecialidadId] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [fechaDeseada, setFechaDeseada] = useState(hoyGuayaquil());
  const [documento, setDocumento] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [busquedaHecha, setBusquedaHecha] = useState(false);
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof accionBuscarPacienteListaEspera>>>(null);
  const [celular, setCelular] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medicosDeEspecialidad = useMemo(
    () => medicosVinculos.filter((m) => m.especialidadId === especialidadId).map((m) => m.medico),
    [medicosVinculos, especialidadId]
  );

  async function buscar() {
    setBuscando(true);
    const r = await accionBuscarPacienteListaEspera(documento);
    setResultado(r);
    setBusquedaHecha(true);
    setBuscando(false);
    if (r?.contactos[0]) setCelular(r.contactos[0].celular);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const resultadoAccion = await accionAgregarAListaEspera({
      especialidadId,
      medicoId: medicoId || null,
      celular,
      fechaDeseada,
      pacienteId: resultado?.paciente.id,
      pacienteNuevo: resultado ? undefined : { tipoDocumento: "cedula", documento, nombres, apellidos, fechaNacimiento },
    });
    setGuardando(false);
    if (resultadoAccion.ok) onGuardado();
    else setError(resultadoAccion.mensaje);
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clasesEtiqueta}>Especialidad</label>
          <select
            value={especialidadId}
            onChange={(e) => {
              setEspecialidadId(e.target.value);
              setMedicoId("");
            }}
            className={clasesCampo}
          >
            <option value="">Selecciona…</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Médico (opcional)</label>
          <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={clasesCampo}>
            <option value="">Cualquiera</option>
            {medicosDeEspecialidad.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo} {m.nombres} {m.apellidos}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Fecha deseada</label>
          <input
            type="date"
            min={hoyGuayaquil()}
            value={fechaDeseada}
            onChange={(e) => setFechaDeseada(e.target.value)}
            className={`tabular ${clasesCampo}`}
          />
        </div>
      </div>

      <div>
        <label className={clasesEtiqueta}>Cédula del paciente</label>
        <div className="flex gap-2">
          <input value={documento} onChange={(e) => setDocumento(e.target.value)} className={`tabular ${clasesCampo}`} />
          <button
            type="button"
            onClick={buscar}
            disabled={buscando || documento.trim().length < 5}
            className="h-9 shrink-0 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text hover:bg-surface-sunken disabled:opacity-40"
          >
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      {busquedaHecha && resultado && (
        <p className="rounded-md bg-success-bg px-3 py-2 text-[13px] text-text">
          {resultado.paciente.nombres} {resultado.paciente.apellidos} — paciente ya registrado.
        </p>
      )}
      {busquedaHecha && !resultado && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={clasesEtiqueta}>Nombres</label>
            <input value={nombres} onChange={(e) => setNombres(e.target.value)} className={clasesCampo} />
          </div>
          <div>
            <label className={clasesEtiqueta}>Apellidos</label>
            <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={clasesCampo} />
          </div>
          <div>
            <label className={clasesEtiqueta}>Fecha de nacimiento</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className={`tabular ${clasesCampo}`} />
          </div>
        </div>
      )}
      {busquedaHecha && (
        <div>
          <label className={clasesEtiqueta}>Celular</label>
          <input value={celular} onChange={(e) => setCelular(e.target.value)} className={`tabular ${clasesCampo}`} />
        </div>
      )}

      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando || !especialidadId || !celular || (!resultado && (!nombres || !apellidos || !fechaNacimiento))}
          onClick={guardar}
          className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Agregar"}
        </button>
        <button type="button" onClick={onCancelar} className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken">
          Cancelar
        </button>
      </div>
    </div>
  );
}

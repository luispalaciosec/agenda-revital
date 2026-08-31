"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatoHora, hoyGuayaquil } from "@/lib/formato";
import { accionBuscarPaciente, accionCrearCita, accionObtenerFranjas } from "../acciones";

interface Especialidad {
  id: string;
  nombre: string;
  modo: string;
  duracion_min: number;
}
interface Servicio {
  id: string;
  especialidad_id: string | null;
  descripcion: string;
}
interface MedicoDeEspecialidad {
  especialidadId: string;
  medico: { id: string; nombres: string; apellidos: string; titulo: string | null; activo: boolean };
}
interface Franja {
  inicio: string;
  fin: string;
  cuposDisponibles: number;
  medicoId: string | null;
  consultorioId: string | null;
}
interface ContactoVinculado {
  id: string;
  celular: string;
}
interface ResultadoBusqueda {
  paciente: {
    id: string;
    tipo_documento: "cedula" | "pasaporte";
    documento: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    correo: string | null;
  };
  contactos: ContactoVinculado[];
}

interface FormularioNuevaCitaProps {
  especialidades: Especialidad[];
  servicios: Servicio[];
  medicosPorEspecialidad: MedicoDeEspecialidad[];
}

function esMenorDeEdad(fechaNacimiento: string): boolean {
  if (!fechaNacimiento) return false;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return false;
  const edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const cumplioEsteAnio =
    hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
  return (cumplioEsteAnio ? edad : edad - 1) < 18;
}

const clasesCampo =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1.5 block text-[13.5px] font-medium text-text";

export function FormularioNuevaCita({ especialidades, servicios, medicosPorEspecialidad }: FormularioNuevaCitaProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1 — elegir
  const [especialidadId, setEspecialidadId] = useState("");
  const [medicoId, setMedicoId] = useState<string>("");
  const [servicioIdElegido, setServicioIdElegido] = useState("");
  const [fecha, setFecha] = useState(hoyGuayaquil());
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<Franja | null>(null);

  const serviciosDeEspecialidad = useMemo(
    () => servicios.filter((s) => s.especialidad_id === especialidadId),
    [servicios, especialidadId]
  );
  const medicosDeEspecialidad = useMemo(
    () => medicosPorEspecialidad.filter((m) => m.especialidadId === especialidadId).map((m) => m.medico),
    [medicosPorEspecialidad, especialidadId]
  );
  // Con un solo servicio agendable por especialidad (caso típico hoy) se
  // autoselecciona; si hay varios, manda lo que haya elegido la persona.
  const servicioId = serviciosDeEspecialidad.length === 1 ? serviciosDeEspecialidad[0].id : servicioIdElegido;

  function cambiarEspecialidad(nuevaEspecialidadId: string) {
    setEspecialidadId(nuevaEspecialidadId);
    setMedicoId("");
    setServicioIdElegido("");
    setFranjaSeleccionada(null);
  }

  useEffect(() => {
    if (!especialidadId || !fecha) return;
    let cancelado = false;
    setCargandoFranjas(true);
    setFranjaSeleccionada(null);
    accionObtenerFranjas(especialidadId, medicoId || null, fecha)
      .then((r) => !cancelado && setFranjas(r))
      .finally(() => !cancelado && setCargandoFranjas(false));
    return () => {
      cancelado = true;
    };
  }, [especialidadId, medicoId, fecha]);

  const franjasVisibles = especialidadId && fecha ? franjas : [];

  // Paso 2 — paciente
  const [documentoBusqueda, setDocumentoBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [busquedaHecha, setBusquedaHecha] = useState(false);
  const [resultadoBusqueda, setResultadoBusqueda] = useState<ResultadoBusqueda | null>(null);
  const [celular, setCelular] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [correo, setCorreo] = useState("");
  const [representanteDocumento, setRepresentanteDocumento] = useState("");
  const [representanteNombres, setRepresentanteNombres] = useState("");
  const [representanteParentesco, setRepresentanteParentesco] = useState("");
  const [consentimientoMarketing, setConsentimientoMarketing] = useState(false);

  const menor = esMenorDeEdad(fechaNacimiento);

  async function buscarPaciente() {
    setBuscando(true);
    const resultado = await accionBuscarPaciente(documentoBusqueda);
    setResultadoBusqueda(resultado);
    setBusquedaHecha(true);
    setBuscando(false);
    if (resultado?.contactos[0]) setCelular(resultado.contactos[0].celular);
  }

  // Paso 3 — confirmar
  const [notaAdmision, setNotaAdmision] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [creada, setCreada] = useState<{ codigo_publico: string | null } | null>(null);

  async function confirmarCita() {
    if (!franjaSeleccionada) return;
    setEnviando(true);
    setErrorEnvio(null);

    const resultado = await accionCrearCita({
      especialidadId,
      medicoId: franjaSeleccionada.medicoId,
      consultorioId: franjaSeleccionada.consultorioId,
      servicioId,
      inicio: franjaSeleccionada.inicio,
      fin: franjaSeleccionada.fin,
      celular,
      pacienteId: resultadoBusqueda?.paciente.id,
      pacienteNuevo: resultadoBusqueda
        ? undefined
        : {
            tipoDocumento: "cedula",
            documento: documentoBusqueda,
            nombres,
            apellidos,
            fechaNacimiento,
            correo,
            representanteDocumento: menor ? representanteDocumento : undefined,
            representanteNombres: menor ? representanteNombres : undefined,
            representanteParentesco: menor ? representanteParentesco : undefined,
          },
      consentimientoMarketing,
      notaAdmision,
    });

    setEnviando(false);
    if (resultado.ok) {
      setCreada(resultado.cita);
    } else {
      setErrorEnvio(resultado.mensaje);
    }
  }

  if (creada) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6 text-center shadow">
        <p className="text-[15px] font-medium text-text">Cita confirmada</p>
        {creada.codigo_publico && (
          <p className="tabular mt-1 text-2xl font-semibold text-navy">{creada.codigo_publico}</p>
        )}
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
    <div>
      <ol className="mb-6 flex gap-2 text-[13px] font-medium text-text-muted">
        {(["Elegir", "Paciente", "Confirmar"] as const).map((etiqueta, i) => (
          <li
            key={etiqueta}
            className={`rounded-full px-3 py-1 ${paso === i + 1 ? "bg-navy text-text-inverse" : "bg-surface-sunken"}`}
          >
            {i + 1}. {etiqueta}
          </li>
        ))}
      </ol>

      {paso === 1 && (
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5 shadow">
          <div>
            <label className={clasesEtiqueta} htmlFor="especialidad">
              Especialidad
            </label>
            <select
              id="especialidad"
              value={especialidadId}
              onChange={(e) => cambiarEspecialidad(e.target.value)}
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

          {especialidadId && (
            <div>
              <label className={clasesEtiqueta} htmlFor="medico">
                Médico (opcional)
              </label>
              <select id="medico" value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={clasesCampo}>
                <option value="">Cualquiera</option>
                {medicosDeEspecialidad.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titulo} {m.nombres} {m.apellidos}
                  </option>
                ))}
              </select>
            </div>
          )}

          {serviciosDeEspecialidad.length > 1 && (
            <div>
              <label className={clasesEtiqueta} htmlFor="servicio">
                Servicio
              </label>
              <select id="servicio" value={servicioId} onChange={(e) => setServicioIdElegido(e.target.value)} className={clasesCampo}>
                <option value="">Selecciona…</option>
                {serviciosDeEspecialidad.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.descripcion}
                  </option>
                ))}
              </select>
            </div>
          )}

          {especialidadId && (
            <div>
              <label className={clasesEtiqueta} htmlFor="fecha">
                Fecha
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
          )}

          {especialidadId && fecha && (
            <div>
              <span className={clasesEtiqueta}>Horario disponible</span>
              {cargandoFranjas ? (
                <p className="text-sm text-text-muted">Buscando franjas…</p>
              ) : franjasVisibles.length === 0 ? (
                <p className="text-sm text-text-muted">No hay cupos disponibles ese día.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {franjasVisibles.map((f) => {
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
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!franjaSeleccionada || !servicioId}
              onClick={() => setPaso(2)}
              className="h-10 rounded-md bg-navy px-5 text-sm font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5 shadow">
          <div>
            <label className={clasesEtiqueta} htmlFor="documento">
              Cédula del paciente
            </label>
            <div className="flex gap-2">
              <input
                id="documento"
                value={documentoBusqueda}
                onChange={(e) => {
                  setDocumentoBusqueda(e.target.value);
                  setBusquedaHecha(false);
                }}
                className={`tabular ${clasesCampo}`}
                placeholder="10 dígitos"
              />
              <button
                type="button"
                onClick={buscarPaciente}
                disabled={buscando || documentoBusqueda.trim().length < 5}
                className="h-10 shrink-0 rounded-md border border-line-strong px-4 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-40"
              >
                {buscando ? "Buscando…" : "Buscar"}
              </button>
            </div>
          </div>

          {busquedaHecha && resultadoBusqueda && (
            <div className="rounded-md bg-success-bg px-3 py-2.5 text-[13.5px] text-text">
              <p className="font-medium">
                {resultadoBusqueda.paciente.nombres} {resultadoBusqueda.paciente.apellidos}
              </p>
              <p className="text-text-muted">Paciente ya registrado — se precargan sus datos.</p>
            </div>
          )}

          {busquedaHecha && !resultadoBusqueda && (
            <>
              <p className="rounded-md bg-info-bg px-3 py-2.5 text-[13.5px] text-text">
                No hay un paciente con esa cédula. Complétalo para crearlo.
              </p>
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
                <label className={clasesEtiqueta} htmlFor="nacimiento">
                  Fecha de nacimiento
                </label>
                <input
                  id="nacimiento"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className={`tabular ${clasesCampo}`}
                />
              </div>
              <div>
                <label className={clasesEtiqueta} htmlFor="correo">
                  Correo (opcional)
                </label>
                <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={clasesCampo} />
              </div>

              {menor && (
                <div className="space-y-3 rounded-md border border-line bg-surface-sunken p-3">
                  <p className="text-[13px] font-medium text-text">Datos del representante (paciente menor de edad)</p>
                  <div>
                    <label className={clasesEtiqueta} htmlFor="repDoc">
                      Cédula del representante
                    </label>
                    <input
                      id="repDoc"
                      value={representanteDocumento}
                      onChange={(e) => setRepresentanteDocumento(e.target.value)}
                      className={`tabular ${clasesCampo}`}
                    />
                  </div>
                  <div>
                    <label className={clasesEtiqueta} htmlFor="repNombres">
                      Nombre completo del representante
                    </label>
                    <input
                      id="repNombres"
                      value={representanteNombres}
                      onChange={(e) => setRepresentanteNombres(e.target.value)}
                      className={clasesCampo}
                    />
                  </div>
                  <div>
                    <label className={clasesEtiqueta} htmlFor="repParentesco">
                      Parentesco
                    </label>
                    <input
                      id="repParentesco"
                      value={representanteParentesco}
                      onChange={(e) => setRepresentanteParentesco(e.target.value)}
                      className={clasesCampo}
                      placeholder="Madre, padre, tutor…"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-start gap-2 text-[13.5px] text-text">
                <input
                  type="checkbox"
                  checked={consentimientoMarketing}
                  onChange={(e) => setConsentimientoMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                El paciente acepta recibir promociones e información de salud de Revital (opcional).
              </label>
            </>
          )}

          {busquedaHecha && (
            <div>
              <label className={clasesEtiqueta} htmlFor="celular">
                Celular de contacto
              </label>
              {resultadoBusqueda && resultadoBusqueda.contactos.length > 0 ? (
                <select id="celular" value={celular} onChange={(e) => setCelular(e.target.value)} className={clasesCampo}>
                  {resultadoBusqueda.contactos.map((c) => (
                    <option key={c.id} value={c.celular}>
                      {c.celular}
                    </option>
                  ))}
                  <option value="">Otro número…</option>
                </select>
              ) : null}
              {(!resultadoBusqueda || resultadoBusqueda.contactos.length === 0 || celular === "") && (
                <input
                  id="celular-nuevo"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  className={`tabular mt-2 ${clasesCampo}`}
                  placeholder="09XXXXXXXX"
                />
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setPaso(1)} className="h-10 rounded-md border border-line-strong px-4 text-sm font-medium text-text hover:bg-surface-sunken">
              Atrás
            </button>
            <button
              type="button"
              disabled={
                !busquedaHecha ||
                !celular ||
                (!resultadoBusqueda && (!nombres || !apellidos || !fechaNacimiento || (menor && !representanteDocumento)))
              }
              onClick={() => setPaso(3)}
              className="h-10 rounded-md bg-navy px-5 text-sm font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 3 && franjaSeleccionada && (
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5 shadow">
          <dl className="space-y-1.5 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-text-muted">Especialidad</dt>
              <dd className="font-medium text-text">{especialidades.find((e) => e.id === especialidadId)?.nombre}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Fecha y hora</dt>
              <dd className="tabular font-medium text-text">
                {fecha} · {formatoHora(franjaSeleccionada.inicio)}–{formatoHora(franjaSeleccionada.fin)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Paciente</dt>
              <dd className="font-medium text-text">
                {resultadoBusqueda ? `${resultadoBusqueda.paciente.nombres} ${resultadoBusqueda.paciente.apellidos}` : `${nombres} ${apellidos}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Celular</dt>
              <dd className="tabular font-medium text-text">{celular}</dd>
            </div>
          </dl>

          <div>
            <label className={clasesEtiqueta} htmlFor="nota">
              Nota de admisión (opcional, nunca clínica)
            </label>
            <textarea
              id="nota"
              value={notaAdmision}
              onChange={(e) => setNotaAdmision(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[14.5px] text-text"
            />
          </div>

          {errorEnvio && (
            <p role="alert" aria-live="polite" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {errorEnvio}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setPaso(2)} className="h-10 rounded-md border border-line-strong px-4 text-sm font-medium text-text hover:bg-surface-sunken">
              Atrás
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={confirmarCita}
              className="h-10 rounded-md bg-green-deep px-5 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40"
            >
              {enviando ? "Confirmando…" : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

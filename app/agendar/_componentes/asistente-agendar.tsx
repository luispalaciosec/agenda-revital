"use client";

import { useEffect, useState } from "react";
import { formatoFechaDMY, formatoHora, hoyGuayaquil } from "@/lib/formato";
import {
  accionBuscarPacienteWeb,
  accionConfirmarCitaWeb,
  accionListarMedicosWeb,
  accionListarServiciosWeb,
  accionObtenerFranjasWeb,
  accionSolicitarOtpWeb,
  accionVerificarCodigoOtp,
} from "../_acciones";

interface Especialidad {
  id: string;
  nombre: string;
  slug: string;
  duracion_min: number;
  modo: string;
  requiere_aprobacion: boolean;
}
interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  titulo: string | null;
}
interface Servicio {
  id: string;
  descripcion: string;
  duracion_min: number | null;
  requiere_aprobacion: boolean;
  preparacion_previa: string | null;
  precio: number | null;
}
interface Franja {
  inicio: string;
  fin: string;
  cuposDisponibles: number;
  medicoId: string | null;
  consultorioId: string | null;
}
interface Atribucion {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
}

const clasesCampo =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1.5 block text-[13.5px] font-medium text-text";

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

export function AsistenteAgendar({ especialidades, atribucion }: { especialidades: Especialidad[]; atribucion: Atribucion }) {
  const [textoGrande, setTextoGrande] = useState(false);
  useEffect(() => {
    try {
      setTextoGrande(localStorage.getItem("rv_texto_grande") === "1");
    } catch {
      // localStorage puede no estar disponible; se queda en tamaño normal.
    }
  }, []);
  function alternarTextoGrande() {
    setTextoGrande((actual) => {
      const nuevo = !actual;
      try {
        localStorage.setItem("rv_texto_grande", nuevo ? "1" : "0");
      } catch {
        // ignorar
      }
      return nuevo;
    });
  }

  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1 — elegir
  const [especialidadId, setEspecialidadId] = useState("");
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [medicoId, setMedicoId] = useState("");
  const [servicioIdElegido, setServicioIdElegido] = useState("");
  const [fecha, setFecha] = useState(hoyGuayaquil());
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<Franja | null>(null);

  const servicioId = servicios.length === 1 ? servicios[0].id : servicioIdElegido;
  const servicioElegido = servicios.find((s) => s.id === servicioId) ?? null;

  useEffect(() => {
    if (!especialidadId) {
      setMedicos([]);
      setServicios([]);
      return;
    }
    accionListarMedicosWeb(especialidadId).then(setMedicos);
    accionListarServiciosWeb(especialidadId).then(setServicios);
  }, [especialidadId]);

  useEffect(() => {
    if (!especialidadId || !fecha) return;
    let cancelado = false;
    setCargandoFranjas(true);
    setFranjaSeleccionada(null);
    accionObtenerFranjasWeb(especialidadId, medicoId || null, fecha)
      .then((r) => !cancelado && setFranjas(r))
      .finally(() => !cancelado && setCargandoFranjas(false));
    return () => {
      cancelado = true;
    };
  }, [especialidadId, medicoId, fecha]);

  function cambiarEspecialidad(id: string) {
    setEspecialidadId(id);
    setMedicoId("");
    setServicioIdElegido("");
    setFranjaSeleccionada(null);
  }

  // Paso 2 — identificar
  const [documentoBusqueda, setDocumentoBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [busquedaHecha, setBusquedaHecha] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState<{ id: string; nombres: string; apellidos: string } | null>(null);
  const [celular, setCelular] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [correo, setCorreo] = useState("");
  const [representanteDocumento, setRepresentanteDocumento] = useState("");
  const [representanteNombres, setRepresentanteNombres] = useState("");
  const [representanteParentesco, setRepresentanteParentesco] = useState("");
  const [consentimientoDatos, setConsentimientoDatos] = useState(false);
  const [consentimientoMarketing, setConsentimientoMarketing] = useState(false);

  const menor = esMenorDeEdad(fechaNacimiento);

  async function buscarPaciente() {
    setBuscando(true);
    const resultado = await accionBuscarPacienteWeb(documentoBusqueda);
    setPacienteEncontrado(resultado);
    setBusquedaHecha(true);
    setBuscando(false);
  }

  // Paso 3 — verificar
  const [otpId, setOtpId] = useState<string | null>(null);
  const [codigoDev, setCodigoDev] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [otpVerificado, setOtpVerificado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null);
  const [citaCreada, setCitaCreada] = useState<{ codigo_publico: string | null; estado: string } | null>(null);

  async function irAVerificar() {
    setEnviandoOtp(true);
    setErrorOtp(null);
    const r = await accionSolicitarOtpWeb(celular);
    setEnviandoOtp(false);
    if (r.ok) {
      setOtpId(r.otpId);
      setCodigoDev(r.codigoDev);
      setOtpVerificado(false);
      setCodigo("");
      setPaso(3);
    } else {
      setErrorOtp(r.mensaje);
    }
  }

  async function verificarCodigo() {
    if (!otpId) return;
    setVerificando(true);
    setErrorOtp(null);
    const r = await accionVerificarCodigoOtp(otpId, celular, codigo);
    setVerificando(false);
    if (r.ok) setOtpVerificado(true);
    else setErrorOtp(r.mensaje);
  }

  async function confirmarCita() {
    if (!franjaSeleccionada || !otpId || !servicioId) return;
    setConfirmando(true);
    setErrorConfirmar(null);
    const r = await accionConfirmarCitaWeb({
      otpId,
      celular,
      especialidadId,
      medicoId: franjaSeleccionada.medicoId,
      consultorioId: franjaSeleccionada.consultorioId,
      servicioId,
      inicio: franjaSeleccionada.inicio,
      fin: franjaSeleccionada.fin,
      pacienteId: pacienteEncontrado?.id,
      pacienteNuevo: pacienteEncontrado
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
      atribucion,
    });
    setConfirmando(false);
    if (r.ok) setCitaCreada(r.cita);
    else setErrorConfirmar(r.mensaje);
  }

  const clasesTexto = textoGrande ? "text-[17px]" : "";

  return (
    <div className={clasesTexto}>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={alternarTextoGrande}
          className="rounded-md border border-line-strong px-3 py-1.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
          aria-pressed={textoGrande}
        >
          {textoGrande ? "Texto normal" : "Texto más grande"}
        </button>
      </div>

      {citaCreada ? (
        <ResultadoFinal cita={citaCreada} />
      ) : (
        <>
          <ol className="mb-6 flex gap-2 text-[13px] font-medium text-text-muted">
            {(["Elegir", "Identificar", "Verificar"] as const).map((etiqueta, i) => (
              <li key={etiqueta} className={`rounded-full px-3 py-1 ${paso === i + 1 ? "bg-navy text-text-inverse" : "bg-surface-sunken"}`}>
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
                <select id="especialidad" value={especialidadId} onChange={(e) => cambiarEspecialidad(e.target.value)} className={clasesCampo}>
                  <option value="">Selecciona…</option>
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {especialidadId && medicos.length > 0 && (
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

              {especialidadId && servicios.length > 1 && (
                <div>
                  <label className={clasesEtiqueta} htmlFor="servicio">
                    Servicio
                  </label>
                  <select id="servicio" value={servicioId} onChange={(e) => setServicioIdElegido(e.target.value)} className={clasesCampo}>
                    <option value="">Selecciona…</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.descripcion} — ${s.precio?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {servicioElegido?.precio != null && (
                <p className="text-[13.5px] text-text-muted">
                  Precio: <span className="tabular font-medium text-text">${servicioElegido.precio.toFixed(2)}</span>
                </p>
              )}
              {servicioElegido?.preparacion_previa && (
                <p className="rounded-md bg-info-bg px-3 py-2 text-[13px] text-text">{servicioElegido.preparacion_previa}</p>
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
                    <p className="text-sm text-text-muted">Buscando horarios…</p>
                  ) : franjas.length === 0 ? (
                    <p className="text-sm text-text-muted">No hay cupos disponibles ese día. Prueba otra fecha.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {franjas.map((f) => {
                        const seleccionada = franjaSeleccionada?.inicio === f.inicio && franjaSeleccionada?.medicoId === f.medicoId;
                        return (
                          <button
                            key={`${f.medicoId}-${f.inicio}`}
                            type="button"
                            onClick={() => setFranjaSeleccionada(f)}
                            className={`tabular h-10 rounded-md border px-3.5 text-[14px] font-medium transition-colors ${
                              seleccionada ? "border-navy bg-navy text-text-inverse" : "border-line-strong bg-surface text-text hover:bg-surface-sunken"
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
                  className="h-11 rounded-md bg-navy px-5 text-[15px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
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
                  Tu cédula
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
                    className="h-11 shrink-0 rounded-md border border-line-strong px-4 text-[14px] font-medium text-text hover:bg-surface-sunken disabled:opacity-40"
                  >
                    {buscando ? "Buscando…" : "Continuar"}
                  </button>
                </div>
              </div>

              {busquedaHecha && pacienteEncontrado && (
                <div className="rounded-md bg-success-bg px-3 py-2.5 text-[13.5px] text-text">
                  <p className="font-medium">
                    {pacienteEncontrado.nombres} {pacienteEncontrado.apellidos}
                  </p>
                  <p className="text-text-muted">Ya te encontramos en el sistema.</p>
                </div>
              )}

              {busquedaHecha && !pacienteEncontrado && (
                <>
                  <p className="rounded-md bg-info-bg px-3 py-2.5 text-[13.5px] text-text">No te encontramos. Completa tus datos.</p>
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
                        <input id="repNombres" value={representanteNombres} onChange={(e) => setRepresentanteNombres(e.target.value)} className={clasesCampo} />
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
                      checked={consentimientoDatos}
                      onChange={(e) => setConsentimientoDatos(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    Acepto que Revital use mis datos para gestionar esta cita, según su Política de Tratamiento de Datos.
                  </label>
                  <label className="flex items-start gap-2 text-[13.5px] text-text">
                    <input
                      type="checkbox"
                      checked={consentimientoMarketing}
                      onChange={(e) => setConsentimientoMarketing(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    Quiero recibir promociones e información de salud de Revital (opcional).
                  </label>
                </>
              )}

              {busquedaHecha && (
                <div>
                  <label className={clasesEtiqueta} htmlFor="celular">
                    Tu WhatsApp (te enviaremos un código para confirmar)
                  </label>
                  <input id="celular" value={celular} onChange={(e) => setCelular(e.target.value)} className={`tabular ${clasesCampo}`} placeholder="09XXXXXXXX" />
                </div>
              )}

              {errorOtp && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{errorOtp}</p>}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setPaso(1)} className="h-11 rounded-md border border-line-strong px-4 text-[14px] font-medium text-text hover:bg-surface-sunken">
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={
                    enviandoOtp ||
                    !busquedaHecha ||
                    celular.trim().length < 7 ||
                    (!pacienteEncontrado && (!nombres || !apellidos || !fechaNacimiento || !consentimientoDatos || (menor && !representanteDocumento)))
                  }
                  onClick={irAVerificar}
                  className="h-11 rounded-md bg-navy px-5 text-[15px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
                >
                  {enviandoOtp ? "Enviando código…" : "Enviar código"}
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
                    {formatoFechaDMY(fecha)} · {formatoHora(franjaSeleccionada.inicio)}
                  </dd>
                </div>
                {servicioElegido?.precio != null && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Precio</dt>
                    <dd className="tabular font-medium text-text">${servicioElegido.precio.toFixed(2)}</dd>
                  </div>
                )}
              </dl>

              {!otpVerificado ? (
                <div>
                  <label className={clasesEtiqueta} htmlFor="codigo">
                    Código de 6 dígitos enviado por WhatsApp al {celular}
                  </label>
                  <input
                    id="codigo"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    className={`tabular ${clasesCampo}`}
                    placeholder="000000"
                  />
                  {codigoDev && (
                    <p className="mt-1.5 rounded-md bg-warning-bg px-3 py-2 text-[12.5px] text-text">
                      Modo desarrollo (sin proveedor de WhatsApp aún): tu código es <span className="tabular font-semibold">{codigoDev}</span>.
                    </p>
                  )}
                  {errorOtp && <p className="mt-1.5 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{errorOtp}</p>}
                  <div className="mt-3 flex justify-between">
                    <button type="button" onClick={() => setPaso(2)} className="h-11 rounded-md border border-line-strong px-4 text-[14px] font-medium text-text hover:bg-surface-sunken">
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={verificando || codigo.length !== 6}
                      onClick={verificarCodigo}
                      className="h-11 rounded-md bg-navy px-5 text-[15px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
                    >
                      {verificando ? "Verificando…" : "Verificar código"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="rounded-md bg-success-bg px-3 py-2.5 text-[13.5px] text-text">Número verificado.</p>
                  {errorConfirmar && <p className="mt-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{errorConfirmar}</p>}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={confirmando}
                      onClick={confirmarCita}
                      className="h-11 rounded-md bg-green-deep px-5 text-[15px] font-medium text-text-inverse hover:opacity-90 disabled:opacity-40"
                    >
                      {confirmando ? "Confirmando…" : "Confirmar cita"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultadoFinal({ cita }: { cita: { codigo_publico: string | null; estado: string } }) {
  const confirmada = cita.estado === "confirmada";
  return (
    <div className="rounded-lg border border-line bg-surface p-6 text-center shadow">
      <p className="text-[16px] font-medium text-text">{confirmada ? "Tu cita quedó confirmada" : "Estamos confirmando tu cita"}</p>
      {cita.codigo_publico && <p className="tabular mt-1 text-2xl font-semibold text-navy">{cita.codigo_publico}</p>}
      {!confirmada && <p className="mt-2 text-[13.5px] text-text-muted">Te avisamos por WhatsApp en cuanto quede lista.</p>}
    </div>
  );
}

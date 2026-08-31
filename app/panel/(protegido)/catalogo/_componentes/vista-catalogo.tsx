"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  accionActualizarConsultorio,
  accionActualizarEspecialidad,
  accionActualizarFlagServicio,
  accionActualizarHorario,
  accionActualizarMedico,
  accionBuscarServicios,
  accionCrearConsultorio,
  accionCrearEspecialidad,
  accionCrearHorario,
  accionCrearMedico,
  accionEliminarHorario,
  accionListarHorarios,
} from "../_acciones";
import type { ServicioResultado } from "@/lib/catalogo/servicios";
import type { HorarioFila, DatosHorario } from "@/lib/catalogo/horarios";

type Modo = "exacto" | "bloque" | "solicitud";

interface Especialidad {
  id: string;
  nombre: string;
  slug: string;
  modo: Modo;
  duracion_min: number;
  cupos_por_bloque: number;
  activa: boolean;
}
interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  titulo: string | null;
  celular: string | null;
  correo: string | null;
  activo: boolean;
}
interface Vinculo {
  medico_id: string;
  especialidad_id: string;
}
interface Consultorio {
  id: string;
  nombre: string;
  numero: number;
  activo: boolean;
}

const clasesCampo =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1 block text-[12.5px] font-medium text-text";

const PESTANAS = ["especialidades", "medicos", "consultorios", "servicios", "horarios"] as const;
type Pestana = (typeof PESTANAS)[number];
const ETIQUETAS_PESTANA: Record<Pestana, string> = {
  especialidades: "Especialidades",
  medicos: "Médicos",
  consultorios: "Consultorios",
  servicios: "Servicios",
  horarios: "Horarios",
};

const DIAS_SEMANA = [
  { valor: 1, etiqueta: "Lunes" },
  { valor: 2, etiqueta: "Martes" },
  { valor: 3, etiqueta: "Miércoles" },
  { valor: 4, etiqueta: "Jueves" },
  { valor: 5, etiqueta: "Viernes" },
  { valor: 6, etiqueta: "Sábado" },
] as const;

export function VistaCatalogo({
  sedeId,
  especialidades,
  medicos,
  vinculos,
  consultorios,
}: {
  sedeId: string;
  especialidades: Especialidad[];
  medicos: Medico[];
  vinculos: Vinculo[];
  consultorios: Consultorio[];
}) {
  const [pestana, setPestana] = useState<Pestana>("especialidades");

  return (
    <div>
      <div className="mb-5 inline-flex flex-wrap rounded-md border border-line-strong bg-surface p-0.5">
        {PESTANAS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            className={`h-8 rounded-[5px] px-3 text-[13px] font-medium transition-colors ${
              pestana === p ? "bg-navy text-text-inverse" : "text-text-muted hover:text-text"
            }`}
          >
            {ETIQUETAS_PESTANA[p]}
          </button>
        ))}
      </div>

      {pestana === "especialidades" && <TabEspecialidades sedeId={sedeId} especialidades={especialidades} />}
      {pestana === "medicos" && <TabMedicos sedeId={sedeId} medicos={medicos} especialidades={especialidades} vinculos={vinculos} />}
      {pestana === "consultorios" && <TabConsultorios sedeId={sedeId} consultorios={consultorios} />}
      {pestana === "servicios" && <TabServicios />}
      {pestana === "horarios" && (
        <TabHorarios especialidades={especialidades} medicos={medicos} vinculos={vinculos} consultorios={consultorios} />
      )}
    </div>
  );
}

/* ---------------- Especialidades ---------------- */

function TabEspecialidades({ sedeId, especialidades }: { sedeId: string; especialidades: Especialidad[] }) {
  const router = useRouter();
  const [creandoNueva, setCreandoNueva] = useState(false);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {especialidades.map((e) => (
            <FilaEspecialidad key={e.id} especialidad={e} onGuardado={() => router.refresh()} />
          ))}
        </ul>
      </div>

      {creandoNueva ? (
        <FormularioEspecialidad
          sedeId={sedeId}
          onCancelar={() => setCreandoNueva(false)}
          onGuardado={() => {
            setCreandoNueva(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreandoNueva(true)}
          className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
        >
          + Nueva especialidad
        </button>
      )}
    </div>
  );
}

function FilaEspecialidad({ especialidad, onGuardado }: { especialidad: Especialidad; onGuardado: () => void }) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
        <span className="min-w-[160px] flex-1 text-[14px] text-text">{especialidad.nombre}</span>
        <span className="tabular text-[12.5px] text-text-muted">
          {especialidad.modo} · {especialidad.duracion_min} min · cupo {especialidad.cupos_por_bloque}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${especialidad.activa ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"}`}>
          {especialidad.activa ? "Activa" : "Inactiva"}
        </span>
        <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-medium text-navy hover:underline">
          Editar
        </button>
      </li>
    );
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <FormularioEspecialidad
        especialidad={especialidad}
        onCancelar={() => setEditando(false)}
        onGuardado={() => {
          setEditando(false);
          onGuardado();
        }}
      />
    </li>
  );
}

function FormularioEspecialidad({
  sedeId,
  especialidad,
  onCancelar,
  onGuardado,
}: {
  sedeId?: string;
  especialidad?: Especialidad;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(especialidad?.nombre ?? "");
  const [modo, setModo] = useState<Modo>(especialidad?.modo ?? "exacto");
  const [duracionMin, setDuracionMin] = useState(especialidad?.duracion_min ?? 20);
  const [cuposPorBloque, setCuposPorBloque] = useState(especialidad?.cupos_por_bloque ?? 1);
  const [activa, setActiva] = useState(especialidad?.activa ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugificar(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const datos = { nombre, slug: especialidad?.slug ?? slugificar(nombre), modo, duracionMin, cuposPorBloque, activa };
    const resultado = especialidad
      ? await accionActualizarEspecialidad(especialidad.id, datos)
      : await accionCrearEspecialidad(sedeId!, datos);
    setGuardando(false);
    if (resultado.ok) onGuardado();
    else setError(resultado.mensaje);
  }

  return (
    <div className="space-y-3 rounded-md bg-surface-sunken p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clasesEtiqueta}>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={clasesCampo} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Modo</label>
          <select value={modo} onChange={(e) => setModo(e.target.value as Modo)} className={clasesCampo}>
            <option value="exacto">Exacto</option>
            <option value="bloque">Bloque</option>
            <option value="solicitud">Solicitud</option>
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Duración (min)</label>
          <input
            type="number"
            value={duracionMin}
            onChange={(e) => setDuracionMin(Number(e.target.value))}
            className={`tabular ${clasesCampo}`}
          />
        </div>
        <div>
          <label className={clasesEtiqueta}>Cupos por bloque</label>
          <input
            type="number"
            value={cuposPorBloque}
            onChange={(e) => setCuposPorBloque(Number(e.target.value))}
            className={`tabular ${clasesCampo}`}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-text">
        <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} className="h-4 w-4" />
        Activa
      </label>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando || !nombre}
          onClick={guardar}
          className="h-8 rounded-md bg-navy px-3 text-[12.5px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Médicos ---------------- */

function TabMedicos({
  sedeId,
  medicos,
  especialidades,
  vinculos,
}: {
  sedeId: string;
  medicos: Medico[];
  especialidades: Especialidad[];
  vinculos: Vinculo[];
}) {
  const router = useRouter();
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  const especialidadesPorMedico = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const v of vinculos) {
      if (!mapa.has(v.medico_id)) mapa.set(v.medico_id, []);
      mapa.get(v.medico_id)!.push(v.especialidad_id);
    }
    return mapa;
  }, [vinculos]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {medicos.map((m) => (
            <FilaMedico
              key={m.id}
              medico={m}
              especialidades={especialidades}
              especialidadesAsignadas={especialidadesPorMedico.get(m.id) ?? []}
              onGuardado={() => router.refresh()}
            />
          ))}
        </ul>
      </div>

      {creandoNuevo ? (
        <FormularioMedico
          sedeId={sedeId}
          especialidades={especialidades}
          especialidadesAsignadas={[]}
          onCancelar={() => setCreandoNuevo(false)}
          onGuardado={() => {
            setCreandoNuevo(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreandoNuevo(true)}
          className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
        >
          + Nuevo médico
        </button>
      )}
    </div>
  );
}

function FilaMedico({
  medico,
  especialidades,
  especialidadesAsignadas,
  onGuardado,
}: {
  medico: Medico;
  especialidades: Especialidad[];
  especialidadesAsignadas: string[];
  onGuardado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const nombresEspecialidades = especialidades.filter((e) => especialidadesAsignadas.includes(e.id)).map((e) => e.nombre);

  if (!editando) {
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
        <span className="min-w-[180px] flex-1 text-[14px] text-text">
          {medico.titulo} {medico.nombres} {medico.apellidos}
        </span>
        <span className="text-[12.5px] text-text-muted">{nombresEspecialidades.join(", ") || "Sin especialidad asignada"}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${medico.activo ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"}`}>
          {medico.activo ? "Activo" : "Inactivo"}
        </span>
        <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-medium text-navy hover:underline">
          Editar
        </button>
      </li>
    );
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <FormularioMedico
        medico={medico}
        especialidades={especialidades}
        especialidadesAsignadas={especialidadesAsignadas}
        onCancelar={() => setEditando(false)}
        onGuardado={() => {
          setEditando(false);
          onGuardado();
        }}
      />
    </li>
  );
}

function FormularioMedico({
  sedeId,
  medico,
  especialidades,
  especialidadesAsignadas,
  onCancelar,
  onGuardado,
}: {
  sedeId?: string;
  medico?: Medico;
  especialidades: Especialidad[];
  especialidadesAsignadas: string[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [nombres, setNombres] = useState(medico?.nombres ?? "");
  const [apellidos, setApellidos] = useState(medico?.apellidos ?? "");
  const [titulo, setTitulo] = useState(medico?.titulo ?? "");
  const [celular, setCelular] = useState(medico?.celular ?? "");
  const [correo, setCorreo] = useState(medico?.correo ?? "");
  const [activo, setActivo] = useState(medico?.activo ?? true);
  const [seleccionadas, setSeleccionadas] = useState<string[]>(especialidadesAsignadas);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(id: string) {
    setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const datos = { nombres, apellidos, titulo, celular, correo, activo, especialidadesIds: seleccionadas };
    const resultado = medico ? await accionActualizarMedico(medico.id, datos) : await accionCrearMedico(sedeId!, datos);
    setGuardando(false);
    if (resultado.ok) onGuardado();
    else setError(resultado.mensaje);
  }

  return (
    <div className="space-y-3 rounded-md bg-surface-sunken p-3">
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
          <label className={clasesEtiqueta}>Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Dr., Dra., Lcda.…" className={clasesCampo} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Celular</label>
          <input value={celular} onChange={(e) => setCelular(e.target.value)} className={`tabular ${clasesCampo}`} />
        </div>
        <div className="col-span-2">
          <label className={clasesEtiqueta}>Correo</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={clasesCampo} />
        </div>
      </div>

      <div>
        <span className={clasesEtiqueta}>Especialidades</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {especialidades.map((e) => (
            <label key={e.id} className="flex items-center gap-1.5 text-[13px] text-text">
              <input type="checkbox" checked={seleccionadas.includes(e.id)} onChange={() => alternar(e.id)} className="h-4 w-4" />
              {e.nombre}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4" />
        Activo
      </label>

      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando || !nombres || !apellidos}
          onClick={guardar}
          className="h-8 rounded-md bg-navy px-3 text-[12.5px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Consultorios ---------------- */

function TabConsultorios({ sedeId, consultorios }: { sedeId: string; consultorios: Consultorio[] }) {
  const router = useRouter();
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <ul>
          {consultorios.map((c) => (
            <FilaConsultorio key={c.id} consultorio={c} onGuardado={() => router.refresh()} />
          ))}
        </ul>
      </div>
      {creandoNuevo ? (
        <FormularioConsultorio
          sedeId={sedeId}
          onCancelar={() => setCreandoNuevo(false)}
          onGuardado={() => {
            setCreandoNuevo(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreandoNuevo(true)}
          className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
        >
          + Nuevo consultorio
        </button>
      )}
    </div>
  );
}

function FilaConsultorio({ consultorio, onGuardado }: { consultorio: Consultorio; onGuardado: () => void }) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
        <span className="tabular w-10 shrink-0 text-[14px] font-medium text-text">#{consultorio.numero}</span>
        <span className="min-w-[160px] flex-1 text-[14px] text-text">{consultorio.nombre}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${consultorio.activo ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"}`}>
          {consultorio.activo ? "Activo" : "Inactivo"}
        </span>
        <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-medium text-navy hover:underline">
          Editar
        </button>
      </li>
    );
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <FormularioConsultorio
        consultorio={consultorio}
        onCancelar={() => setEditando(false)}
        onGuardado={() => {
          setEditando(false);
          onGuardado();
        }}
      />
    </li>
  );
}

function FormularioConsultorio({
  sedeId,
  consultorio,
  onCancelar,
  onGuardado,
}: {
  sedeId?: string;
  consultorio?: Consultorio;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(consultorio?.nombre ?? "");
  const [numero, setNumero] = useState(consultorio?.numero ?? 1);
  const [activo, setActivo] = useState(consultorio?.activo ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const datos = { nombre, numero, activo };
    const resultado = consultorio
      ? await accionActualizarConsultorio(consultorio.id, datos)
      : await accionCrearConsultorio(sedeId!, datos);
    setGuardando(false);
    if (resultado.ok) onGuardado();
    else setError(resultado.mensaje);
  }

  return (
    <div className="space-y-3 rounded-md bg-surface-sunken p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={clasesEtiqueta}>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={clasesCampo} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Número</label>
          <input type="number" value={numero} onChange={(e) => setNumero(Number(e.target.value))} className={`tabular ${clasesCampo}`} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-text">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4" />
        Activo
      </label>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando || !nombre}
          onClick={guardar}
          className="h-8 rounded-md bg-navy px-3 text-[12.5px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Servicios ---------------- */

function TabServicios() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ServicioResultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    setCargando(true);
    accionBuscarServicios(q).then((r) => {
      setResultados(r);
      setCargando(false);
      setBuscado(true);
    });
  }, [q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por descripción o código…"
        className={`mb-4 max-w-md ${clasesCampo}`}
      />
      {cargando && <p className="text-[13px] text-text-muted">Buscando…</p>}
      {!cargando && buscado && resultados.length === 0 && <p className="text-[13px] text-text-muted">Sin resultados.</p>}
      {resultados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[12px] text-text-muted">
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 font-medium">Especialidad</th>
                <th className="px-3 py-2 text-center font-medium">Agendable</th>
                <th className="px-3 py-2 text-center font-medium">Web</th>
                <th className="px-3 py-2 text-center font-medium">Bot</th>
                <th className="px-3 py-2 text-center font-medium">Activo</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((s) => (
                <FilaServicio key={s.id} servicio={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilaServicio({ servicio }: { servicio: ServicioResultado }) {
  const [agendable, setAgendable] = useState(servicio.agendable);
  const [visibleWeb, setVisibleWeb] = useState(servicio.visibleWeb);
  const [visibleBot, setVisibleBot] = useState(servicio.visibleBot);
  const [activo, setActivo] = useState(servicio.activo);

  async function alternar(campo: "agendable" | "visible_web" | "visible_bot" | "activo", valorActual: boolean, set: (v: boolean) => void) {
    set(!valorActual);
    const resultado = await accionActualizarFlagServicio(servicio.id, campo, !valorActual);
    if (!resultado.ok) set(valorActual);
  }

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="tabular px-3 py-2 text-text-muted">{servicio.codigoRevital}</td>
      <td className="px-3 py-2 text-text">{servicio.descripcion}</td>
      <td className="px-3 py-2 text-text-muted">{servicio.especialidad ?? "—"}</td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={agendable} onChange={() => alternar("agendable", agendable, setAgendable)} className="h-4 w-4" />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={visibleWeb} onChange={() => alternar("visible_web", visibleWeb, setVisibleWeb)} className="h-4 w-4" />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={visibleBot} onChange={() => alternar("visible_bot", visibleBot, setVisibleBot)} className="h-4 w-4" />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={activo} onChange={() => alternar("activo", activo, setActivo)} className="h-4 w-4" />
      </td>
    </tr>
  );
}

/* ---------------- Horarios ---------------- */

function TabHorarios({
  especialidades,
  medicos,
  vinculos,
  consultorios,
}: {
  especialidades: Especialidad[];
  medicos: Medico[];
  vinculos: Vinculo[];
  consultorios: Consultorio[];
}) {
  const router = useRouter();
  const [especialidadId, setEspecialidadId] = useState("");
  const [horarios, setHorarios] = useState<HorarioFila[]>([]);
  const [cargando, setCargando] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  const medicosDeEspecialidad = useMemo(
    () => vinculos.filter((v) => v.especialidad_id === especialidadId).map((v) => medicos.find((m) => m.id === v.medico_id)!).filter(Boolean),
    [vinculos, medicos, especialidadId]
  );

  useEffect(() => {
    if (!especialidadId) {
      setHorarios([]);
      return;
    }
    setCargando(true);
    accionListarHorarios(especialidadId).then((r) => {
      setHorarios(r);
      setCargando(false);
    });
  }, [especialidadId]);

  function recargar() {
    setCreandoNuevo(false);
    if (!especialidadId) return;
    accionListarHorarios(especialidadId).then(setHorarios);
    router.refresh();
  }

  const grupos = useMemo(() => {
    const mapa = new Map<string, { etiqueta: string; filas: HorarioFila[] }>();
    for (const h of horarios) {
      const medico = h.medicoId ? medicos.find((m) => m.id === h.medicoId) : null;
      const clave = h.medicoId ?? "sin-medico";
      const etiqueta = medico ? `${medico.titulo ?? ""} ${medico.nombres} ${medico.apellidos}`.trim() : "Sin médico (p. ej. Laboratorio)";
      if (!mapa.has(clave)) mapa.set(clave, { etiqueta, filas: [] });
      mapa.get(clave)!.filas.push(h);
    }
    return [...mapa.values()];
  }, [horarios, medicos]);

  return (
    <div className="space-y-3">
      <div className="max-w-sm">
        <label className={clasesEtiqueta}>Especialidad</label>
        <select value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)} className={clasesCampo}>
          <option value="">Selecciona…</option>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      {especialidadId && (
        <>
          {cargando ? (
            <p className="text-[13px] text-text-muted">Cargando…</p>
          ) : (
            <div className="space-y-4">
              {grupos.length === 0 && <p className="text-[13px] text-text-muted">Sin horarios cargados todavía.</p>}
              {grupos.map((g) => (
                <div key={g.etiqueta} className="overflow-hidden rounded-lg border border-line bg-surface">
                  <h3 className="border-b border-line bg-surface-sunken px-4 py-2 text-[13.5px] font-semibold text-text">{g.etiqueta}</h3>
                  <ul>
                    {g.filas.map((h) => (
                      <FilaHorario key={h.id} horario={h} consultorios={consultorios} onGuardado={recargar} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {creandoNuevo ? (
            <FormularioHorario
              especialidadId={especialidadId}
              medicosDeEspecialidad={medicosDeEspecialidad}
              consultorios={consultorios}
              onCancelar={() => setCreandoNuevo(false)}
              onGuardado={recargar}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreandoNuevo(true)}
              className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
            >
              + Nuevo horario
            </button>
          )}
        </>
      )}
    </div>
  );
}

function FilaHorario({
  horario,
  consultorios,
  onGuardado,
}: {
  horario: HorarioFila;
  consultorios: Consultorio[];
  onGuardado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const consultorio = consultorios.find((c) => c.id === horario.consultorioId);

  async function eliminar() {
    setEliminando(true);
    const resultado = await accionEliminarHorario(horario.id);
    setEliminando(false);
    if (resultado.ok) onGuardado();
    else alert(resultado.mensaje);
  }

  if (editando) {
    return (
      <li className="border-b border-line px-4 py-3 last:border-b-0">
        <FormularioHorario
          horario={horario}
          medicosDeEspecialidad={[]}
          consultorios={consultorios}
          onCancelar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            onGuardado();
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0">
      <span className="w-20 shrink-0 text-[13.5px] text-text">{DIAS_SEMANA.find((d) => d.valor === horario.diaSemana)?.etiqueta}</span>
      <span className="tabular text-[13.5px] text-text">
        {horario.horaInicio.slice(0, 5)}–{horario.horaFin.slice(0, 5)}
      </span>
      <span className="text-[12.5px] text-text-muted">
        {horario.modo} · {horario.duracionMin} min · cupo {horario.cuposPorBloque}
        {consultorio && ` · ${consultorio.nombre}`}
      </span>
      {!horario.activo && <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11.5px] text-text-muted">Inactivo</span>}
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-medium text-navy hover:underline">
          Editar
        </button>
        <button
          type="button"
          disabled={eliminando}
          onClick={eliminar}
          className="text-[13px] font-medium text-danger hover:underline disabled:opacity-50"
        >
          {eliminando ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </li>
  );
}

function FormularioHorario({
  especialidadId,
  horario,
  medicosDeEspecialidad,
  consultorios,
  onCancelar,
  onGuardado,
}: {
  especialidadId?: string;
  horario?: HorarioFila;
  medicosDeEspecialidad: Medico[];
  consultorios: Consultorio[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [medicoId, setMedicoId] = useState(horario?.medicoId ?? (medicosDeEspecialidad[0]?.id ?? ""));
  const [consultorioId, setConsultorioId] = useState(horario?.consultorioId ?? "");
  const [diaSemana, setDiaSemana] = useState(horario?.diaSemana ?? 1);
  const [horaInicio, setHoraInicio] = useState(horario?.horaInicio.slice(0, 5) ?? "08:00");
  const [horaFin, setHoraFin] = useState(horario?.horaFin.slice(0, 5) ?? "09:00");
  const [modo, setModo] = useState<Modo>(horario?.modo ?? "exacto");
  const [duracionMin, setDuracionMin] = useState(horario?.duracionMin ?? 20);
  const [cuposPorBloque, setCuposPorBloque] = useState(horario?.cuposPorBloque ?? 1);
  const [activo, setActivo] = useState(horario?.activo ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const datos: DatosHorario = {
      medicoId: medicoId || null,
      consultorioId: consultorioId || null,
      diaSemana,
      horaInicio,
      horaFin,
      modo,
      duracionMin,
      cuposPorBloque,
      activo,
    };
    const resultado = horario ? await accionActualizarHorario(horario.id, datos) : await accionCrearHorario(especialidadId!, datos);
    setGuardando(false);
    if (resultado.ok) onGuardado();
    else setError(resultado.mensaje);
  }

  return (
    <div className="space-y-3 rounded-md bg-surface-sunken p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {!horario && (
          <div>
            <label className={clasesEtiqueta}>Médico</label>
            <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={clasesCampo}>
              <option value="">Sin médico (p. ej. Laboratorio)</option>
              {medicosDeEspecialidad.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titulo} {m.nombres} {m.apellidos}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={clasesEtiqueta}>Día</label>
          <select value={diaSemana} onChange={(e) => setDiaSemana(Number(e.target.value))} className={clasesCampo}>
            {DIAS_SEMANA.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Consultorio (opcional)</label>
          <select value={consultorioId} onChange={(e) => setConsultorioId(e.target.value)} className={clasesCampo}>
            <option value="">Sin asignar</option>
            {consultorios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Hora inicio</label>
          <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={`tabular ${clasesCampo}`} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Hora fin</label>
          <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={`tabular ${clasesCampo}`} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Modo</label>
          <select value={modo} onChange={(e) => setModo(e.target.value as Modo)} className={clasesCampo}>
            <option value="exacto">Exacto</option>
            <option value="bloque">Bloque</option>
          </select>
        </div>
        <div>
          <label className={clasesEtiqueta}>Duración (min)</label>
          <input type="number" value={duracionMin} onChange={(e) => setDuracionMin(Number(e.target.value))} className={`tabular ${clasesCampo}`} />
        </div>
        <div>
          <label className={clasesEtiqueta}>Cupos por bloque</label>
          <input
            type="number"
            value={cuposPorBloque}
            onChange={(e) => setCuposPorBloque(Number(e.target.value))}
            className={`tabular ${clasesCampo}`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4" />
        Activo
      </label>

      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={guardando || horaFin <= horaInicio}
          onClick={guardar}
          className="h-8 rounded-md bg-navy px-3 text-[12.5px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="h-8 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-text hover:bg-surface">
          Cancelar
        </button>
      </div>
    </div>
  );
}

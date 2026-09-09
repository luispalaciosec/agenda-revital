"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatoHora } from "@/lib/formato";
import { textoParaErp } from "@/lib/erp";
import { BadgeEstado } from "./badge-estado";
import { accionCancelarCita } from "../_acciones";
import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

const ESTADOS_CANCELABLES: EstadoCita[] = ["solicitada", "en_gestion", "confirmada"];

export interface CitaAgenda {
  id: string;
  codigoPublico: string | null;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  precioAplicado: string | number | null;
  paciente: {
    nombres: string;
    apellidos: string;
    tipo_documento: "cedula" | "pasaporte";
    documento: string;
    fecha_nacimiento: string;
    correo: string | null;
  } | null;
  contacto: { celular: string } | null;
  medico: { id: string; nombres: string; apellidos: string; titulo: string | null } | null;
  consultorio: { id: string; nombre: string } | null;
  especialidad: { id: string; nombre: string } | null;
  servicio: { id: string; descripcion: string } | null;
}

type Agrupacion = "medico" | "consultorio";

interface Grupo {
  clave: string;
  etiqueta: string;
  citas: CitaAgenda[];
}

function agrupar(citas: CitaAgenda[], por: Agrupacion): Grupo[] {
  const grupos = new Map<string, Grupo>();

  for (const cita of citas) {
    const referencia = por === "medico" ? cita.medico : cita.consultorio;
    const clave = referencia?.id ?? "sin-asignar";
    const etiqueta =
      por === "medico"
        ? cita.medico
          ? `${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`.trim()
          : "Sin médico asignado"
        : (cita.consultorio?.nombre ?? "Sin consultorio asignado");

    if (!grupos.has(clave)) grupos.set(clave, { clave, etiqueta, citas: [] });
    grupos.get(clave)!.citas.push(cita);
  }

  return [...grupos.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"));
}

export function VistaAgenda({ citas }: { citas: CitaAgenda[] }) {
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("medico");
  const grupos = useMemo(() => agrupar(citas, agrupacion), [citas, agrupacion]);

  if (citas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-text">No hay citas agendadas para hoy</p>
        <p className="mt-1 text-sm text-text-muted">
          Las citas que se agenden por web, bot o panel van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-line-strong bg-surface p-0.5">
        <BotonAgrupacion activo={agrupacion === "medico"} onClick={() => setAgrupacion("medico")}>
          Por médico
        </BotonAgrupacion>
        <BotonAgrupacion activo={agrupacion === "consultorio"} onClick={() => setAgrupacion("consultorio")}>
          Por consultorio
        </BotonAgrupacion>
      </div>

      <div className="space-y-5">
        {grupos.map((grupo) => (
          <section key={grupo.clave} className="overflow-hidden rounded-lg border border-line bg-surface">
            <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
              {grupo.etiqueta}
              <span className="ml-2 font-normal text-text-muted">
                {grupo.citas.length} {grupo.citas.length === 1 ? "cita" : "citas"}
              </span>
            </h2>
            <ul>
              {grupo.citas.map((cita) => (
                <FilaCita key={cita.id} cita={cita} mostrarConsultorio={agrupacion === "medico"} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilaCita({ cita, mostrarConsultorio }: { cita: CitaAgenda; mostrarConsultorio: boolean }) {
  const router = useRouter();
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const puedeCancelar = ESTADOS_CANCELABLES.includes(cita.estado);
  const puedeReprogramar = cita.estado === "confirmada";

  async function copiarParaErp() {
    const texto = textoParaErp({
      codigoPublico: cita.codigoPublico,
      inicio: cita.inicio,
      fin: cita.fin,
      especialidad: cita.especialidad?.nombre ?? null,
      servicio: cita.servicio?.descripcion ?? null,
      medico: cita.medico ? `${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`.trim() : null,
      precioAplicado: cita.precioAplicado,
      paciente: cita.paciente
        ? {
            nombres: cita.paciente.nombres,
            apellidos: cita.paciente.apellidos,
            tipoDocumento: cita.paciente.tipo_documento,
            documento: cita.paciente.documento,
            fechaNacimiento: cita.paciente.fecha_nacimiento,
            correo: cita.paciente.correo,
          }
        : null,
      celular: cita.contacto?.celular ?? null,
    });
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function cancelar(quien: "paciente" | "centro") {
    setCancelando(true);
    setError(null);
    const resultado = await accionCancelarCita(cita.id, quien);
    setCancelando(false);
    if (resultado.ok) {
      setConfirmandoCancelacion(false);
      router.refresh();
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="tabular w-[92px] shrink-0 text-[14px] font-medium text-text">
          {formatoHora(cita.inicio)}–{formatoHora(cita.fin)}
        </span>
        <span className="min-w-[160px] flex-1 text-[14px] text-text">
          {cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : "—"}
        </span>
        <span className="text-[13px] text-text-muted">{cita.servicio?.descripcion ?? cita.especialidad?.nombre ?? "—"}</span>
        {mostrarConsultorio && cita.consultorio && <span className="text-[13px] text-text-muted">{cita.consultorio.nombre}</span>}
        {!mostrarConsultorio && (
          <span className="text-[13px] text-text-muted">
            {cita.medico ? `${cita.medico.titulo ?? ""} ${cita.medico.nombres} ${cita.medico.apellidos}`.trim() : "Sin médico asignado"}
          </span>
        )}
        <BadgeEstado estado={cita.estado} />

        {!confirmandoCancelacion && (
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={copiarParaErp}
              title="Copiar datos del paciente y la cita para pegar en el ERP (§8.3)"
              className="h-8 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
            >
              {copiado ? "Copiado ✓" : "Copiar ERP"}
            </button>
            {puedeReprogramar && (
              <Link
                href={`/panel/agenda/reprogramar/${cita.id}`}
                className="h-8 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
              >
                Reprogramar
              </Link>
            )}
            {puedeCancelar && (
              <button
                type="button"
                onClick={() => setConfirmandoCancelacion(true)}
                className="h-8 rounded-md border border-danger px-2.5 text-[12.5px] font-medium text-danger hover:bg-danger-bg"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {confirmandoCancelacion && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-md bg-surface-sunken px-3 py-2">
          <span className="text-[13px] text-text">¿Quién cancela?</span>
          <button
            type="button"
            disabled={cancelando}
            onClick={() => cancelar("paciente")}
            className="h-8 rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken disabled:opacity-50"
          >
            El paciente
          </button>
          <button
            type="button"
            disabled={cancelando}
            onClick={() => cancelar("centro")}
            className="h-8 rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken disabled:opacity-50"
          >
            El centro
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoCancelacion(false)}
            className="h-8 rounded-md px-2.5 text-[12.5px] font-medium text-text-muted hover:text-text"
          >
            Deshacer
          </button>
        </div>
      )}

      {error && (
        <p role="alert" aria-live="polite" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

function BotonAgrupacion({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-8 rounded-[5px] px-3 text-[13px] font-medium transition-colors ${
        activo ? "bg-navy text-text-inverse" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

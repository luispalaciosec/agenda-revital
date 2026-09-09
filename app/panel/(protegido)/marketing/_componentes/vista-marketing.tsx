"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accionCrearPromocion, accionActualizarPromocion, accionActualizarFlagActivaPromocion } from "../_acciones";
import { formatoFechaDMY } from "@/lib/formato";
import type { DatosPromocion } from "@/lib/marketing/promociones";
import type { ResumenAtribucion } from "@/lib/marketing/atribucion";

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  especialidad_id: string | null;
  vigente_desde: string;
  vigente_hasta: string | null;
  activa: boolean;
  especialidad: { nombre: string } | null;
}

interface Especialidad {
  id: string;
  nombre: string;
}

const clasesCampo =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1 block text-[12.5px] font-medium text-text";

const FORMULARIO_VACIO: DatosPromocion = {
  titulo: "",
  descripcion: "",
  imagenUrl: "",
  especialidadId: null,
  vigenteDesde: "",
  vigenteHasta: "",
  activa: true,
};

export function VistaMarketing({
  promociones,
  especialidades,
  desde,
  hasta,
  resumenAtribucion,
}: {
  promociones: Promocion[];
  especialidades: Especialidad[];
  desde: string;
  hasta: string;
  resumenAtribucion: ResumenAtribucion;
}) {
  return (
    <div className="space-y-8">
      <SeccionPromociones promociones={promociones} especialidades={especialidades} />
      <SeccionAtribucion desde={desde} hasta={hasta} resumen={resumenAtribucion} />
    </div>
  );
}

function SeccionPromociones({ promociones, especialidades }: { promociones: Promocion[]; especialidades: Especialidad[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<DatosPromocion>(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirNueva() {
    setForm(FORMULARIO_VACIO);
    setEditando(null);
    setMostrarForm(true);
    setError(null);
  }

  function abrirEditar(p: Promocion) {
    setForm({
      titulo: p.titulo,
      descripcion: p.descripcion ?? "",
      imagenUrl: p.imagen_url ?? "",
      especialidadId: p.especialidad_id,
      vigenteDesde: p.vigente_desde,
      vigenteHasta: p.vigente_hasta ?? "",
      activa: p.activa,
    });
    setEditando(p.id);
    setMostrarForm(true);
    setError(null);
  }

  async function guardar() {
    if (!form.titulo.trim() || !form.vigenteDesde) {
      setError("Título y fecha de inicio son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    const datos: DatosPromocion = {
      ...form,
      descripcion: form.descripcion?.trim() || null,
      imagenUrl: form.imagenUrl?.trim() || null,
      vigenteHasta: form.vigenteHasta?.trim() || null,
    };
    const resultado = editando ? await accionActualizarPromocion(editando, datos) : await accionCrearPromocion(datos);
    setGuardando(false);
    if (resultado.ok) {
      setMostrarForm(false);
      router.refresh();
    } else {
      setError(resultado.mensaje);
    }
  }

  async function alternarActiva(p: Promocion) {
    await accionActualizarFlagActivaPromocion(p.id, !p.activa);
    router.refresh();
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">Promociones</h2>
        {!mostrarForm && (
          <button
            type="button"
            onClick={abrirNueva}
            className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep"
          >
            + Nueva promoción
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="mb-4 rounded-lg border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={clasesEtiqueta}>Título</label>
              <input
                className={clasesCampo}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej. Promo ginecología"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={clasesEtiqueta}>Descripción</label>
              <input
                className={clasesCampo}
                value={form.descripcion ?? ""}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={clasesEtiqueta}>URL de imagen</label>
              <input
                className={clasesCampo}
                value={form.imagenUrl ?? ""}
                onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className={clasesEtiqueta}>Especialidad</label>
              <select
                className={clasesCampo}
                value={form.especialidadId ?? ""}
                onChange={(e) => setForm({ ...form, especialidadId: e.target.value || null })}
              >
                <option value="">General (todas)</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <input
                id="promo-activa"
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              />
              <label htmlFor="promo-activa" className="text-[13.5px] text-text">
                Activa
              </label>
            </div>
            <div>
              <label className={clasesEtiqueta}>Vigente desde</label>
              <input
                type="date"
                className={clasesCampo}
                value={form.vigenteDesde}
                onChange={(e) => setForm({ ...form, vigenteDesde: e.target.value })}
              />
            </div>
            <div>
              <label className={clasesEtiqueta}>Vigente hasta</label>
              <input
                type="date"
                className={clasesCampo}
                value={form.vigenteHasta ?? ""}
                onChange={(e) => setForm({ ...form, vigenteHasta: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {promociones.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-text-muted">No hay promociones cargadas todavía.</p>
        ) : (
          <ul>
            {promociones.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 text-[13.5px] last:border-b-0">
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium text-text">{p.titulo}</p>
                  <p className="text-[12.5px] text-text-muted">
                    {p.especialidad?.nombre ?? "General"} · {formatoFechaDMY(p.vigente_desde)}
                    {p.vigente_hasta ? ` – ${formatoFechaDMY(p.vigente_hasta)}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    p.activa ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"
                  }`}
                >
                  {p.activa ? "Activa" : "Inactiva"}
                </span>
                <button
                  type="button"
                  onClick={() => abrirEditar(p)}
                  className="h-8 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => alternarActiva(p)}
                  className="h-8 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                >
                  {p.activa ? "Desactivar" : "Activar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SeccionAtribucion({ desde, hasta, resumen }: { desde: string; hasta: string; resumen: ResumenAtribucion }) {
  const pctPauta = resumen.totalCitas > 0 ? Math.round((resumen.dePauta / resumen.totalCitas) * 100) : 0;
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-text">De dónde vienen las citas</h2>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label className={clasesEtiqueta} htmlFor="desde">
              Desde
            </label>
            <input id="desde" type="date" name="desde" defaultValue={desde} className={`tabular ${clasesCampo}`} />
          </div>
          <div>
            <label className={clasesEtiqueta} htmlFor="hasta">
              Hasta
            </label>
            <input id="hasta" type="date" name="hasta" defaultValue={hasta} className={`tabular ${clasesCampo}`} />
          </div>
          <button type="submit" className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep">
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tarjeta etiqueta="Citas en el rango" valor={resumen.totalCitas} />
        <Tarjeta etiqueta="De pauta (anuncios)" valor={`${resumen.dePauta} (${pctPauta}%)`} />
        <Tarjeta etiqueta="Orgánicas" valor={resumen.organicas} />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <h3 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">Por plataforma</h3>
        {resumen.porPlataforma.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-text-muted">Sin citas de pauta en el rango.</p>
        ) : (
          <ul>
            {resumen.porPlataforma.map((p) => (
              <li key={p.plataforma} className="flex items-center justify-between border-b border-line px-4 py-2 text-[13.5px] last:border-b-0">
                <span className="text-text">{p.plataforma}</span>
                <span className="tabular font-medium text-text">{p.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Tarjeta({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <p className="text-[12.5px] text-text-muted">{etiqueta}</p>
      <p className="tabular mt-1 text-[22px] font-semibold text-text">{valor}</p>
    </div>
  );
}

"use client";

import { aCsv, descargarCsv } from "@/lib/csv";
import { formatoFechaDMY, formatoHora } from "@/lib/formato";
import type { ResumenReportes } from "@/lib/reportes";

const ETIQUETAS_ESTADO: Record<string, string> = {
  solicitada: "Solicitada",
  en_gestion: "En gestión",
  confirmada: "Confirmada",
  atendida: "Atendida",
  no_show: "No-show",
  cancelada_paciente: "Cancelada (paciente)",
  cancelada_centro: "Cancelada (centro)",
  reprogramada: "Reprogramada",
  rechazada: "Rechazada",
};

const ETIQUETAS_CANAL: Record<string, string> = { web: "Web", bot: "Bot", panel: "Panel" };

export function VistaReportes({
  desde,
  hasta,
  resumen,
}: {
  desde: string;
  hasta: string;
  resumen: ResumenReportes;
}) {
  function exportar() {
    const filas = resumen.citas.map((c) => ({
      codigo: c.codigoPublico ?? "",
      fecha: formatoFechaDMY(c.fechaLocal),
      hora: formatoHora(c.inicio),
      paciente: c.paciente ?? "",
      especialidad: c.especialidad ?? "",
      medico: c.medico ?? "",
      canal: ETIQUETAS_CANAL[c.canal] ?? c.canal,
      estado: ETIQUETAS_ESTADO[c.estado] ?? c.estado,
      precio: c.precioAplicado ?? "",
    }));
    descargarCsv(`citas_${desde}_a_${hasta}.csv`, aCsv(filas));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-text" htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              name="desde"
              defaultValue={desde}
              className="tabular h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-text" htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="tabular h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text"
            />
          </div>
          <button type="submit" className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep">
            Aplicar
          </button>
        </form>
        <button
          type="button"
          onClick={exportar}
          disabled={resumen.citas.length === 0}
          className="ml-auto h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken disabled:opacity-40"
        >
          Exportar CSV ({resumen.citas.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta etiqueta="Citas en el rango" valor={resumen.totalCitas} />
        <Tarjeta etiqueta="Tasa de no-show" valor={resumen.tasaNoShowPct !== null ? `${resumen.tasaNoShowPct}%` : "—"} />
        <Tarjeta etiqueta="Solicitudes gestionadas" valor={resumen.solicitudes.total} />
        <Tarjeta
          etiqueta="Tiempo prom. de resolución"
          valor={resumen.solicitudes.tiempoPromedioHoras !== null ? `${resumen.solicitudes.tiempoPromedioHoras} h` : "—"}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TablaConteo titulo="Por especialidad" filas={resumen.porEspecialidad.map((e) => [e.nombre, e.cantidad])} />
        <TablaConteo titulo="Por médico" filas={resumen.porMedico.map((m) => [m.nombre, m.cantidad])} />
        <TablaConteo
          titulo="Origen del agendamiento"
          filas={resumen.porCanal.map((c) => [ETIQUETAS_CANAL[c.canal] ?? c.canal, c.cantidad])}
        />
        <TablaConteo titulo="Por estado" filas={resumen.porEstado.map((e) => [ETIQUETAS_ESTADO[e.estado] ?? e.estado, e.cantidad])} />
      </div>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-2 text-[14px] font-semibold text-text">Solicitudes por gestionar (§6.3)</h2>
        <dl className="grid grid-cols-2 gap-3 text-[13.5px] sm:grid-cols-4">
          <div>
            <dt className="text-text-muted">Aceptadas</dt>
            <dd className="tabular text-[16px] font-semibold text-success">{resumen.solicitudes.aceptadas}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Rechazadas</dt>
            <dd className="tabular text-[16px] font-semibold text-text">{resumen.solicitudes.rechazadas}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Vencidas</dt>
            <dd className="tabular text-[16px] font-semibold text-danger">{resumen.solicitudes.vencidas}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Total</dt>
            <dd className="tabular text-[16px] font-semibold text-text">{resumen.solicitudes.total}</dd>
          </div>
        </dl>
      </section>
    </div>
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

function TablaConteo({ titulo, filas }: { titulo: string; filas: [string, number][] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-text-muted">Sin datos en el rango.</p>
      ) : (
        <ul>
          {filas.map(([nombre, cantidad]) => (
            <li key={nombre} className="flex items-center justify-between border-b border-line px-4 py-2 text-[13.5px] last:border-b-0">
              <span className="text-text">{nombre}</span>
              <span className="tabular font-medium text-text">{cantidad}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

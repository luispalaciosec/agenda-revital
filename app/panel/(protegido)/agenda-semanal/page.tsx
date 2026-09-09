import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaCorta, formatoHora, hoyGuayaquil } from "@/lib/formato";
import { aLocal, aUtc, sumarDias } from "@/lib/disponibilidad/tiempo";
import { BadgeEstado } from "../agenda/_componentes/badge-estado";

/** Lunes de la semana que contiene `fecha` (el centro cierra domingo, §4.4). */
function lunesDeLaSemana(fecha: string): string {
  const diaSemana = aLocal(aUtc(fecha, "12:00")).diaSemana; // 1=lunes ... 7=domingo
  return sumarDias(fecha, -(diaSemana - 1));
}

export default async function PaginaAgendaSemanal({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const lunes = lunesDeLaSemana(semana || hoyGuayaquil());
  const sabado = sumarDias(lunes, 5);
  const semanaAnterior = sumarDias(lunes, -7);
  const semanaSiguiente = sumarDias(lunes, 7);

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, codigo_publico, inicio, estado, fecha_local,
       paciente:pacientes(nombres, apellidos),
       medico:medicos(nombres, apellidos, titulo),
       especialidad:especialidades(nombre),
       servicio:servicios(descripcion),
       consultorio:consultorios(nombre)`
    )
    .gte("fecha_local", lunes)
    .lte("fecha_local", sabado)
    .order("inicio");

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          No se pudo cargar la agenda semanal: {error.message}
        </p>
      </div>
    );
  }

  const dias = Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i));
  const citasPorDia = new Map<string, typeof data>();
  for (const dia of dias) citasPorDia.set(dia, []);
  for (const cita of data ?? []) {
    if (!cita.fecha_local) continue; // columna generada a partir de inicio, que es NOT NULL: nunca ocurre en la práctica
    citasPorDia.get(cita.fecha_local)?.push(cita);
  }

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text">Agenda semanal</h1>
          <p className="text-sm text-text-muted">
            {formatoFechaCorta(lunes)} – {formatoFechaCorta(sabado)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/panel/agenda-semanal?semana=${semanaAnterior}`}
            className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium leading-9 text-text hover:bg-surface-sunken"
          >
            ← Anterior
          </Link>
          <Link
            href={`/panel/agenda-semanal?semana=${hoyGuayaquil()}`}
            className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium leading-9 text-text hover:bg-surface-sunken"
          >
            Hoy
          </Link>
          <Link
            href={`/panel/agenda-semanal?semana=${semanaSiguiente}`}
            className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium leading-9 text-text hover:bg-surface-sunken"
          >
            Siguiente →
          </Link>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {dias.map((dia) => {
          const citasDelDia = citasPorDia.get(dia) ?? [];
          const esHoy = dia === hoyGuayaquil();
          return (
            <section key={dia} className="overflow-hidden rounded-lg border border-line bg-surface">
              <h2
                className={`border-b border-line px-3 py-2 text-[13.5px] font-semibold ${
                  esHoy ? "bg-navy text-text-inverse" : "bg-surface-sunken text-text"
                }`}
              >
                {formatoFechaCorta(dia)}
                <span className={`ml-1.5 font-normal ${esHoy ? "text-text-inverse/80" : "text-text-muted"}`}>
                  {citasDelDia.length}
                </span>
              </h2>
              {citasDelDia.length === 0 ? (
                <p className="px-3 py-4 text-[12.5px] text-text-muted">Sin citas</p>
              ) : (
                <ul>
                  {citasDelDia.map((c) => (
                    <li key={c.id} className="flex items-start gap-2 border-b border-line px-3 py-2 text-[12.5px] last:border-b-0">
                      <span className="tabular w-[44px] shrink-0 font-medium text-text">{formatoHora(c.inicio)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-text">{c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : "—"}</p>
                        <p className="truncate text-text-muted">{c.servicio?.descripcion ?? c.especialidad?.nombre}</p>
                        <p className="truncate text-[11.5px] text-text-muted">
                          {c.medico ? `${c.medico.titulo ?? ""} ${c.medico.nombres} ${c.medico.apellidos}`.trim() : "Sin médico asignado"}
                          {c.consultorio?.nombre ? ` · ${c.consultorio.nombre}` : ""}
                        </p>
                      </div>
                      <BadgeEstado estado={c.estado} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface FilaCitaReporte {
  id: string;
  codigoPublico: string | null;
  fechaLocal: string;
  inicio: string;
  estado: string;
  canal: string;
  precioAplicado: string | number | null;
  especialidad: string | null;
  medico: string | null;
  paciente: string | null;
}

export interface ResumenReportes {
  citas: FilaCitaReporte[];
  totalCitas: number;
  porEstado: { estado: string; cantidad: number }[];
  porCanal: { canal: string; cantidad: number }[];
  porEspecialidad: { nombre: string; cantidad: number }[];
  porMedico: { nombre: string; cantidad: number }[];
  tasaNoShowPct: number | null;
  solicitudes: {
    total: number;
    aceptadas: number;
    rechazadas: number;
    vencidas: number;
    tiempoPromedioHoras: number | null;
  };
}

/** §8.4: citas por día/semana/mes, por especialidad y médico, no-show, origen y solicitudes. */
export async function obtenerResumenReportes(desde: string, hasta: string): Promise<ResumenReportes> {
  const supabase = await crearClienteServidor();

  const [{ data: citasData, error: errorCitas }, { data: solicitudesData, error: errorSolicitudes }] = await Promise.all([
    supabase
      .from("citas")
      .select(
        `id, codigo_publico, fecha_local, inicio, estado, canal, precio_aplicado,
         especialidad:especialidades(nombre),
         medico:medicos(nombres, apellidos, titulo),
         paciente:pacientes(nombres, apellidos)`
      )
      .gte("fecha_local", desde)
      .lte("fecha_local", hasta)
      .order("inicio"),
    supabase
      .from("solicitudes_gestion")
      .select("resultado, creado_en, resuelta_en")
      .gte("creado_en", `${desde}T00:00:00-05:00`)
      .lte("creado_en", `${hasta}T23:59:59-05:00`),
  ]);

  if (errorCitas) throw errorCitas;
  if (errorSolicitudes) throw errorSolicitudes;

  const citas: FilaCitaReporte[] = (citasData ?? []).map((c) => ({
    id: c.id,
    codigoPublico: c.codigo_publico,
    fechaLocal: c.fecha_local ?? "",
    inicio: c.inicio,
    estado: c.estado,
    canal: c.canal,
    precioAplicado: c.precio_aplicado,
    especialidad: c.especialidad?.nombre ?? null,
    medico: c.medico ? `${c.medico.titulo ?? ""} ${c.medico.nombres} ${c.medico.apellidos}`.trim() : null,
    paciente: c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : null,
  }));

  const contarPor = <T extends string>(items: T[]): { clave: T; cantidad: number }[] => {
    const mapa = new Map<T, number>();
    for (const item of items) mapa.set(item, (mapa.get(item) ?? 0) + 1);
    return [...mapa.entries()].map(([clave, cantidad]) => ({ clave, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  };

  const porEstado = contarPor(citas.map((c) => c.estado)).map((x) => ({ estado: x.clave, cantidad: x.cantidad }));
  const porCanal = contarPor(citas.map((c) => c.canal)).map((x) => ({ canal: x.clave, cantidad: x.cantidad }));
  const porEspecialidad = contarPor(citas.map((c) => c.especialidad ?? "Sin especialidad")).map((x) => ({
    nombre: x.clave,
    cantidad: x.cantidad,
  }));
  const porMedico = contarPor(citas.map((c) => c.medico ?? "Sin médico")).map((x) => ({
    nombre: x.clave,
    cantidad: x.cantidad,
  }));

  const atendidas = citas.filter((c) => c.estado === "atendida").length;
  const noShow = citas.filter((c) => c.estado === "no_show").length;
  const baseNoShow = atendidas + noShow;
  const tasaNoShowPct = baseNoShow > 0 ? Math.round((noShow / baseNoShow) * 1000) / 10 : null;

  const solicitudes = solicitudesData ?? [];
  const resueltasConTiempo = solicitudes.filter((s) => s.resuelta_en);
  const tiempoPromedioHoras =
    resueltasConTiempo.length > 0
      ? Math.round(
          (resueltasConTiempo.reduce(
            (acc, s) => acc + (new Date(s.resuelta_en!).getTime() - new Date(s.creado_en).getTime()),
            0
          ) /
            resueltasConTiempo.length /
            (1000 * 60 * 60)) *
            10
        ) / 10
      : null;

  return {
    citas,
    totalCitas: citas.length,
    porEstado,
    porCanal,
    porEspecialidad,
    porMedico,
    tasaNoShowPct,
    solicitudes: {
      total: solicitudes.length,
      aceptadas: solicitudes.filter((s) => s.resultado === "aceptada").length,
      rechazadas: solicitudes.filter((s) => s.resultado === "rechazada").length,
      vencidas: solicitudes.filter((s) => s.resultado === "vencida").length,
      tiempoPromedioHoras,
    },
  };
}

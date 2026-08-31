import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaLarga, hoyGuayaquil } from "@/lib/formato";
import { VistaAgenda, type CitaAgenda } from "./_componentes/vista-agenda";

export default async function PaginaAgenda() {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, codigo_publico, inicio, fin, estado,
       paciente:pacientes(nombres, apellidos),
       medico:medicos(id, nombres, apellidos, titulo),
       consultorio:consultorios(id, nombre),
       especialidad:especialidades(nombre),
       servicio:servicios(descripcion)`
    )
    .eq("fecha_local", hoy)
    .order("inicio");

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          No se pudo cargar la agenda: {error.message}
        </p>
      </div>
    );
  }

  const citas: CitaAgenda[] = (data ?? []).map((c) => ({
    id: c.id,
    codigoPublico: c.codigo_publico,
    inicio: c.inicio,
    fin: c.fin,
    estado: c.estado,
    paciente: c.paciente,
    medico: c.medico,
    consultorio: c.consultorio,
    especialidad: c.especialidad,
    servicio: c.servicio,
  }));

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-semibold text-text">Agenda del día</h1>
        <p className="tabular text-sm text-text-muted">{formatoFechaLarga(hoy)}</p>
      </header>
      <VistaAgenda citas={citas} />
    </div>
  );
}

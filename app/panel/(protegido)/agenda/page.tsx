import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaLarga, hoyGuayaquil } from "@/lib/formato";
import { VistaAgenda, type CitaAgenda } from "./_componentes/vista-agenda";

export default async function PaginaAgenda() {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, codigo_publico, inicio, fin, estado, precio_aplicado,
       paciente:pacientes(nombres, apellidos, tipo_documento, documento, fecha_nacimiento, correo),
       contacto:contactos(celular),
       medico:medicos(id, nombres, apellidos, titulo),
       consultorio:consultorios(id, nombre),
       especialidad:especialidades(id, nombre),
       servicio:servicios(id, descripcion)`
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
    precioAplicado: c.precio_aplicado,
    paciente: c.paciente,
    contacto: c.contacto,
    medico: c.medico,
    consultorio: c.consultorio,
    especialidad: c.especialidad,
    servicio: c.servicio,
  }));

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text">Agenda del día</h1>
          <p className="tabular text-sm text-text-muted">{formatoFechaLarga(hoy)}</p>
        </div>
        <Link
          href="/panel/agenda/nueva"
          className="h-10 shrink-0 rounded-md bg-navy px-4 text-sm font-medium leading-10 text-text-inverse hover:bg-navy-deep"
        >
          + Nueva cita
        </Link>
      </header>
      <VistaAgenda citas={citas} />
    </div>
  );
}

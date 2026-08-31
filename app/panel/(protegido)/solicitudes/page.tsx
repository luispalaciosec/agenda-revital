import { crearClienteServidor } from "@/lib/supabase/server";
import { VistaSolicitudes, type SolicitudPendiente } from "./_componentes/vista-solicitudes";

export default async function PaginaSolicitudes() {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("solicitudes_gestion")
    .select(
      `id, vence_en, creado_en,
       cita:citas(id, codigo_publico, inicio,
         paciente:pacientes(nombres, apellidos),
         especialidad:especialidades(nombre),
         servicio:servicios(descripcion))`
    )
    .is("resultado", null)
    .order("vence_en");

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          No se pudieron cargar las solicitudes: {error.message}
        </p>
      </div>
    );
  }

  const solicitudes: SolicitudPendiente[] = (data ?? [])
    .filter((s) => s.cita !== null)
    .map((s) => ({
      id: s.id,
      venceEn: s.vence_en,
      creadoEn: s.creado_en,
      cita: {
        id: s.cita!.id,
        codigoPublico: s.cita!.codigo_publico,
        inicio: s.cita!.inicio,
        paciente: s.cita!.paciente,
        especialidad: s.cita!.especialidad,
        servicio: s.cita!.servicio,
      },
    }));

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold text-text">Solicitudes por gestionar</h1>
        <p className="text-sm text-text-muted">Procedimientos que un paciente pidió y esperan aprobación (§6.3).</p>
      </header>
      <VistaSolicitudes solicitudes={solicitudes} />
    </div>
  );
}

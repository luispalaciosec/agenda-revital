import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaLarga, hoyGuayaquil } from "@/lib/formato";
import { VistaSalaEspera, type CitaSala } from "./_componentes/vista-sala-espera";

export default async function PaginaSalaEspera() {
  const supabase = await crearClienteServidor();
  const hoy = hoyGuayaquil();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `id, codigo_publico, inicio, estado, llegada_en, atendida_en,
       paciente:pacientes(nombres, apellidos),
       medico:medicos(nombres, apellidos, titulo),
       especialidad:especialidades(nombre),
       servicio:servicios(descripcion)`
    )
    .eq("fecha_local", hoy)
    .in("estado", ["confirmada", "atendida"])
    .order("inicio");

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          No se pudo cargar la sala de espera: {error.message}
        </p>
      </div>
    );
  }

  const citas: CitaSala[] = (data ?? []).map((c) => ({
    id: c.id,
    codigoPublico: c.codigo_publico,
    inicio: c.inicio,
    estado: c.estado,
    llegadaEn: c.llegada_en,
    atendidaEn: c.atendida_en,
    paciente: c.paciente,
    medico: c.medico,
    especialidad: c.especialidad,
    servicio: c.servicio,
  }));

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold text-text">Sala de espera</h1>
        <p className="tabular text-sm text-text-muted">{formatoFechaLarga(hoy)}</p>
      </header>
      <VistaSalaEspera citas={citas} />
    </div>
  );
}

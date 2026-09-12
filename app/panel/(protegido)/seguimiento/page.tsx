import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { obtenerTableroHoy, obtenerPorLlegarHoy, listarPuntosAtencion } from "@/lib/seguimiento/tablero";
import { formatoFechaLarga, hoyGuayaquil } from "@/lib/formato";
import { VistaSeguimiento } from "./_componentes/vista-seguimiento";

export default async function PaginaSeguimiento() {
  await exigirRol(["admin", "supervisor", "admisionista", "medico"]);

  const [puntos, pacientes, porLlegar] = await Promise.all([listarPuntosAtencion(), obtenerTableroHoy(), obtenerPorLlegarHoy()]);
  const hoy = hoyGuayaquil();

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold text-text">Seguimiento de pacientes</h1>
        <p className="tabular text-sm text-text-muted">{formatoFechaLarga(hoy)}</p>
      </header>
      <VistaSeguimiento puntos={puntos} pacientesIniciales={pacientes} porLlegarIniciales={porLlegar} />
    </div>
  );
}

import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { obtenerMedicoActual, obtenerMiAgendaHoy } from "@/lib/medicos/mi-agenda";
import { listarPuntosAtencion } from "@/lib/seguimiento/tablero";
import { formatoFechaLarga, hoyGuayaquil } from "@/lib/formato";
import { VistaMiAgenda } from "./_componentes/vista-mi-agenda";

export default async function PaginaMiAgenda() {
  await exigirRol(["medico"]);

  const medico = await obtenerMedicoActual();
  const hoy = hoyGuayaquil();

  if (!medico) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-1 text-[22px] font-semibold text-text">Mi agenda</h1>
        <p className="rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
          Tu usuario todavía no está vinculado a un médico del catálogo. Pide a un administrador que lo asigne desde
          Usuarios.
        </p>
      </div>
    );
  }

  const [turnos, puntos] = await Promise.all([obtenerMiAgendaHoy(medico.id), listarPuntosAtencion()]);

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold text-text">Mi agenda</h1>
        <p className="text-sm text-text-muted">
          {medico.titulo ? `${medico.titulo} ` : ""}
          {medico.nombres} {medico.apellidos}
        </p>
        <p className="tabular text-[13px] text-text-muted">{formatoFechaLarga(hoy)}</p>
      </header>
      <VistaMiAgenda turnos={turnos} puntos={puntos} />
    </div>
  );
}

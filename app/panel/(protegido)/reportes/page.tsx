import { obtenerResumenReportes } from "@/lib/reportes";
import { hoyGuayaquil } from "@/lib/formato";
import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { VistaReportes } from "./_componentes/vista-reportes";

function primerDiaDelMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await exigirRol(["admin", "supervisor"]);

  const { desde: desdeParam, hasta: hastaParam } = await searchParams;
  const hoy = hoyGuayaquil();
  const desde = desdeParam || primerDiaDelMes(hoy);
  const hasta = hastaParam || hoy;

  const resumen = await obtenerResumenReportes(desde, hasta);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Reportes</h1>
      <p className="mb-5 text-sm text-text-muted">Citas, no-show, origen y solicitudes (§8.4).</p>
      <VistaReportes desde={desde} hasta={hasta} resumen={resumen} />
    </div>
  );
}

import { crearClienteServidor } from "@/lib/supabase/server";
import { calcularResumenAtribucion } from "@/lib/marketing/atribucion";
import { hoyGuayaquil } from "@/lib/formato";
import { exigirRol } from "@/lib/seguridad/exigir-rol";
import { VistaMarketing } from "./_componentes/vista-marketing";

function primerDiaDelMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

export default async function PaginaMarketing({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await exigirRol(["admin", "supervisor"]);

  const { desde: desdeParam, hasta: hastaParam } = await searchParams;
  const hoy = hoyGuayaquil();
  const desde = desdeParam || primerDiaDelMes(hoy);
  const hasta = hastaParam || hoy;

  const supabase = await crearClienteServidor();
  const [{ data: promociones }, { data: especialidades }, resumenAtribucion] = await Promise.all([
    supabase
      .from("promociones")
      .select("id, titulo, descripcion, imagen_url, especialidad_id, vigente_desde, vigente_hasta, activa, especialidad:especialidades(nombre)")
      .order("vigente_desde", { ascending: false }),
    supabase.from("especialidades").select("id, nombre").order("nombre"),
    calcularResumenAtribucion(desde, hasta),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Marketing</h1>
      <p className="mb-5 text-sm text-text-muted">Promociones vigentes y de dónde vienen las citas agendadas.</p>
      <VistaMarketing
        promociones={promociones ?? []}
        especialidades={especialidades ?? []}
        desde={desde}
        hasta={hasta}
        resumenAtribucion={resumenAtribucion}
      />
    </div>
  );
}

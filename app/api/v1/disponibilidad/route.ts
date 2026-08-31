import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  const params = new URL(request.url).searchParams;
  const especialidadSlug = params.get("especialidad");
  const medicoId = params.get("medico");
  const desde = params.get("desde");
  const hasta = params.get("hasta");

  if (!especialidadSlug || !desde || !hasta) {
    return NextResponse.json({ error: "Faltan parámetros: especialidad, desde, hasta" }, { status: 400 });
  }

  try {
    const supabase = crearClienteServicio();
    const { data: especialidad, error } = await supabase.from("especialidades").select("id").eq("slug", especialidadSlug).single();
    if (error || !especialidad) throw new Error("Especialidad no encontrada");

    const dias = await obtenerDisponibilidad({
      especialidadId: especialidad.id,
      medicoId: medicoId ?? undefined,
      desde,
      hasta,
    });

    return NextResponse.json(
      dias.map((d) => ({
        fecha: d.fecha,
        franjas: d.franjas.map((f) => ({
          inicio: f.inicio,
          fin: f.fin,
          cupos_disponibles: f.cuposDisponibles,
          medico_id: f.medicoId,
          consultorio_id: f.consultorioId,
        })),
      }))
    );
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

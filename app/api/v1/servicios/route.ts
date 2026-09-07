import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { listarServiciosPublicos } from "@/lib/catalogo/publico";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  const especialidadSlug = new URL(request.url).searchParams.get("especialidad");
  if (!especialidadSlug) {
    return NextResponse.json({ error: "Falta el parámetro especialidad" }, { status: 400 });
  }

  try {
    const supabase = crearClienteServicio();
    const { data: especialidad, error } = await supabase.from("especialidades").select("id").eq("slug", especialidadSlug).maybeSingle();
    if (error) throw error;
    if (!especialidad) throw new Error("Especialidad no encontrada");

    const servicios = await listarServiciosPublicos(especialidad.id, "bot");
    return NextResponse.json(
      servicios.map((s) => ({
        id: s.id,
        descripcion: s.descripcion,
        duracion_min: s.duracion_min,
        requiere_aprobacion: s.requiere_aprobacion,
        preparacion_previa: s.preparacion_previa,
        precio: s.precio,
      }))
    );
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { listarEspecialidadesPublicas } from "@/lib/catalogo/publico";

export async function GET(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const especialidades = await listarEspecialidadesPublicas("bot");
    return NextResponse.json(
      especialidades.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        slug: e.slug,
        duracion_min: e.duracion_min,
        modo: e.modo,
        requiere_aprobacion: e.requiere_aprobacion,
      }))
    );
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

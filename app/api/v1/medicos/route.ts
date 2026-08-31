import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { listarMedicosPublicos } from "@/lib/catalogo/publico";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  const especialidadSlug = new URL(request.url).searchParams.get("especialidad");
  if (!especialidadSlug) {
    return NextResponse.json({ error: "Falta el parámetro especialidad" }, { status: 400 });
  }

  try {
    const medicos = await listarMedicosPublicos(especialidadSlug);
    const supabase = crearClienteServicio();

    const conEspecialidades = await Promise.all(
      medicos.map(async (m) => {
        const { data: vinculos } = await supabase
          .from("medico_especialidad")
          .select("especialidad:especialidades(nombre, slug)")
          .eq("medico_id", m.id);
        return {
          id: m.id,
          nombres: m.nombres,
          apellidos: m.apellidos,
          titulo: m.titulo,
          especialidades: (vinculos ?? []).map((v) => v.especialidad).filter(Boolean),
        };
      })
    );

    return NextResponse.json(conEspecialidades);
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

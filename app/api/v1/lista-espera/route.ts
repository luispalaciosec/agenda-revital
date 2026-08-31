import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { agregarAListaEsperaPublica } from "@/lib/citas/lista-espera-publica";

export async function POST(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const body = await request.json();
    const resultado = await agregarAListaEsperaPublica({
      pacienteId: body.paciente_id,
      especialidadId: body.especialidad_id,
      medicoId: body.medico_id,
      fechaDeseada: body.fecha_deseada,
    });
    return NextResponse.json({ id: resultado.id }, { status: 201 });
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

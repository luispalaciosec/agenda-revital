import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { buscarPacientePublico } from "@/lib/citas/buscar-paciente-publico";

export async function POST(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const body = await request.json();
    const resultado = await buscarPacientePublico(body.documento, body.celular);
    return NextResponse.json({
      encontrado: resultado.encontrado,
      paciente: resultado.paciente,
      pacientes_vinculados: resultado.pacientesVinculados,
    });
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

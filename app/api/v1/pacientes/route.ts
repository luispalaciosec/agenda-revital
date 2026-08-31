import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { registrarPacientePublico } from "@/lib/citas/registrar-paciente-publico";

export async function POST(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const body = await request.json();
    const resultado = await registrarPacientePublico({
      canal: "bot",
      tipoDocumento: body.tipo_documento,
      documento: body.documento,
      nombres: body.nombres,
      apellidos: body.apellidos,
      fechaNacimiento: body.fecha_nacimiento,
      correo: body.correo,
      celular: body.celular,
      representanteDocumento: body.representante?.documento,
      representanteNombres: body.representante?.nombres,
      representanteParentesco: body.representante?.parentesco,
      consentimientoTratamientoDatos: body.consentimientos?.tratamiento_datos ?? false,
      consentimientoMarketing: body.consentimientos?.marketing ?? false,
    });
    return NextResponse.json({ paciente_id: resultado.pacienteId, contacto_id: resultado.contactoId }, { status: 201 });
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

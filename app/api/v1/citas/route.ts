import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { crearCitaPublica } from "@/lib/citas/crear-publica";
import { listarCitasPorContacto } from "@/lib/citas/listar-publicas";
import { mensajeParaPaciente } from "@/lib/citas/mensaje-paciente";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export async function POST(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  const idempotencyKey = request.headers.get("idempotency-key");
  const supabase = crearClienteServicio();

  try {
    if (idempotencyKey) {
      const { data: existente } = await supabase
        .from("idempotencia_citas")
        .select("respuesta")
        .eq("llave", idempotencyKey)
        .maybeSingle();
      if (existente) return NextResponse.json(existente.respuesta);
    }

    const body = await request.json();
    const cita = await crearCitaPublica({
      canal: "bot",
      celular: body.contacto_celular ?? body.celular,
      especialidadId: body.especialidad_id,
      medicoId: body.medico_id ?? null,
      consultorioId: body.consultorio_id ?? null,
      servicioId: body.servicio_id,
      inicio: body.inicio,
      fin: body.fin,
      pacienteId: body.paciente_id,
      pacienteNuevo: body.paciente_nuevo,
      consentimientoMarketing: body.consentimiento_marketing ?? false,
      atribucion: body.atribucion
        ? {
            utmSource: body.atribucion.utm_source,
            utmMedium: body.atribucion.utm_medium,
            utmCampaign: body.atribucion.utm_campaign,
            utmContent: body.atribucion.utm_content,
            utmTerm: body.atribucion.utm_term,
            fbclid: body.atribucion.fbclid,
            gclid: body.atribucion.gclid,
            ttclid: body.atribucion.ttclid,
          }
        : undefined,
    });

    const respuesta = {
      cita_id: cita.id,
      codigo_publico: cita.codigo_publico,
      estado: cita.estado,
      mensaje_para_paciente: mensajeParaPaciente(cita.estado, cita.codigo_publico),
    };

    if (idempotencyKey) {
      await supabase.from("idempotencia_citas").insert({ llave: idempotencyKey, cita_id: cita.id, respuesta });
    }

    return NextResponse.json(respuesta, { status: 201 });
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

export async function GET(request: Request) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  const params = new URL(request.url).searchParams;
  const celular = params.get("contacto");
  if (!celular) return NextResponse.json({ error: "Falta el parámetro contacto" }, { status: 400 });

  try {
    const soloActivas = params.get("estado") === "activas";
    const citas = await listarCitasPorContacto(celular, soloActivas);
    return NextResponse.json(citas);
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

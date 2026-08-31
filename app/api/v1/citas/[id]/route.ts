import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { obtenerCitaPublica } from "@/lib/citas/listar-publicas";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const { id } = await params;
    const cita = await obtenerCitaPublica(id);
    if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    return NextResponse.json(cita);
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

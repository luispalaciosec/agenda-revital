import { NextResponse } from "next/server";
import { autenticarApi } from "@/lib/seguridad/autenticar-api";
import { respuestaErrorApi } from "@/lib/seguridad/manejador-api";
import { cancelarCitaPublica } from "@/lib/citas/cancelar-publica";
import { crearClienteServicio } from "@/lib/supabase/service-role";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autenticarApi(request);
  if (!auth.ok) return auth.respuesta;

  try {
    const { id } = await params;
    const supabase = crearClienteServicio();
    const { data: cita, error } = await supabase.from("citas").select("contacto_id").eq("id", id).single();
    if (error || !cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    await cancelarCitaPublica(id, cita.contacto_id, body.motivo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaErrorApi(error);
  }
}

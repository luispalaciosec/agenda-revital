import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResumenAtribucion {
  totalCitas: number;
  dePauta: number;
  organicas: number;
  porPlataforma: { plataforma: string; total: number }[];
}

function plataformaDeCita(cita: { fbclid: string | null; gclid: string | null; ttclid: string | null; ctwa_clid: string | null; utm_source: string | null }): string | null {
  if (cita.ctwa_clid || cita.fbclid) return "Meta";
  if (cita.gclid) return "Google";
  if (cita.ttclid) return "TikTok";
  if (cita.utm_source) return cita.utm_source;
  return null;
}

/** Clasifica las citas creadas en el rango (por fecha de creación, no de la cita) entre pauta y orgánicas. */
export async function calcularResumenAtribucion(desde: string, hasta: string): Promise<ResumenAtribucion> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("citas")
    .select("fbclid, gclid, ttclid, ctwa_clid, utm_source, creado_en")
    .gte("creado_en", `${desde}T00:00:00`)
    .lte("creado_en", `${hasta}T23:59:59`);
  if (error) throw error;

  const citas = data ?? [];
  const conteoPorPlataforma = new Map<string, number>();
  let dePauta = 0;

  for (const cita of citas) {
    const plataforma = plataformaDeCita(cita);
    if (plataforma) {
      dePauta++;
      conteoPorPlataforma.set(plataforma, (conteoPorPlataforma.get(plataforma) ?? 0) + 1);
    }
  }

  return {
    totalCitas: citas.length,
    dePauta,
    organicas: citas.length - dePauta,
    porPlataforma: Array.from(conteoPorPlataforma.entries())
      .map(([plataforma, total]) => ({ plataforma, total }))
      .sort((a, b) => b.total - a.total),
  };
}

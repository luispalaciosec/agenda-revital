import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";

/**
 * Ventana fija atómica, resuelta en Postgres (verificar_limite_tasa) para
 * que dos requests concurrentes del mismo identificador no se pisen.
 */
export async function permitirPorLimiteTasa(
  identificador: string,
  limite: number,
  ventanaSegundos: number
): Promise<boolean> {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase.rpc("verificar_limite_tasa", {
    p_identificador: identificador,
    p_limite: limite,
    p_ventana_segundos: ventanaSegundos,
  });
  if (error) throw error;
  return data ?? false;
}

export function obtenerIp(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconocida";
}

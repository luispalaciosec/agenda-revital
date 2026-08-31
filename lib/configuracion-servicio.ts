import "server-only";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import type { Json } from "@/lib/supabase/database.types";

/** Lectura de configuración sin sesión (cron, automatizaciones) — service role, sin RLS de por medio. */
export async function leerConfiguracionServicio(claves: string[]): Promise<Map<string, Json>> {
  const supabase = crearClienteServicio();
  const { data, error } = await supabase.from("configuracion").select("clave, valor").in("clave", claves);
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.clave, c.valor]));
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente con service role: ignora RLS por completo. Solo para
 * /api/v1 (el bot no tiene sesión Supabase, se autentica con su propia
 * API key) y para jobs programados. `import "server-only"` hace que el
 * build falle si esto termina importado desde un Client Component.
 */
export function crearClienteServicio() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

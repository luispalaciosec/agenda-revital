import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Cliente de navegador para Client Components del panel (login, etc). */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

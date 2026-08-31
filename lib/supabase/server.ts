import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cliente para Server Components y route handlers del panel. Usa la
 * publishable key y la sesión del usuario autenticado (cookies), así que
 * respeta RLS como ese usuario. Para /api/v1 y jobs sin sesión, usar
 * lib/supabase/service-role.ts en su lugar.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component: middleware.ts refresca
            // la sesión en su lugar. Ver https://supabase.com/docs/guides/auth/server-side/nextjs
          }
        },
      },
    }
  );
}

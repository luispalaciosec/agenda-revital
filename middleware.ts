import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Solo el panel usa sesión de Supabase Auth. La web pública y /api/v1
  // no la necesitan (OTP y API key respectivamente).
  matcher: ["/panel/:path*"],
};

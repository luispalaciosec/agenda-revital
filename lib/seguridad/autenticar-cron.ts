import "server-only";
import { NextResponse } from "next/server";

/**
 * Vercel Cron manda `Authorization: Bearer $CRON_SECRET` cuando la
 * variable de entorno CRON_SECRET está configurada en el proyecto. En
 * desarrollo, sin esa variable, se permite para poder probar el cron a
 * mano; en producción sin CRON_SECRET, se rechaza todo por seguridad
 * (fail closed) en vez de dejar el endpoint abierto por accidente.
 */
export function autenticarCron(request: Request): NextResponse | null {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    if (process.env.NODE_ENV !== "production") return null;
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

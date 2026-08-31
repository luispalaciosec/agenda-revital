import "server-only";
import { NextResponse } from "next/server";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { hashApiKey } from "./api-keys";
import { obtenerIp, permitirPorLimiteTasa } from "./limite-tasa";

const LIMITE_POR_MINUTO = 60;

export interface ContextoApi {
  apiKeyId: string;
}

type ResultadoAuth = { ok: true; contexto: ContextoApi } | { ok: false; respuesta: NextResponse };

/**
 * Autenticación + rate limiting del API v1 (§6.2, §13): llave por header
 * X-API-Key, revocable de forma independiente por consumidor, con límite
 * de tasa por llave además del límite general del endpoint.
 */
export async function autenticarApi(request: Request): Promise<ResultadoAuth> {
  const llave = request.headers.get("x-api-key");
  if (!llave) {
    return { ok: false, respuesta: NextResponse.json({ error: "Falta el header X-API-Key" }, { status: 401 }) };
  }

  const supabase = crearClienteServicio();
  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id, activa")
    .eq("llave_hash", hashApiKey(llave))
    .maybeSingle();

  if (!apiKey || !apiKey.activa) {
    return { ok: false, respuesta: NextResponse.json({ error: "Llave de API inválida o revocada" }, { status: 401 }) };
  }

  const permitido = await permitirPorLimiteTasa(`api:${apiKey.id}`, LIMITE_POR_MINUTO, 60);
  if (!permitido) {
    return { ok: false, respuesta: NextResponse.json({ error: "Demasiadas solicitudes, intenta en un momento" }, { status: 429 }) };
  }

  await supabase.from("api_keys").update({ ultimo_uso_en: new Date().toISOString() }).eq("id", apiKey.id);

  return { ok: true, contexto: { apiKeyId: apiKey.id } };
}

export async function limitarPorIp(request: Request, recurso: string, limite: number, ventanaSegundos: number) {
  const ip = obtenerIp(request);
  const permitido = await permitirPorLimiteTasa(`${recurso}:${ip}`, limite, ventanaSegundos);
  if (!permitido) {
    return NextResponse.json({ error: "Demasiadas solicitudes, intenta en un momento" }, { status: 429 });
  }
  return null;
}

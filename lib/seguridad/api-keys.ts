import "server-only";
import { randomBytes, createHash } from "crypto";

const PREFIJO = "rvt_live_";

export function generarApiKey(): { llave: string; prefijo: string; hash: string } {
  const cuerpo = randomBytes(24).toString("base64url");
  const llave = `${PREFIJO}${cuerpo}`;
  return { llave, prefijo: llave.slice(0, 16), hash: hashApiKey(llave) };
}

export function hashApiKey(llave: string): string {
  return createHash("sha256").update(llave).digest("hex");
}

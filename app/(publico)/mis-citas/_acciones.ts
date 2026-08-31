"use server";

import { headers } from "next/headers";
import { solicitarEnlaceMagico } from "@/lib/enlaces-magicos/enlaces-magicos";

export async function accionSolicitarEnlaceMagico(celular: string) {
  try {
    const listaEncabezados = await headers();
    const origen = listaEncabezados.get("origin") ?? `https://${listaEncabezados.get("host")}`;
    const { tokenDev } = await solicitarEnlaceMagico(celular, origen);
    return { ok: true as const, tokenDev };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo enviar el enlace." };
  }
}

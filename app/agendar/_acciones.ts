"use server";

import { headers } from "next/headers";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";
import { buscarPacientePublico } from "@/lib/citas/buscar-paciente-publico";
import { crearCitaPublica, type EntradaCrearCitaPublica } from "@/lib/citas/crear-publica";
import { solicitarOtp, verificarOtp, confirmarOtpVerificado } from "@/lib/otp/otp";
import { listarMedicosPublicosPorEspecialidadId, listarServiciosPublicos } from "@/lib/catalogo/publico";

export async function accionListarMedicosWeb(especialidadId: string) {
  return listarMedicosPublicosPorEspecialidadId(especialidadId);
}

export async function accionListarServiciosWeb(especialidadId: string) {
  return listarServiciosPublicos(especialidadId, "web");
}

export async function accionObtenerFranjasWeb(especialidadId: string, medicoId: string | null, fecha: string) {
  const dias = await obtenerDisponibilidad({ especialidadId, medicoId: medicoId ?? undefined, desde: fecha, hasta: fecha });
  return dias[0]?.franjas ?? [];
}

export async function accionBuscarPacienteWeb(documento: string) {
  if (!documento.trim()) return null;
  try {
    const r = await buscarPacientePublico(documento.trim());
    return r.paciente;
  } catch {
    return null;
  }
}

export async function accionSolicitarOtpWeb(celular: string) {
  try {
    const { otpId, codigoDev } = await solicitarOtp(celular);
    return { ok: true as const, otpId, codigoDev };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo enviar el código." };
  }
}

type EntradaConfirmar = Omit<EntradaCrearCitaPublica, "canal"> & { otpId: string };

export async function accionConfirmarCitaWeb(entrada: EntradaConfirmar) {
  try {
    await verificarOtpOFalla(entrada.otpId, entrada.celular);

    const listaEncabezados = await headers();
    const referrer = listaEncabezados.get("referer") ?? undefined;

    const cita = await crearCitaPublica({ ...entrada, canal: "web", atribucion: { ...entrada.atribucion, referrer } });
    return { ok: true as const, cita };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "No se pudo crear la cita." };
  }
}

export async function accionVerificarCodigoOtp(otpId: string, celular: string, codigo: string) {
  try {
    await verificarOtp(otpId, celular, codigo);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, mensaje: error instanceof Error ? error.message : "Código incorrecto." };
  }
}

async function verificarOtpOFalla(otpId: string, celular: string) {
  const verificado = await confirmarOtpVerificado(otpId, celular);
  if (!verificado) throw new Error("Verifica el código antes de confirmar la cita.");
}

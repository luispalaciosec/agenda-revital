import { formatoFechaDMY, formatoFechaHoraDMY, formatoHora } from "./formato";

/**
 * Bloque de texto para pegar en el ERP viejo mientras Revital sale de él
 * (§8.3). No es un endpoint ni una integración: las admisionistas van a
 * digitar en los dos sistemas por un tiempo, y esto les ahorra
 * retipear el mismo dato dos veces.
 */
export interface DatosParaErp {
  codigoPublico: string | null;
  inicio: string;
  fin: string;
  especialidad: string | null;
  servicio: string | null;
  medico: string | null;
  precioAplicado: string | number | null;
  paciente: {
    nombres: string;
    apellidos: string;
    tipoDocumento: "cedula" | "pasaporte";
    documento: string;
    fechaNacimiento: string;
    correo: string | null;
  } | null;
  celular: string | null;
}

export function textoParaErp(d: DatosParaErp): string {
  const lineas = [
    `Paciente: ${d.paciente ? `${d.paciente.nombres} ${d.paciente.apellidos}` : "—"}`,
    `Documento: ${d.paciente ? `${d.paciente.tipoDocumento === "cedula" ? "Cédula" : "Pasaporte"} ${d.paciente.documento}` : "—"}`,
    `Fecha de nacimiento: ${d.paciente ? formatoFechaDMY(d.paciente.fechaNacimiento) : "—"}`,
    `Celular: ${d.celular ?? "—"}`,
    `Correo: ${d.paciente?.correo ?? "—"}`,
    "",
    `Especialidad: ${d.especialidad ?? "—"}`,
    `Servicio: ${d.servicio ?? "—"}`,
    `Médico: ${d.medico ?? "—"}`,
    `Fecha: ${formatoFechaHoraDMY(d.inicio)}`,
    `Hora: ${formatoHora(d.inicio)}–${formatoHora(d.fin)}`,
    `Precio: $${d.precioAplicado ?? "—"}`,
    `Código Agenda Revital: ${d.codigoPublico ?? "—"}`,
  ];
  return lineas.join("\n");
}

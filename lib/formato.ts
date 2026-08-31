/**
 * Formato para mostrar en pantalla. No es lógica de negocio (eso vive en
 * lib/disponibilidad) — solo convierte instantes UTC a texto legible en
 * America/Guayaquil.
 */

export function formatoHora(iso: string): string {
  const desplazado = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return desplazado.toISOString().slice(11, 16);
}

export function formatoFechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date(`${fecha}T12:00:00-05:00`));
  // Intl devuelve todo en minúsculas ("domingo, 30 de agosto de 2026");
  // solo la primera letra debe ir en mayúscula, nunca cada palabra.
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function hoyGuayaquil(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatoFechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Guayaquil",
  }).format(new Date(`${fecha}T12:00:00-05:00`));
}

/** DD/MM/AAAA, para textos que se pegan en otro sistema (§8.3). */
export function formatoFechaDMY(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function formatoFechaHoraDMY(iso: string): string {
  const desplazado = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return formatoFechaDMY(desplazado.toISOString().slice(0, 10));
}


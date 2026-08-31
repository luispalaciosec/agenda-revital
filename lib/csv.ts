/**
 * CSV, no .xlsx real: Excel lo abre nativo sin drama y evita sumar una
 * dependencia (el paquete `xlsx` de npm trae vulnerabilidades altas
 * conocidas -- prototype pollution y ReDoS -- en su ruta de lectura;
 * más simple no traerla si solo necesitamos escribir).
 */
export function aCsv(filas: Record<string, string | number | null>[]): string {
  if (filas.length === 0) return "";
  const columnas = Object.keys(filas[0]);
  const escapar = (valor: string | number | null) => {
    const texto = valor === null || valor === undefined ? "" : String(valor);
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const encabezado = columnas.join(",");
  const filasTexto = filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(","));
  return [encabezado, ...filasTexto].join("\n");
}

export function descargarCsv(nombreArchivo: string, contenido: string) {
  // BOM UTF-8: sin esto Excel en Windows muestra mal las tildes.
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

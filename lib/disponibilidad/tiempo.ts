/**
 * America/Guayaquil es UTC-5 fijo, sin horario de verano (§2.3). Eso deja
 * usar un offset constante en vez de una librería de zonas horarias: es
 * determinista y no depende de la tzdata del runtime, lo que importa para
 * que las pruebas del motor no dependan de dónde corren.
 */
const OFFSET_GUAYAQUIL = "-05:00";

/** Combina fecha y hora locales de Guayaquil en un instante UTC. */
export function aUtc(fecha: string, hora: string): Date {
  const horaCompleta = hora.length === 5 ? `${hora}:00` : hora;
  return new Date(`${fecha}T${horaCompleta}${OFFSET_GUAYAQUIL}`);
}

export interface PartesLocales {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss
  diaSemana: number; // 1=lunes ... 7=domingo (ISO)
}

/** Descompone un instante UTC en fecha/hora/día de semana locales de Guayaquil. */
export function aLocal(instante: Date): PartesLocales {
  const desplazado = new Date(instante.getTime() - 5 * 60 * 60 * 1000);
  const fecha = desplazado.toISOString().slice(0, 10);
  const hora = desplazado.toISOString().slice(11, 19);
  const diaSemanaDomingo0 = desplazado.getUTCDay(); // 0=domingo
  const diaSemana = diaSemanaDomingo0 === 0 ? 7 : diaSemanaDomingo0;
  return { fecha, hora, diaSemana };
}

export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(anio, mes - 1, dia));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

export function compararFechas(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compararHoras(a: string, b: string): number {
  const norm = (h: string) => (h.length === 5 ? `${h}:00` : h);
  const na = norm(a);
  const nb = norm(b);
  return na < nb ? -1 : na > nb ? 1 : 0;
}

/** Rango de fechas [desde, hasta] inclusive, como array de "YYYY-MM-DD". */
export function rangoFechas(desde: string, hasta: string): string[] {
  const fechas: string[] = [];
  let cursor = desde;
  while (compararFechas(cursor, hasta) <= 0) {
    fechas.push(cursor);
    cursor = sumarDias(cursor, 1);
  }
  return fechas;
}

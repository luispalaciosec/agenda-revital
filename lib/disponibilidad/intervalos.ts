/** Aritmética de intervalos de tiempo, en minutos desde medianoche. */

export type Intervalo = readonly [number, number]; // [inicio, fin), minutos

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAHora(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

/** Intersección de dos intervalos, o null si no se solapan. */
export function intersectar(a: Intervalo, b: Intervalo): Intervalo | null {
  const inicio = Math.max(a[0], b[0]);
  const fin = Math.min(a[1], b[1]);
  return inicio < fin ? [inicio, fin] : null;
}

/**
 * Resta `quitar` de `base`. Puede partir `base` en dos pedazos (bloqueo a
 * mitad de jornada) o dejarlo intacto, vacío, o recortado por un lado.
 */
export function restar(base: Intervalo, quitar: Intervalo): Intervalo[] {
  const solape = intersectar(base, quitar);
  if (!solape) return [base];

  const resultado: Intervalo[] = [];
  if (base[0] < solape[0]) resultado.push([base[0], solape[0]]);
  if (solape[1] < base[1]) resultado.push([solape[1], base[1]]);
  return resultado;
}

/** Resta una lista de intervalos ocupados de un intervalo base. */
export function restarVarios(base: Intervalo, ocupados: Intervalo[]): Intervalo[] {
  let libres: Intervalo[] = [base];
  for (const ocupado of ocupados) {
    libres = libres.flatMap((intervalo) => restar(intervalo, ocupado));
  }
  return libres;
}

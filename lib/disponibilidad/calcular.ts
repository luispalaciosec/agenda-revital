import { horaAMinutos, minutosAHora, intersectar, restarVarios, type Intervalo } from "./intervalos";
import { aUtc, aLocal, rangoFechas, compararFechas } from "./tiempo";
import type {
  ContextoDisponibilidad,
  DisponibilidadDia,
  ExcepcionDisponibilidad,
  FranjaDisponible,
  HorarioDisponibilidad,
  ParametrosDisponibilidad,
} from "./tipos";

/**
 * Motor de disponibilidad (§4.2). Función pura: toda la data ya
 * resuelta llega en `contexto`, así se prueba con fixtures sin tocar la
 * base de datos. El orquestador que sí llama a Supabase vive en index.ts.
 *
 * Pasos, en el mismo orden que la especificación:
 *   1. Horarios vigentes del médico/especialidad para la fecha.
 *   2. Restar excepciones_agenda que apliquen.
 *   3. Recortar contra el horario general de la sede (techo).
 *   4. Generar franjas según modo/duración/cupos.
 *   5. Descontar citas ya existentes en estado activo.
 *   6. Aplicar anticipación mínima y máxima.
 *   7. Si validar_consultorios está activo, descartar franjas en choque.
 */
export function calcularDisponibilidad(
  params: ParametrosDisponibilidad,
  contexto: ContextoDisponibilidad
): DisponibilidadDia[] {
  const horariosRelevantes = contexto.horarios.filter(
    (h) =>
      h.especialidadId === params.especialidadId &&
      h.modo !== "solicitud" && // no genera cupos (§4.2)
      (!params.medicoId || h.medicoId === params.medicoId)
  );

  const limiteMinimo = new Date(
    contexto.ahora.getTime() + contexto.configuracion.anticipacionMinimaHoras * 60 * 60 * 1000
  );
  const limiteMaximo = new Date(
    contexto.ahora.getTime() + contexto.configuracion.anticipacionMaximaDias * 24 * 60 * 60 * 1000
  );

  const dias: DisponibilidadDia[] = [];

  for (const fecha of rangoFechas(params.desde, params.hasta)) {
    const local = aLocal(aUtc(fecha, "12:00")); // mediodía: evita bordes de DST inexistentes, solo para leer día de semana
    const diaSemana = local.diaSemana;

    const ventanaSede = ventanaSedeDelDia(contexto, fecha, diaSemana);
    if (!ventanaSede) continue; // domingo, feriado de sede, o cerrado por excepción de día completo

    let franjasDelDia: FranjaDisponible[] = [];

    for (const horario of horariosRelevantes) {
      if (horario.diaSemana !== diaSemana) continue;
      if (compararFechas(horario.vigenteDesde, fecha) > 0) continue;
      if (horario.vigenteHasta && compararFechas(horario.vigenteHasta, fecha) < 0) continue;

      const ventanaHorario: Intervalo = [horaAMinutos(horario.horaInicio), horaAMinutos(horario.horaFin)];
      const recortada = intersectar(ventanaHorario, ventanaSede);
      if (!recortada) continue; // el horario del médico cae fuera del horario del centro

      const bloqueos = excepcionesComoIntervalos(contexto.excepciones, horario, fecha);
      const libres = restarVarios(recortada, bloqueos);

      for (const libre of libres) {
        franjasDelDia.push(...generarSlots(horario, libre, fecha));
      }
    }

    if (contexto.configuracion.validarConsultorios) {
      franjasDelDia = descartarChoquesDeConsultorio(franjasDelDia);
    }

    const franjasConCupo = franjasDelDia
      .map((franja) => ({
        ...franja,
        cuposDisponibles: franja.cuposDisponibles - contarOcupacion(contexto, franja),
      }))
      .filter((franja) => franja.cuposDisponibles > 0)
      .filter((franja) => {
        const inicio = new Date(franja.inicio);
        return inicio >= limiteMinimo && inicio <= limiteMaximo;
      })
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    if (franjasConCupo.length > 0) {
      dias.push({ fecha, franjas: franjasConCupo });
    }
  }

  return dias;
}

/** Ventana [apertura, cierre] de la sede para el día, o null si está cerrada. */
function ventanaSedeDelDia(
  contexto: ContextoDisponibilidad,
  fecha: string,
  diaSemana: number
): Intervalo | null {
  if (diaSemana === 7) return null; // domingo cerrado (§4.4)

  const base: Intervalo | null =
    diaSemana === 6
      ? contexto.sede.horaAperturaSab && contexto.sede.horaCierreSab
        ? [horaAMinutos(contexto.sede.horaAperturaSab), horaAMinutos(contexto.sede.horaCierreSab)]
        : null
      : [horaAMinutos(contexto.sede.horaAperturaLv), horaAMinutos(contexto.sede.horaCierreLv)];

  if (!base) return null;

  const excepcionesSede = contexto.excepciones.filter(
    (e) => e.alcance === "sede" && (e.sedeId === contexto.sedeId || e.sedeId === null) && cubreFecha(e, fecha)
  );

  if (excepcionesSede.some((e) => e.horaInicio === null)) return null; // feriado de día completo

  const bloqueos = excepcionesSede.map(
    (e): Intervalo => [horaAMinutos(e.horaInicio!), horaAMinutos(e.horaFin!)]
  );
  const libres = restarVarios(base, bloqueos);
  // La sede puede quedar con varias ventanas libres tras un bloqueo a
  // media jornada; para el "techo" del §4.2 alcanza con la envolvente
  // porque cada horario individual se recorta igual más abajo.
  if (libres.length === 0) return null;
  return [libres[0][0], libres[libres.length - 1][1]];
}

function cubreFecha(e: { fechaDesde: string; fechaHasta: string }, fecha: string): boolean {
  return compararFechas(e.fechaDesde, fecha) <= 0 && compararFechas(e.fechaHasta, fecha) >= 0;
}

function excepcionesComoIntervalos(
  excepciones: ExcepcionDisponibilidad[],
  horario: HorarioDisponibilidad,
  fecha: string
): Intervalo[] {
  const aplica = excepciones.filter((e) => {
    if (!cubreFecha(e, fecha)) return false;
    if (e.alcance === "medico") return e.medicoId === horario.medicoId && horario.medicoId !== null;
    if (e.alcance === "consultorio")
      return e.consultorioId === horario.consultorioId && horario.consultorioId !== null;
    return false; // 'sede' ya se aplicó al calcular la ventana de la sede
  });

  return aplica.map((e): Intervalo => {
    if (e.horaInicio === null) return [0, 24 * 60]; // día completo
    return [horaAMinutos(e.horaInicio), horaAMinutos(e.horaFin!)];
  });
}

function generarSlots(horario: HorarioDisponibilidad, libre: Intervalo, fecha: string): FranjaDisponible[] {
  const slots: FranjaDisponible[] = [];
  let cursor = libre[0];
  while (cursor + horario.duracionMin <= libre[1]) {
    const inicio = aUtc(fecha, minutosAHora(cursor));
    const fin = aUtc(fecha, minutosAHora(cursor + horario.duracionMin));
    slots.push({
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      cuposDisponibles: horario.cuposPorBloque,
      medicoId: horario.medicoId,
      consultorioId: horario.consultorioId,
      especialidadId: horario.especialidadId,
    });
    cursor += horario.duracionMin;
  }
  return slots;
}

/** Misma identidad de recurso que usa el índice único anti-sobrecupo de la base. */
function identidadRecurso(medicoId: string | null, especialidadId: string): string {
  return medicoId ?? especialidadId;
}

function contarOcupacion(contexto: ContextoDisponibilidad, franja: FranjaDisponible): number {
  const identidadFranja = identidadRecurso(franja.medicoId, franja.especialidadId);
  return contexto.citasActivas.filter((cita) => {
    const identidadCita = identidadRecurso(cita.medicoId, cita.especialidadId);
    return identidadCita === identidadFranja && cita.inicio === franja.inicio;
  }).length;
}

/**
 * §16: si validar_consultorios está activo, dos médicos con horario en el
 * mismo consultorio y horas que se solapan el mismo día no pueden ofrecer
 * ambas franjas — sin el mapa real no hay forma de saber a quién le
 * corresponde, así que se descartan ambas y la admisionista resuelve.
 */
function descartarChoquesDeConsultorio(franjas: FranjaDisponible[]): FranjaDisponible[] {
  const enChoque = new Set<number>();

  for (let i = 0; i < franjas.length; i++) {
    for (let j = i + 1; j < franjas.length; j++) {
      const a = franjas[i];
      const b = franjas[j];
      if (!a.consultorioId || a.consultorioId !== b.consultorioId) continue;
      if (a.medicoId === b.medicoId) continue;
      const solapan = a.inicio < b.fin && b.inicio < a.fin;
      if (solapan) {
        enChoque.add(i);
        enChoque.add(j);
      }
    }
  }

  return franjas.filter((_, i) => !enChoque.has(i));
}

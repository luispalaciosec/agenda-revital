/**
 * Tipos del motor de disponibilidad (§4.2). Son un subconjunto plano de
 * las columnas reales de horarios/excepciones_agenda/citas/sedes — el
 * cálculo es puro y no conoce Supabase, así se prueba con fixtures en
 * vez de una base de datos.
 */

export type ModoAgenda = "exacto" | "bloque" | "solicitud";

export type AlcanceExcepcion = "sede" | "medico" | "consultorio";

/** "HH:mm" o "HH:mm:ss", siempre hora local de Guayaquil. */
export type HoraLocal = string;

/** "YYYY-MM-DD" */
export type FechaLocal = string;

export interface HorarioDisponibilidad {
  id: string;
  medicoId: string | null;
  especialidadId: string;
  consultorioId: string | null;
  diaSemana: number; // 1=lunes ... 7=domingo (ISO)
  horaInicio: HoraLocal;
  horaFin: HoraLocal;
  modo: ModoAgenda;
  duracionMin: number;
  cuposPorBloque: number;
  vigenteDesde: FechaLocal;
  vigenteHasta: FechaLocal | null;
}

export interface ExcepcionDisponibilidad {
  alcance: AlcanceExcepcion;
  medicoId: string | null;
  consultorioId: string | null;
  sedeId: string | null;
  fechaDesde: FechaLocal;
  fechaHasta: FechaLocal;
  /** null en ambos = día completo. */
  horaInicio: HoraLocal | null;
  horaFin: HoraLocal | null;
}

/** Cita ya tomada que ocupa un cupo (estado solicitada/en_gestion/confirmada). */
export interface CitaOcupacion {
  medicoId: string | null;
  especialidadId: string;
  /** ISO UTC. */
  inicio: string;
}

export interface HorarioSede {
  horaAperturaLv: HoraLocal;
  horaCierreLv: HoraLocal;
  horaAperturaSab: HoraLocal | null;
  horaCierreSab: HoraLocal | null;
}

export interface ConfiguracionDisponibilidad {
  anticipacionMinimaHoras: number;
  anticipacionMaximaDias: number;
  /** §16: apagado por defecto hasta que llegue el mapa de consultorios. */
  validarConsultorios: boolean;
}

export interface ParametrosDisponibilidad {
  especialidadId: string;
  medicoId?: string;
  desde: FechaLocal;
  hasta: FechaLocal;
}

export interface FranjaDisponible {
  inicio: string; // ISO UTC
  fin: string; // ISO UTC
  cuposDisponibles: number;
  medicoId: string | null;
  consultorioId: string | null;
  /** Interno, para descontar ocupación por identidad de recurso (§ acuerdo del índice anti-sobrecupo). No forma parte del contrato público de /api/v1/disponibilidad. */
  especialidadId: string;
}

export interface DisponibilidadDia {
  fecha: FechaLocal;
  franjas: FranjaDisponible[];
}

export interface ContextoDisponibilidad {
  sedeId: string;
  sede: HorarioSede;
  /** Ya filtrados por especialidad (y médico, si se pidió) del lado del caller. */
  horarios: HorarioDisponibilidad[];
  excepciones: ExcepcionDisponibilidad[];
  citasActivas: CitaOcupacion[];
  configuracion: ConfiguracionDisponibilidad;
  /** Momento de referencia para anticipación mínima/máxima. Parámetro explícito, nunca `new Date()` interno, para que el cálculo sea puro y testeable. */
  ahora: Date;
}

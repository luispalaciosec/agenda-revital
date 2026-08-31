import { describe, expect, it } from "vitest";
import { calcularDisponibilidad } from "./calcular";
import { aUtc, aLocal, sumarDias } from "./tiempo";
import type {
  CitaOcupacion,
  ContextoDisponibilidad,
  ExcepcionDisponibilidad,
  HorarioDisponibilidad,
} from "./tipos";

/** Encuentra la primera fecha, desde `desde`, cuyo día ISO de semana sea el pedido. Evita asumir en qué día cae una fecha fija del calendario. */
function fechaConDia(diaSemanaObjetivo: number, desde = "2026-09-01"): string {
  for (let i = 0; i < 14; i++) {
    const fecha = sumarDias(desde, i);
    if (aLocal(aUtc(fecha, "12:00")).diaSemana === diaSemanaObjetivo) return fecha;
  }
  throw new Error(`No se encontró una fecha para el día de semana ${diaSemanaObjetivo}`);
}

const SEDE = { horaAperturaLv: "07:00", horaCierreLv: "17:30", horaAperturaSab: "07:30", horaCierreSab: "13:00" };

// Bien alejado de cualquier fecha usada en los tests, para que la
// anticipación no interfiera salvo en los tests que la ejercen a propósito.
const AHORA_NEUTRA = aUtc("2026-08-01", "08:00");

function contexto(overrides: Partial<ContextoDisponibilidad> = {}): ContextoDisponibilidad {
  return {
    sedeId: "sede-1",
    sede: SEDE,
    horarios: [],
    excepciones: [],
    citasActivas: [],
    configuracion: { anticipacionMinimaHoras: 3, anticipacionMaximaDias: 60, validarConsultorios: false },
    ahora: AHORA_NEUTRA,
    ...overrides,
  };
}

function horario(overrides: Partial<HorarioDisponibilidad> = {}): HorarioDisponibilidad {
  return {
    id: "h1",
    medicoId: "medico-1",
    especialidadId: "esp-1",
    consultorioId: "cons-1",
    diaSemana: 1,
    horaInicio: "08:00",
    horaFin: "09:00",
    modo: "exacto",
    duracionMin: 20,
    cuposPorBloque: 1,
    vigenteDesde: "2026-01-01",
    vigenteHasta: null,
    ...overrides,
  };
}

describe("generación de franjas por modo", () => {
  it("modo exacto genera un slot por cada duracion_min dentro de la ventana", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({ horarios: [horario({ diaSemana: 1, horaInicio: "08:00", horaFin: "09:00", duracionMin: 20 })] })
    );

    expect(dias).toHaveLength(1);
    expect(dias[0].franjas.map((f) => f.inicio)).toEqual([
      aUtc(lunes, "08:00").toISOString(),
      aUtc(lunes, "08:20").toISOString(),
      aUtc(lunes, "08:40").toISOString(),
    ]);
    expect(dias[0].franjas.every((f) => f.cuposDisponibles === 1)).toBe(true);
  });

  it("modo bloque genera slots con la capacidad de cupos_por_bloque", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [
          horario({ diaSemana: 1, horaInicio: "10:00", horaFin: "11:00", modo: "bloque", duracionMin: 60, cuposPorBloque: 3 }),
        ],
      })
    );

    expect(dias[0].franjas).toHaveLength(1);
    expect(dias[0].franjas[0].cuposDisponibles).toBe(3);
  });

  it("modo solicitud no genera franjas: no crea cupos (§4.2)", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({ horarios: [horario({ diaSemana: 1, modo: "solicitud" })] })
    );
    expect(dias).toHaveLength(0);
  });
});

describe("techo del horario de la sede", () => {
  it("recorta un horario de médico que empieza antes de que abra la sede", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, horaInicio: "06:00", horaFin: "08:00", duracionMin: 60 })],
      })
    );
    // sede abre 07:00 → un solo slot de 60 min: 07:00-08:00
    expect(dias[0].franjas).toHaveLength(1);
    expect(dias[0].franjas[0].inicio).toBe(aUtc(lunes, "07:00").toISOString());
  });

  it("domingo cerrado: nunca genera franjas aunque el médico tenga horario cargado", () => {
    const domingo = fechaConDia(7);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: domingo, hasta: domingo },
      contexto({ horarios: [horario({ diaSemana: 7 })] })
    );
    expect(dias).toHaveLength(0);
  });

  it("sábado usa el horario reducido de la sede, no el de lunes a viernes", () => {
    const sabado = fechaConDia(6);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: sabado, hasta: sabado },
      contexto({
        horarios: [horario({ diaSemana: 6, horaInicio: "07:00", horaFin: "14:00", duracionMin: 60 })],
      })
    );
    // techo = intersección con [07:30, 13:00] → arranca en 07:30 (no 07:00) y
    // ningún slot de 60 min puede terminar después de las 13:00.
    const ultima = dias[0].franjas.at(-1)!;
    const todasDentroDelHorarioSabado = dias[0].franjas.every(
      (f) => f.inicio >= aUtc(sabado, "07:30").toISOString() && f.fin <= aUtc(sabado, "13:00").toISOString()
    );
    expect(todasDentroDelHorarioSabado).toBe(true);
    expect(ultima.fin > aUtc(sabado, "12:00").toISOString()).toBe(true);
  });
});

describe("excepciones_agenda", () => {
  it("un feriado de sede (día completo) cierra la agenda entera ese día", () => {
    const lunes = fechaConDia(1);
    const excepcion: ExcepcionDisponibilidad = {
      alcance: "sede",
      medicoId: null,
      consultorioId: null,
      sedeId: "sede-1",
      fechaDesde: lunes,
      fechaHasta: lunes,
      horaInicio: null,
      horaFin: null,
    };
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({ horarios: [horario({ diaSemana: 1 })], excepciones: [excepcion] })
    );
    expect(dias).toHaveLength(0);
  });

  it("una ausencia de un médico no afecta las franjas de otro médico", () => {
    const lunes = fechaConDia(1);
    const excepcion: ExcepcionDisponibilidad = {
      alcance: "medico",
      medicoId: "medico-1",
      consultorioId: null,
      sedeId: null,
      fechaDesde: lunes,
      fechaHasta: lunes,
      horaInicio: null,
      horaFin: null,
    };
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [
          horario({ id: "h1", medicoId: "medico-1", diaSemana: 1 }),
          horario({ id: "h2", medicoId: "medico-2", diaSemana: 1 }),
        ],
        excepciones: [excepcion],
      })
    );
    expect(dias[0].franjas.every((f) => f.medicoId === "medico-2")).toBe(true);
    expect(dias[0].franjas.some((f) => f.medicoId === "medico-1")).toBe(false);
  });

  it("un bloqueo parcial parte la jornada en dos, sin generar slots adentro del bloqueo", () => {
    const lunes = fechaConDia(1);
    const excepcion: ExcepcionDisponibilidad = {
      alcance: "medico",
      medicoId: "medico-1",
      consultorioId: null,
      sedeId: null,
      fechaDesde: lunes,
      fechaHasta: lunes,
      horaInicio: "08:20",
      horaFin: "08:40",
    };
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, horaInicio: "08:00", horaFin: "09:00", duracionMin: 20 })],
        excepciones: [excepcion],
      })
    );
    const inicios = dias[0].franjas.map((f) => f.inicio);
    expect(inicios).toContain(aUtc(lunes, "08:00").toISOString());
    expect(inicios).not.toContain(aUtc(lunes, "08:20").toISOString());
    expect(inicios).toContain(aUtc(lunes, "08:40").toISOString());
  });

  it("vigente_hasta anterior a la fecha consultada excluye el horario", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, vigenteDesde: "2026-01-01", vigenteHasta: sumarDias(lunes, -1) })],
      })
    );
    expect(dias).toHaveLength(0);
  });
});

describe("descuento de cupos por citas activas", () => {
  it("cada cita activa baja un cupo, y la franja desaparece al llenarse", () => {
    const lunes = fechaConDia(1);
    const inicioSlot = aUtc(lunes, "10:00").toISOString();
    const citas: CitaOcupacion[] = [
      { medicoId: "medico-1", especialidadId: "esp-1", inicio: inicioSlot },
      { medicoId: "medico-1", especialidadId: "esp-1", inicio: inicioSlot },
    ];
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, horaInicio: "10:00", horaFin: "11:00", modo: "bloque", duracionMin: 60, cuposPorBloque: 3 })],
        citasActivas: citas,
      })
    );
    expect(dias[0].franjas[0].cuposDisponibles).toBe(1);
  });

  it("con el bloque lleno, la franja no aparece (nunca acepta un 4º paciente)", () => {
    const lunes = fechaConDia(1);
    const inicioSlot = aUtc(lunes, "10:00").toISOString();
    const citas: CitaOcupacion[] = [
      { medicoId: "medico-1", especialidadId: "esp-1", inicio: inicioSlot },
      { medicoId: "medico-1", especialidadId: "esp-1", inicio: inicioSlot },
      { medicoId: "medico-1", especialidadId: "esp-1", inicio: inicioSlot },
    ];
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, horaInicio: "10:00", horaFin: "11:00", modo: "bloque", duracionMin: 60, cuposPorBloque: 3 })],
        citasActivas: citas,
      })
    );
    expect(dias).toHaveLength(0);
  });

  it("laboratorio (sin médico) descuenta ocupación por especialidad, no por médico", () => {
    const lunes = fechaConDia(1);
    const inicioSlot = aUtc(lunes, "07:00").toISOString();
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-lab", desde: lunes, hasta: lunes },
      contexto({
        horarios: [
          horario({ medicoId: null, especialidadId: "esp-lab", consultorioId: null, diaSemana: 1, horaInicio: "07:00", horaFin: "08:00", modo: "bloque", duracionMin: 60, cuposPorBloque: 4 }),
        ],
        citasActivas: [
          { medicoId: null, especialidadId: "esp-lab", inicio: inicioSlot },
          { medicoId: null, especialidadId: "esp-lab", inicio: inicioSlot },
        ],
      })
    );
    expect(dias[0].franjas[0].cuposDisponibles).toBe(2);
  });
});

describe("anticipación mínima y máxima (§4.3, configurable)", () => {
  it("excluye franjas a menos de la anticipación mínima configurada", () => {
    const lunes = fechaConDia(1);
    const ahora = aUtc(lunes, "05:31"); // faltan 2h29 para las 08:00 y 3h09 para las 08:40 con anticipación de 3h
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      contexto({
        horarios: [horario({ diaSemana: 1, horaInicio: "08:00", horaFin: "09:00", duracionMin: 20 })],
        configuracion: { anticipacionMinimaHoras: 3, anticipacionMaximaDias: 60, validarConsultorios: false },
        ahora,
      })
    );
    const inicios = dias[0].franjas.map((f) => f.inicio);
    expect(inicios).not.toContain(aUtc(lunes, "08:00").toISOString());
    expect(inicios).not.toContain(aUtc(lunes, "08:20").toISOString());
    expect(inicios).toContain(aUtc(lunes, "08:40").toISOString());
  });

  it("excluye días más allá de la anticipación máxima configurada", () => {
    const ahora = aUtc("2026-09-01", "08:00");
    const lejos = sumarDias("2026-09-01", 10);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lejos, hasta: lejos },
      contexto({
        horarios: [horario({ diaSemana: aLocal(aUtc(lejos, "12:00")).diaSemana })],
        configuracion: { anticipacionMinimaHoras: 3, anticipacionMaximaDias: 5, validarConsultorios: false },
        ahora,
      })
    );
    expect(dias).toHaveLength(0);
  });
});

describe("validar_consultorios (§16, apagado por defecto)", () => {
  const lunes = fechaConDia(1);
  const dosMedicosMismoConsultorio = () =>
    contexto({
      horarios: [
        horario({ id: "h1", medicoId: "medico-1", consultorioId: "cons-compartido", diaSemana: 1, horaInicio: "08:00", horaFin: "09:00", duracionMin: 60 }),
        horario({ id: "h2", medicoId: "medico-2", consultorioId: "cons-compartido", diaSemana: 1, horaInicio: "08:00", horaFin: "09:00", duracionMin: 60 }),
      ],
    });

  it("apagado (default): ambos médicos ofrecen su franja aunque compartan consultorio", () => {
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      dosMedicosMismoConsultorio()
    );
    expect(dias[0].franjas).toHaveLength(2);
  });

  it("encendido: descarta las franjas de ambos médicos si sus horarios chocan en el mismo consultorio", () => {
    const base = dosMedicosMismoConsultorio();
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", desde: lunes, hasta: lunes },
      { ...base, configuracion: { ...base.configuracion, validarConsultorios: true } }
    );
    expect(dias).toHaveLength(0);
  });
});

describe("filtro por médico", () => {
  it("params.medicoId limita la disponibilidad a ese médico", () => {
    const lunes = fechaConDia(1);
    const dias = calcularDisponibilidad(
      { especialidadId: "esp-1", medicoId: "medico-2", desde: lunes, hasta: lunes },
      contexto({
        horarios: [
          horario({ id: "h1", medicoId: "medico-1", diaSemana: 1 }),
          horario({ id: "h2", medicoId: "medico-2", diaSemana: 1 }),
        ],
      })
    );
    expect(dias[0].franjas.every((f) => f.medicoId === "medico-2")).toBe(true);
  });
});

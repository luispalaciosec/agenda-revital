import { describe, expect, it } from "vitest";
import { aUtc, aLocal, sumarDias, rangoFechas, compararFechas } from "./tiempo";

describe("aUtc / aLocal", () => {
  it("convierte hora local de Guayaquil (UTC-5) a UTC", () => {
    const instante = aUtc("2026-09-01", "07:00");
    expect(instante.toISOString()).toBe("2026-09-01T12:00:00.000Z");
  });

  it("es la inversa de aLocal", () => {
    const instante = aUtc("2026-09-01", "14:30");
    const local = aLocal(instante);
    expect(local.fecha).toBe("2026-09-01");
    expect(local.hora).toBe("14:30:00");
  });

  it("calcula el día de la semana en horario local, no UTC", () => {
    // 2026-09-01 00:30 UTC-5 sigue siendo 31 de agosto en UTC.
    const instante = aUtc("2026-09-01", "00:30");
    const local = aLocal(instante);
    expect(local.fecha).toBe("2026-09-01");
  });
});

describe("sumarDias / rangoFechas", () => {
  it("suma días de calendario", () => {
    expect(sumarDias("2026-09-01", 1)).toBe("2026-09-02");
    expect(sumarDias("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("genera un rango inclusive", () => {
    expect(rangoFechas("2026-09-01", "2026-09-03")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("un rango de un solo día devuelve una fecha", () => {
    expect(rangoFechas("2026-09-01", "2026-09-01")).toEqual(["2026-09-01"]);
  });
});

describe("compararFechas", () => {
  it("ordena fechas como strings ISO", () => {
    expect(compararFechas("2026-09-01", "2026-09-02")).toBeLessThan(0);
    expect(compararFechas("2026-09-02", "2026-09-01")).toBeGreaterThan(0);
    expect(compararFechas("2026-09-01", "2026-09-01")).toBe(0);
  });
});

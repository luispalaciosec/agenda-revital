import { describe, expect, it } from "vitest";
import { horaAMinutos, minutosAHora, intersectar, restar, restarVarios } from "./intervalos";

describe("horaAMinutos / minutosAHora", () => {
  it("convierte hh:mm a minutos y de vuelta", () => {
    expect(horaAMinutos("07:00")).toBe(420);
    expect(horaAMinutos("17:30")).toBe(1050);
    expect(minutosAHora(420)).toBe("07:00:00");
    expect(minutosAHora(1050)).toBe("17:30:00");
  });
});

describe("intersectar", () => {
  it("devuelve el solape cuando existe", () => {
    expect(intersectar([420, 1050], [480, 900])).toEqual([480, 900]);
  });

  it("devuelve null cuando no hay solape", () => {
    expect(intersectar([420, 480], [500, 600])).toBeNull();
  });

  it("devuelve null cuando los intervalos solo se tocan en el borde", () => {
    expect(intersectar([420, 480], [480, 600])).toBeNull();
  });
});

describe("restar", () => {
  it("no cambia nada si no hay solape", () => {
    expect(restar([420, 600], [700, 800])).toEqual([[420, 600]]);
  });

  it("recorta el inicio", () => {
    expect(restar([420, 600], [400, 450])).toEqual([[450, 600]]);
  });

  it("recorta el final", () => {
    expect(restar([420, 600], [550, 650])).toEqual([[420, 550]]);
  });

  it("parte el intervalo en dos cuando el bloqueo cae adentro", () => {
    expect(restar([420, 600], [480, 500])).toEqual([
      [420, 480],
      [500, 600],
    ]);
  });

  it("vacía el intervalo si el bloqueo lo cubre entero", () => {
    expect(restar([420, 600], [0, 1440])).toEqual([]);
  });
});

describe("restarVarios", () => {
  it("aplica varios bloqueos en secuencia", () => {
    const libres = restarVarios([420, 1050], [
      [480, 500],
      [900, 950],
    ]);
    expect(libres).toEqual([
      [420, 480],
      [500, 900],
      [950, 1050],
    ]);
  });
});

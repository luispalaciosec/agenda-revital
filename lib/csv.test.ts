import { describe, expect, it } from "vitest";
import { aCsv } from "./csv";

describe("aCsv", () => {
  it("arma encabezado y filas separados por coma", () => {
    const csv = aCsv([
      { nombre: "Ana", edad: 30 },
      { nombre: "Luis", edad: 40 },
    ]);
    expect(csv).toBe("nombre,edad\nAna,30\nLuis,40");
  });

  it("escapa valores con coma, comillas o salto de línea", () => {
    const csv = aCsv([{ nota: 'Dijo "hola", adiós\nchau' }]);
    expect(csv).toBe('nota\n"Dijo ""hola"", adiós\nchau"');
  });

  it("trata null como celda vacía", () => {
    const csv = aCsv([{ correo: null }]);
    expect(csv).toBe("correo\n");
  });

  it("devuelve cadena vacía sin filas", () => {
    expect(aCsv([])).toBe("");
  });
});

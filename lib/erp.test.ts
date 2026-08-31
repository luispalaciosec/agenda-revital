import { describe, expect, it } from "vitest";
import { textoParaErp } from "./erp";

describe("textoParaErp", () => {
  it("arma el bloque completo con paciente y celular", () => {
    const texto = textoParaErp({
      codigoPublico: "RVT-ABCDE",
      inicio: "2026-08-31T14:00:00.000Z", // 09:00 Guayaquil
      fin: "2026-08-31T15:00:00.000Z",
      especialidad: "Medicina general",
      servicio: "Consulta de medicina general",
      medico: "Dr. John Méndez",
      precioAplicado: 15,
      paciente: {
        nombres: "Ana",
        apellidos: "Torres",
        tipoDocumento: "cedula",
        documento: "0100000009",
        fechaNacimiento: "1990-05-12",
        correo: "ana@example.com",
      },
      celular: "0999000001",
    });

    expect(texto).toContain("Paciente: Ana Torres");
    expect(texto).toContain("Documento: Cédula 0100000009");
    expect(texto).toContain("Fecha de nacimiento: 12/05/1990");
    expect(texto).toContain("Celular: 0999000001");
    expect(texto).toContain("Fecha: 31/08/2026");
    expect(texto).toContain("Hora: 09:00–10:00");
    expect(texto).toContain("Precio: $15");
    expect(texto).toContain("Código Agenda Revital: RVT-ABCDE");
  });

  it("usa — cuando falta el paciente", () => {
    const texto = textoParaErp({
      codigoPublico: null,
      inicio: "2026-08-31T14:00:00.000Z",
      fin: "2026-08-31T15:00:00.000Z",
      especialidad: null,
      servicio: null,
      medico: null,
      precioAplicado: null,
      paciente: null,
      celular: null,
    });
    expect(texto).toContain("Paciente: —");
    expect(texto).toContain("Documento: —");
    expect(texto).toContain("Código Agenda Revital: —");
  });
});

import {
  createCitamedicaSchema,
  updateCitamedicaSchema,
} from "./create-citamedica.dto";

describe("Citamedica DTO", () => {
  it("conserva las 17:00 como hora de reloj al crear una cita", () => {
    const result = createCitamedicaSchema.parse({
      pacienteId: 1,
      fechacita: "2026-10-06T17:00:00.000Z",
    });

    expect(result.fechacita.toISOString()).toBe("2026-10-06T17:00:00.000Z");
  });

  it("no desplaza una hora sin zona al editar una cita", () => {
    const result = updateCitamedicaSchema.parse({
      fechacita: "2026-10-06T17:00",
    });

    expect(result.fechacita?.toISOString()).toBe("2026-10-06T17:00:00.000Z");
  });

  it("rechaza fechas y horas inexistentes", () => {
    expect(() =>
      createCitamedicaSchema.parse({
        pacienteId: 1,
        fechacita: "2026-02-30T25:00",
      }),
    ).toThrow();
  });
});

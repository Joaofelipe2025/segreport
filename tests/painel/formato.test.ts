import { describe, expect, it } from "vitest";
import { formatRelative } from "@/lib/format";

const AGORA = new Date("2026-09-24T12:00:00Z");

describe("formatRelative", () => {
  it("minutos", () => {
    expect(formatRelative("2026-09-24T11:30:00Z", AGORA)).toBe("há 30 min");
  });

  it("horas", () => {
    expect(formatRelative("2026-09-24T07:00:00Z", AGORA)).toBe("há 5h");
  });

  it("dias", () => {
    expect(formatRelative("2026-09-21T12:00:00Z", AGORA)).toBe("há 3 dias");
  });

  it("um dia é singular", () => {
    expect(formatRelative("2026-09-23T12:00:00Z", AGORA)).toBe("há 1 dia");
  });

  it("data no futuro não vira minuto negativo", () => {
    // Matéria agendada tem `scheduled_for` à frente de agora. 'há -120 min'
    // é lixo na tela; 'em 2h' é informação.
    expect(formatRelative("2026-09-24T14:00:00Z", AGORA)).toBe("em 2h");
  });

  it("futuro em minutos", () => {
    expect(formatRelative("2026-09-24T12:45:00Z", AGORA)).toBe("em 45 min");
  });

  it("futuro em dias", () => {
    expect(formatRelative("2026-09-27T12:00:00Z", AGORA)).toBe("em 3 dias");
  });
});

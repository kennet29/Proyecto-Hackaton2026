import { hasAnyRole, normalizeRole } from "./role.util";

describe("role utilities", () => {
  it("normalizes role names by trimming and lowercasing", () => {
    expect(normalizeRole(" Admin ")).toBe("admin");
    expect(normalizeRole(undefined)).toBe("");
  });

  it("matches allowed roles case-insensitively", () => {
    expect(hasAnyRole({ role: "SuperAdmin" }, ["admin", "superadmin"])).toBe(
      true,
    );
    expect(hasAnyRole({ role: "paciente" }, ["admin", "superadmin"])).toBe(
      false,
    );
    expect(hasAnyRole(undefined, [])).toBe(true);
  });
});

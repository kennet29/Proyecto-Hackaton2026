import test from "node:test";
import assert from "node:assert/strict";
import { hasAnyRole, normalizeRole } from "./role.util";

test("normalizeRole trims and lowercases role names", () => {
  assert.equal(normalizeRole(" Admin "), "admin");
  assert.equal(normalizeRole(undefined), "");
});

test("hasAnyRole matches allowed roles case-insensitively", () => {
  assert.equal(
    hasAnyRole({ role: "SuperAdmin" }, ["admin", "superadmin"]),
    true,
  );
  assert.equal(
    hasAnyRole({ role: "paciente" }, ["admin", "superadmin"]),
    false,
  );
  assert.equal(hasAnyRole(undefined, []), true);
});

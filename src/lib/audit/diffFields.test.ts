import { describe, expect, it } from "vitest";
import { diffFields } from "./logAudit";

describe("diffFields", () => {
  it("returns undefined when nothing changed", () => {
    const before = { name: "A", role: "admin" };
    const after = { name: "A", role: "admin" };
    expect(diffFields(before, after)).toBeUndefined();
  });

  it("returns only the changed keys", () => {
    const before = { name: "A", role: "admin", active: true };
    const after = { role: "super_admin" };
    expect(diffFields(before, after)).toEqual({
      before: { role: "admin" },
      after: { role: "super_admin" },
    });
  });

  it("always strips password_hash even if present in `after`", () => {
    const before = { password_hash: "old$hash", name: "A" };
    const after = { password_hash: "new$hash" };
    expect(diffFields(before, after)).toBeUndefined();
  });
});

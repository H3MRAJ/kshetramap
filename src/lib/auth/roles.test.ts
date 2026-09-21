import { describe, expect, it } from "vitest";
import { hasAcScope, roleAllowed } from "./roles";

describe("roleAllowed", () => {
  it("super_admin always passes, regardless of allow-list", () => {
    expect(roleAllowed("super_admin", ["admin"])).toBe(true);
    expect(roleAllowed("super_admin", [])).toBe(true);
  });

  it("allows a role present in the allow-list", () => {
    expect(roleAllowed("admin", ["admin", "candidate"])).toBe(true);
  });

  it("rejects a role absent from the allow-list", () => {
    expect(roleAllowed("worker", ["admin", "candidate"])).toBe(false);
  });
});

describe("hasAcScope", () => {
  it("true when the AC is in scope", () => {
    expect(hasAcScope([178, 42], 178)).toBe(true);
  });

  it("false when the AC is not in scope", () => {
    expect(hasAcScope([42], 178)).toBe(false);
  });

  it("false when scope is undefined", () => {
    expect(hasAcScope(undefined, 178)).toBe(false);
  });
});

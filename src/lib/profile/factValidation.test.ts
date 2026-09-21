import { describe, expect, it } from "vitest";
import { factHasUnsourcedValue, findUnsourcedFactKeys } from "./factValidation";
import type { Fact } from "./profileRepo";

describe("factHasUnsourcedValue", () => {
  it("returns false for an undefined fact (field never touched)", () => {
    expect(factHasUnsourcedValue(undefined)).toBe(false);
  });

  it("returns false for a fact with neither value nor source (fine to leave unset)", () => {
    expect(factHasUnsourcedValue<string>({ value: "", source: "", as_of: "" })).toBe(false);
  });

  it("returns false for a fully-populated string fact", () => {
    expect(
      factHasUnsourcedValue<string>({ value: "120 sq km", source: "Census 2011", as_of: "2011" })
    ).toBe(false);
  });

  it("returns true for a string fact with a value but no source", () => {
    expect(factHasUnsourcedValue<string>({ value: "120 sq km", source: "", as_of: "2011" })).toBe(
      true
    );
  });

  it("returns true for a string fact whose source is only whitespace", () => {
    expect(factHasUnsourcedValue<string>({ value: "120 sq km", source: "   ", as_of: "" })).toBe(
      true
    );
  });

  it("treats a numeric value of 0 as meaningfully set", () => {
    expect(factHasUnsourcedValue<number>({ value: 0, source: "", as_of: "" })).toBe(true);
  });

  it("returns false for a numeric fact with no source when value is NaN (empty input)", () => {
    expect(factHasUnsourcedValue<number>({ value: NaN, source: "", as_of: "" })).toBe(false);
  });

  it("returns false for a numeric fact with a real value and a real source", () => {
    expect(factHasUnsourcedValue<number>({ value: 68.4, source: "Census 2011", as_of: "2011" })).toBe(
      false
    );
  });
});

describe("findUnsourcedFactKeys", () => {
  it("returns only the keys of facts that have a value but no source", () => {
    const section = {
      area_note: { value: "120 sq km", source: "", as_of: "2011" } as Fact<string>,
      hq_note: { value: "Town centre", source: "Census 2011", as_of: "2011" } as Fact<string>,
      blocks: undefined,
    };
    expect(findUnsourcedFactKeys(section, ["area_note", "hq_note", "blocks"] as const)).toEqual([
      "area_note",
    ]);
  });

  it("returns an empty array when every fact is either fully sourced or unset", () => {
    const section = {
      area_note: { value: "120 sq km", source: "Census 2011", as_of: "2011" } as Fact<string>,
      hq_note: undefined,
    };
    expect(findUnsourcedFactKeys(section, ["area_note", "hq_note"] as const)).toEqual([]);
  });
});

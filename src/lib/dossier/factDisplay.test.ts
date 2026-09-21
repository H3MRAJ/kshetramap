import { describe, expect, it } from "vitest";
import { buildSourceIndex, compileSources } from "./sources";
import { resolveFactDisplay, resolveSourcedDisplay } from "./factDisplay";
import { emptyProfileSkeleton, type ConstituencyProfileDoc } from "@/lib/profile/profileRepo";

const AC_NO = 999999;

function baseProfile(overrides: Partial<ConstituencyProfileDoc> = {}): ConstituencyProfileDoc {
  return {
    ...emptyProfileSkeleton(AC_NO),
    updated_by: "user-1",
    ...overrides,
  };
}

describe("resolveFactDisplay", () => {
  it("renders '—' with no superscript when the fact is undefined", () => {
    expect(resolveFactDisplay(undefined, new Map())).toEqual({ text: "—", supNumber: null });
  });

  it("renders '—' with no superscript when the fact has an empty source", () => {
    const fact = { value: "some value", source: "", as_of: "2020" };
    expect(resolveFactDisplay(fact, new Map())).toEqual({ text: "—", supNumber: null });
  });

  it("renders '—' with no superscript when source is real but value is blank/whitespace-only", () => {
    const sourceIndex = new Map([["Census 2011", 1]]);
    expect(
      resolveFactDisplay({ value: "", source: "Census 2011", as_of: "2011" }, sourceIndex)
    ).toEqual({ text: "—", supNumber: null });
    expect(
      resolveFactDisplay({ value: "   ", source: "Census 2011", as_of: "2011" }, sourceIndex)
    ).toEqual({ text: "—", supNumber: null });
  });

  it("renders the value with its 1-based index when source is present and indexed", () => {
    const profile = baseProfile({
      snapshot: {
        blocks: { value: "Mokama and Ghoswori blocks", source: "Census 2011", as_of: "2011" },
        literacy_pct: { value: 61.5, source: "District Gazette", as_of: "2015" },
      },
    });
    const sourceIndex = buildSourceIndex(compileSources(profile));

    expect(resolveFactDisplay(profile.snapshot.blocks, sourceIndex)).toEqual({
      text: "Mokama and Ghoswori blocks",
      supNumber: 1,
    });
    expect(
      resolveFactDisplay(profile.snapshot.literacy_pct, sourceIndex, (v) => `${v}%`)
    ).toEqual({ text: "61.5%", supNumber: 2 });
  });

  it("falls back to supNumber: null (not a throw) if the source isn't in the index", () => {
    const fact = { value: "x", source: "Not In Index", as_of: "2020" };
    expect(resolveFactDisplay(fact, new Map())).toEqual({ text: "x", supNumber: null });
  });

  it("uses the custom format function when given", () => {
    const fact = { value: 894, source: "Census 2011", as_of: "2011" };
    const sourceIndex = new Map([["Census 2011", 1]]);
    expect(resolveFactDisplay(fact, sourceIndex, (v) => `${v} per 1000`)).toEqual({
      text: "894 per 1000",
      supNumber: 1,
    });
  });
});

describe("resolveSourcedDisplay", () => {
  it("returns supNumber: null when the item is undefined", () => {
    expect(resolveSourcedDisplay(undefined, new Map())).toEqual({ supNumber: null });
  });

  it("returns supNumber: null when source is empty/missing", () => {
    expect(resolveSourcedDisplay({ source: "" }, new Map())).toEqual({ supNumber: null });
    expect(resolveSourcedDisplay({}, new Map())).toEqual({ supNumber: null });
  });

  it("looks up the 1-based index for a caste_notes-shaped item (source/as_of direct, no Fact wrapper)", () => {
    const profile = baseProfile({
      social: {
        caste_notes: [
          {
            group: "Bhumihar",
            note: "Historically influential landholding community",
            source: "Bihar Caste Survey 2023",
            as_of: "2023",
            granularity: "district",
          },
        ],
        communities: [],
        institutions: [],
      },
    });
    const sourceIndex = buildSourceIndex(compileSources(profile));

    expect(resolveSourcedDisplay(profile.social.caste_notes[0], sourceIndex)).toEqual({
      supNumber: 1,
    });
  });

  it("looks up the 1-based index for an economic.schemes-shaped item", () => {
    const sourceIndex = new Map([["District Scheme Report 2023", 1]]);
    const scheme = {
      name: "MGNREGA",
      coverage_note: "Widely accessed in diara panchayats",
      source: "District Scheme Report 2023",
      as_of: "2023",
    };
    expect(resolveSourcedDisplay(scheme, sourceIndex)).toEqual({ supNumber: 1 });
  });

  it("falls back to supNumber: null (not a throw) if the source isn't in the index", () => {
    expect(resolveSourcedDisplay({ source: "Not In Index" }, new Map())).toEqual({
      supNumber: null,
    });
  });
});

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { emptyProfileSkeleton, type ConstituencyProfileDoc } from "@/lib/profile/profileRepo";
import { buildSourceIndex, compileSources } from "./sources";

const AC_NO = 999999; // clearly-marked test AC, never real seed data
const NOW = new Date("2026-08-04T00:00:00.000Z");

/** Base doc with every section present but empty — callers override sections per-test. */
function baseProfile(overrides: Partial<ConstituencyProfileDoc> = {}): ConstituencyProfileDoc {
  return {
    ...emptyProfileSkeleton(AC_NO),
    _id: new ObjectId(),
    updated_by: "user-1",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

describe("compileSources", () => {
  it("1. collects {source, as_of} pairs scattered across multiple sections", () => {
    const profile = baseProfile({
      snapshot: {
        area_note: { value: "120 sq km", source: "Census 2011", as_of: "2011" },
      },
      social: {
        caste_notes: [],
        communities: [],
        institutions: [],
        religion_note: { value: "Mixed", source: "District Gazette", as_of: "2015" },
      },
      economic: {
        occupations: [{ label: "Agriculture", value: "Primary", source: "District Survey", as_of: "2020" }],
        projects: [],
        issues: [],
        schemes: [],
      },
      political: {
        key_leaders: [],
        history_note: { value: "Long history", source: "Local Records", as_of: "2019" },
      },
    });

    const sources = compileSources(profile);
    const sourceNames = sources.map((s) => s.source);
    expect(sourceNames).toEqual(
      expect.arrayContaining(["Census 2011", "District Gazette", "District Survey", "Local Records"])
    );
    expect(sources).toContainEqual({ source: "Census 2011", as_of: "2011" });
    expect(sources).toContainEqual({ source: "District Gazette", as_of: "2015" });
    expect(sources).toContainEqual({ source: "District Survey", as_of: "2020" });
    expect(sources).toContainEqual({ source: "Local Records", as_of: "2019" });
  });

  it("2. dedupes two facts sharing the identical source string — first occurrence's as_of survives", () => {
    const profile = baseProfile({
      snapshot: {
        area_note: { value: "120 sq km", source: "Census 2011", as_of: "2011-01" },
      },
      economic: {
        occupations: [],
        projects: [],
        issues: [],
        schemes: [],
        // Same source string, later in the walk, different as_of — must NOT override the first.
        agriculture: { value: "Paddy", source: "Census 2011", as_of: "2011-06" },
      },
    });

    const sources = compileSources(profile);
    const censusEntries = sources.filter((s) => s.source === "Census 2011");
    expect(censusEntries).toHaveLength(1);
    expect(censusEntries[0]).toEqual({ source: "Census 2011", as_of: "2011-01" });
  });

  it("3. picks up caste_notes[] and economic.schemes[] entries (source/as_of directly, no Fact wrapper)", () => {
    const profile = baseProfile({
      social: {
        caste_notes: [
          {
            group: "Yadav",
            note: "Significant population share",
            source: "Bihar Caste Survey 2022",
            as_of: "2022",
            granularity: "district",
          },
        ],
        communities: [],
        institutions: [],
      },
      economic: {
        occupations: [],
        projects: [],
        issues: [],
        schemes: [
          { name: "MGNREGA", coverage_note: "Widely used", source: "District Survey 2020", as_of: "2020" },
        ],
      },
    });

    const sources = compileSources(profile);
    expect(sources).toContainEqual({ source: "Bihar Caste Survey 2022", as_of: "2022" });
    expect(sources).toContainEqual({ source: "District Survey 2020", as_of: "2020" });
  });

  it("4. a section/field with no source contributes nothing — no false positives on other string fields", () => {
    const profile = baseProfile({
      social: {
        caste_notes: [],
        // `name`/`note` are plain strings, not a source/as_of pair — must not be picked up.
        communities: [{ name: "Example Community", note: "Some note text" }],
        institutions: [{ name: "Govt High School", type: "school", note: "Built 1980" }],
      },
      economic: {
        occupations: [],
        schemes: [],
        issues: [{ title: "Irrigation", rank: 1, note: "Top concern" }],
        projects: [{ title: "Road widening", status: "ongoing", note: "Started 2023" }],
      },
      political: {
        key_leaders: [{ name: "Example Leader", role: "MLA", note: "Two terms" }],
      },
    });

    expect(compileSources(profile)).toEqual([]);
  });

  it("4b. an empty/whitespace-only source on a non-Fact sourced item (caste note / scheme) is excluded, not compiled as a blank citation", () => {
    const profile = baseProfile({
      social: {
        caste_notes: [
          {
            group: "Example Group",
            note: "Note text",
            source: "",
            as_of: "2022",
            granularity: "district",
          },
          {
            group: "Whitespace Group",
            note: "Note text",
            source: "   ",
            as_of: "2022",
            granularity: "district",
          },
        ],
        communities: [],
        institutions: [],
      },
      economic: {
        occupations: [],
        projects: [],
        issues: [],
        schemes: [
          { name: "Blank-source Scheme", coverage_note: "Note", source: "", as_of: "2020" },
        ],
      },
    });

    expect(compileSources(profile)).toEqual([]);
  });

  it("5. an empty/skeleton profile yields empty sources[], no throw", () => {
    const skeleton = emptyProfileSkeleton(AC_NO);
    expect(() => compileSources(skeleton)).not.toThrow();
    expect(compileSources(skeleton)).toEqual([]);
  });

  it("6. ordering follows first-encounter (walk) order, not alphabetical-by-source", () => {
    // Deliberately out of "natural" section order (political walked last,
    // normally) AND with a source name that would sort alphabetically LAST
    // placed first in the walk — proves the output isn't secretly sorted.
    const profile = baseProfile({
      political: {
        key_leaders: [],
        history_note: { value: "x", source: "Zzz Late Report", as_of: "2018" },
      },
      snapshot: {
        area_note: { value: "y", source: "Aaa Early Report", as_of: "2020" },
      },
    });

    // snapshot is encountered before political in the doc's own field order
    // (see ConstituencyProfileDoc: snapshot, social, economic, political),
    // regardless of the object-literal override order above.
    const sources = compileSources(profile);
    expect(sources.map((s) => s.source)).toEqual(["Aaa Early Report", "Zzz Late Report"]);
  });

  it("6b. within a single section, field order (not alphabetical field name) drives encounter order", () => {
    // hq_note is declared before area_note in this object literal, even
    // though "area_note" < "hq_note" alphabetically — output must reflect
    // the literal's own key insertion order.
    const profile = baseProfile({
      snapshot: {
        hq_note: { value: "Town Hall", source: "HQ Source", as_of: "2019" },
        area_note: { value: "120 sq km", source: "Area Source", as_of: "2020" },
      },
    });

    const sources = compileSources(profile);
    expect(sources.map((s) => s.source)).toEqual(["HQ Source", "Area Source"]);
  });
});

describe("buildSourceIndex", () => {
  it("maps each source string to its 1-based position in the array", () => {
    const sources = [
      { source: "Census 2011", as_of: "2011" },
      { source: "District Gazette", as_of: "2015" },
      { source: "Local Records", as_of: "2019" },
    ];
    const index = buildSourceIndex(sources);
    expect(index.get("Census 2011")).toBe(1);
    expect(index.get("District Gazette")).toBe(2);
    expect(index.get("Local Records")).toBe(3);
    expect(index.get("Not Present")).toBeUndefined();
  });

  it("stays in sync with compileSources' own numbering for a real profile", () => {
    const profile = baseProfile({
      snapshot: {
        blocks: { value: "Mokama block", source: "Census 2011", as_of: "2011" },
        literacy_pct: { value: 61.5, source: "District Gazette", as_of: "2015" },
      },
    });
    const sources = compileSources(profile);
    const index = buildSourceIndex(sources);
    expect(index.get("Census 2011")).toBe(1);
    expect(index.get("District Gazette")).toBe(2);
    expect(index.size).toBe(sources.length);
  });

  it("first occurrence wins if given an un-deduped list (defensive; compileSources never actually produces one)", () => {
    const index = buildSourceIndex([
      { source: "Same", as_of: "2011" },
      { source: "Same", as_of: "2020" },
    ]);
    expect(index.get("Same")).toBe(1);
    expect(index.size).toBe(1);
  });

  it("empty sources[] yields an empty map", () => {
    expect(buildSourceIndex([]).size).toBe(0);
  });
});

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { diffFields } from "@/lib/audit/logAudit";
import {
  buildProfileUpdate,
  buildSetFields,
  defaultProfileSections,
  emptyProfileSkeleton,
  mergeProfileSections,
  reconcileCreationId,
  type ConstituencyProfileDoc,
} from "./profileRepo";

const AC_NO = 999999; // clearly-marked test AC, never real seed data
const NOW = new Date("2026-08-04T00:00:00.000Z");

function existingFixture(): ConstituencyProfileDoc {
  return {
    _id: new ObjectId(),
    ac_no: AC_NO,
    snapshot: {
      area_note: { value: "120 sq km", source: "Census 2011", as_of: "2011" },
      literacy_pct: { value: 68.4, source: "Census 2011", as_of: "2011" },
    },
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
      religion_note: { value: "Mixed", source: "Census 2011", as_of: "2011" },
      communities: [{ name: "Example Community" }],
      institutions: [{ name: "Govt High School", type: "school" }],
    },
    economic: {
      occupations: [{ label: "Agriculture", value: "Primary", source: "District survey", as_of: "2020" }],
      agriculture: { value: "Paddy, wheat", source: "District survey", as_of: "2020" },
      schemes: [{ name: "MGNREGA", coverage_note: "Widely used", source: "District survey", as_of: "2020" }],
      projects: [{ title: "Road widening", status: "ongoing" }],
      issues: [{ title: "Irrigation", rank: 1 }],
    },
    political: {
      history_note: { value: "Long history", source: "Local records", as_of: "2020" },
      key_leaders: [{ name: "Example Leader", role: "MLA" }],
      organisation_note: { value: "Strong booth presence", source: "Party records", as_of: "2020" },
    },
    brief_en: "Existing English brief",
    brief_hi: "मौजूदा हिंदी संक्षिप्त विवरण",
    updated_by: "user-original",
    created_at: new Date("2025-01-01T00:00:00.000Z"),
    updated_at: new Date("2025-06-01T00:00:00.000Z"),
  };
}

describe("mergeProfileSections", () => {
  it("carries over sections absent from the patch unchanged", () => {
    const existing = defaultProfileSections();
    existing.snapshot = { area_note: { value: "x", source: "s", as_of: "2020" } };
    const merged = mergeProfileSections(existing, { social: { religion_note: { value: "y", source: "s", as_of: "2020" } } });
    expect(merged.snapshot).toBe(existing.snapshot);
    expect(merged.economic).toBe(existing.economic);
    expect(merged.political).toBe(existing.political);
  });

  it("shallow-merges a touched section field-by-field, preserving sibling fields", () => {
    const existing = defaultProfileSections();
    existing.snapshot = {
      area_note: { value: "120 sq km", source: "Census", as_of: "2011" },
      hq_note: { value: "Town Hall", source: "Census", as_of: "2011" },
    };
    const merged = mergeProfileSections(existing, {
      snapshot: { blocks: { value: "5", source: "Census", as_of: "2011" } },
    });
    // new field applied
    expect(merged.snapshot.blocks).toEqual({ value: "5", source: "Census", as_of: "2011" });
    // sibling fields untouched
    expect(merged.snapshot.area_note).toEqual(existing.snapshot.area_note);
    expect(merged.snapshot.hq_note).toEqual(existing.snapshot.hq_note);
  });

  it("replaces an array field wholesale when the section that owns it is patched", () => {
    const existing = defaultProfileSections();
    existing.social = {
      caste_notes: [
        { group: "A", note: "n", source: "s", as_of: "2020", granularity: "district" },
      ],
      communities: [{ name: "Old Community" }],
      institutions: [{ name: "Old School", type: "school" }],
    };
    const merged = mergeProfileSections(existing, {
      social: { communities: [{ name: "New Community" }] },
    });
    expect(merged.social.communities).toEqual([{ name: "New Community" }]);
    // untouched fields in the same section preserved
    expect(merged.social.caste_notes).toEqual(existing.social.caste_notes);
    expect(merged.social.institutions).toEqual(existing.social.institutions);
  });

  it("does not leak doc-envelope fields when given a full ConstituencyProfileDoc as `existing`", () => {
    // Regression: the real call site (buildProfileUpdate) passes a full
    // ConstituencyProfileDoc, not a bare ProfileSections — a merge
    // implementation that spreads `existing` wholesale would silently
    // acquire _id/ac_no/brief_en/brief_hi/updated_by/timestamps into a
    // value whose own type claims to be section-only.
    const existing = existingFixture();
    const merged = mergeProfileSections(existing, {
      snapshot: { blocks: { value: "9", source: "s", as_of: "2020" } },
    });
    expect(Object.keys(merged).sort()).toEqual(["economic", "political", "snapshot", "social"]);
    expect(merged).not.toHaveProperty("_id");
    expect(merged).not.toHaveProperty("ac_no");
    expect(merged).not.toHaveProperty("brief_en");
    expect(merged).not.toHaveProperty("brief_hi");
    expect(merged).not.toHaveProperty("updated_by");
    expect(merged).not.toHaveProperty("created_at");
    expect(merged).not.toHaveProperty("updated_at");
  });
});

describe("reconcileCreationId", () => {
  it("aligns before._id with the real DB-assigned after._id on the creation path", () => {
    const now = NOW;
    const placeholderBefore = { ...defaultProfileSections(), _id: new ObjectId(), ac_no: AC_NO, updated_by: "", created_at: now, updated_at: now } as ConstituencyProfileDoc;
    const realAfter = { ...placeholderBefore, _id: new ObjectId(), updated_by: "user-1" } as ConstituencyProfileDoc;
    expect(placeholderBefore._id).not.toEqual(realAfter._id);

    const reconciled = reconcileCreationId(placeholderBefore, realAfter, /* wasExisting */ false);
    expect(reconciled._id).toEqual(realAfter._id);
  });

  it("leaves before unchanged on the update path (wasExisting = true)", () => {
    const before = existingFixture();
    const after = { ...before, updated_by: "user-2" };
    const reconciled = reconcileCreationId(before, after, /* wasExisting */ true);
    expect(reconciled._id).toEqual(before._id);
    expect(reconciled).toBe(before);
  });

  it("creation path, end-to-end with diffFields(): _id never appears in the diff once reconciled", () => {
    // Simulates the full upsertProfile() creation flow purely: buildProfileUpdate()
    // produces a before/after pair with a synthetic before._id; we stand in for the
    // real post-insert doc (a different _id, same content) and reconcile.
    const patch = { snapshot: { area_note: { value: "80 sq km", source: "Census 2011", as_of: "2011" } } };
    const { before: computedBefore, after: computedAfter } = buildProfileUpdate(null, AC_NO, patch, "user-1", NOW);
    const realAfter = { ...computedAfter, _id: new ObjectId() }; // stand-in for the real DB-assigned id
    expect(computedBefore._id).not.toEqual(realAfter._id);

    const before = reconcileCreationId(computedBefore, realAfter, false);
    const diff = diffFields(before as unknown as Record<string, unknown>, realAfter as unknown as Record<string, unknown>);

    expect(diff).toBeDefined();
    expect(diff!.before).not.toHaveProperty("_id");
    expect(diff!.after).not.toHaveProperty("_id");
    // the actually-patched field is still present
    expect(diff!.after.snapshot).toEqual(realAfter.snapshot);
  });
});

describe("buildProfileUpdate", () => {
  it("1. creates a new profile from a non-existent one; before reflects the empty/default state", () => {
    const patch = {
      snapshot: { area_note: { value: "80 sq km", source: "Census 2011", as_of: "2011" } },
    };
    const { before, after } = buildProfileUpdate(null, AC_NO, patch, "user-1", NOW);

    // before is the synthetic default/empty shape
    expect(before.ac_no).toBe(AC_NO);
    expect(before.snapshot).toEqual({});
    expect(before.social).toEqual({ caste_notes: [], communities: [], institutions: [] });
    expect(before.economic).toEqual({ occupations: [], schemes: [], projects: [], issues: [] });
    expect(before.political).toEqual({ key_leaders: [] });
    expect(before.brief_en).toBeUndefined();
    expect(before.updated_by).toBe("");

    // after has the patched field applied, defaults preserved elsewhere
    expect(after.ac_no).toBe(AC_NO);
    expect(after.snapshot.area_note).toEqual({ value: "80 sq km", source: "Census 2011", as_of: "2011" });
    expect(after.social).toEqual({ caste_notes: [], communities: [], institutions: [] });
    expect(after.updated_by).toBe("user-1");
    expect(after.created_at).toEqual(NOW);
    expect(after.updated_at).toEqual(NOW);
  });

  it("2. a partial patch on an existing profile changes only the patched fields — everything else in after equals before", () => {
    const existing = existingFixture();
    const patch = {
      economic: {
        industry: { value: "Small-scale manufacturing", source: "District survey 2023", as_of: "2023" },
      },
    };
    const { before, after } = buildProfileUpdate(existing, AC_NO, patch, "user-2", NOW);

    expect(before).toEqual(existing);

    // patched field applied
    expect(after.economic.industry).toEqual(patch.economic.industry);
    // sibling fields within the touched section preserved
    expect(after.economic.occupations).toEqual(existing.economic.occupations);
    expect(after.economic.agriculture).toEqual(existing.economic.agriculture);
    expect(after.economic.schemes).toEqual(existing.economic.schemes);
    expect(after.economic.projects).toEqual(existing.economic.projects);
    expect(after.economic.issues).toEqual(existing.economic.issues);
    // untouched sections identical to before
    expect(after.snapshot).toEqual(existing.snapshot);
    expect(after.social).toEqual(existing.social);
    expect(after.political).toEqual(existing.political);
    // untouched top-level fields identical to before
    expect(after.brief_en).toBe(existing.brief_en);
    expect(after.brief_hi).toBe(existing.brief_hi);
    expect(after._id).toEqual(existing._id);
    expect(after.created_at).toEqual(existing.created_at);
    // only updated_by/updated_at change as a side effect of the write
    expect(after.updated_by).toBe("user-2");
    expect(after.updated_at).toEqual(NOW);
  });

  it("2b. a naive whole-object $set would have wiped sibling fields — assert that does NOT happen for a nested section field patch", () => {
    const existing = existingFixture();
    const patch = { social: { religion_note: { value: "Updated", source: "Census 2021", as_of: "2021" } } };
    const { after } = buildProfileUpdate(existing, AC_NO, patch, "user-3", NOW);

    expect(after.social.religion_note).toEqual(patch.social.religion_note);
    // these would be wiped to [] by a blind overwrite of the whole `social` object
    expect(after.social.caste_notes).toEqual(existing.social.caste_notes);
    expect(after.social.communities).toEqual(existing.social.communities);
    expect(after.social.institutions).toEqual(existing.social.institutions);
  });

  it("3. before/after reflect real pre/post state and are usable directly with diffFields()", () => {
    const existing = existingFixture();
    const patch = { brief_en: "Updated English brief" };
    const { before, after } = buildProfileUpdate(existing, AC_NO, patch, "user-4", NOW);

    const diff = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>);
    expect(diff).toBeDefined();
    expect(diff!.before.brief_en).toBe("Existing English brief");
    expect(diff!.after.brief_en).toBe("Updated English brief");
    // unchanged sections/fields must not appear in the diff at all
    expect(diff!.before).not.toHaveProperty("snapshot");
    expect(diff!.before).not.toHaveProperty("social");
    expect(diff!.before).not.toHaveProperty("economic");
    expect(diff!.before).not.toHaveProperty("political");
  });

  it("preserves caste_notes granularity faithfully through the merge (no upgrading district -> ac)", () => {
    const existing = existingFixture();
    const patch = { social: { religion_note: { value: "x", source: "s", as_of: "2020" } } };
    const { after } = buildProfileUpdate(existing, AC_NO, patch, "user-5", NOW);
    expect(after.social.caste_notes[0].granularity).toBe("district");
  });
});

describe("emptyProfileSkeleton", () => {
  it("returns a fully-shaped object — every section a defined object with empty array fields, ac_no set, no facts populated", () => {
    const skeleton = emptyProfileSkeleton(178);

    expect(skeleton.ac_no).toBe(178);
    // every section present and its own defined object (not undefined) —
    // a later UI must be able to render skeleton.snapshot.area_note etc.
    // without first checking `skeleton.snapshot` itself is defined.
    expect(skeleton.snapshot).toEqual({});
    expect(skeleton.social).toEqual({ caste_notes: [], communities: [], institutions: [] });
    expect(skeleton.economic).toEqual({ occupations: [], schemes: [], projects: [], issues: [] });
    expect(skeleton.political).toEqual({ key_leaders: [] });
    // array fields are [] not undefined
    expect(Array.isArray(skeleton.social.caste_notes)).toBe(true);
    expect(Array.isArray(skeleton.social.communities)).toBe(true);
    expect(Array.isArray(skeleton.social.institutions)).toBe(true);
    expect(Array.isArray(skeleton.economic.occupations)).toBe(true);
    expect(Array.isArray(skeleton.economic.schemes)).toBe(true);
    expect(Array.isArray(skeleton.economic.projects)).toBe(true);
    expect(Array.isArray(skeleton.economic.issues)).toBe(true);
    expect(Array.isArray(skeleton.political.key_leaders)).toBe(true);
    // no facts populated
    expect(skeleton.brief_en).toBeUndefined();
    expect(skeleton.brief_hi).toBeUndefined();
    expect(skeleton.demo).toBeUndefined();
    expect(skeleton._id).toBeInstanceOf(ObjectId);
    expect(skeleton.updated_by).toBe("");
  });
});

describe("buildSetFields", () => {
  it("creation ($set gets the full merged doc, no prior doc to preserve)", () => {
    const patch = {
      snapshot: { area_note: { value: "80 sq km", source: "Census 2011", as_of: "2011" } },
    };
    const { after } = buildProfileUpdate(null, AC_NO, patch, "user-1", NOW);
    const setFields = buildSetFields(null, after, patch);

    expect(setFields.ac_no).toBe(AC_NO);
    expect(setFields.snapshot).toEqual(after.snapshot);
    expect(setFields.social).toEqual({ caste_notes: [], communities: [], institutions: [] });
    expect(setFields.economic).toEqual({ occupations: [], schemes: [], projects: [], issues: [] });
    expect(setFields.political).toEqual({ key_leaders: [] });
    expect(setFields).not.toHaveProperty("_id");
    expect(setFields).not.toHaveProperty("brief_en"); // undefined, dropped
  });

  it("update: $set is scoped to only the patched top-level keys plus bookkeeping — not the whole merged doc", () => {
    const existing = existingFixture();
    const patch = {
      economic: { industry: { value: "Small-scale manufacturing", source: "District survey 2023", as_of: "2023" } },
    };
    const { after } = buildProfileUpdate(existing, AC_NO, patch, "user-2", NOW);
    const setFields = buildSetFields(existing, after, patch);

    expect(Object.keys(setFields).sort()).toEqual(["economic", "updated_at", "updated_by"]);
    expect(setFields.economic).toEqual(after.economic);
    expect(setFields).not.toHaveProperty("snapshot");
    expect(setFields).not.toHaveProperty("social");
    expect(setFields).not.toHaveProperty("political");
    expect(setFields).not.toHaveProperty("brief_en");
    expect(setFields).not.toHaveProperty("brief_hi");
    expect(setFields).not.toHaveProperty("created_at");
    expect(setFields).not.toHaveProperty("ac_no");
  });

  it("update: `demo` is only included in $set when the patch itself sets it", () => {
    const existing = existingFixture();

    const patchNoDemo = { snapshot: { blocks: { value: "5", source: "s", as_of: "2020" } } };
    const { after: afterNoDemo } = buildProfileUpdate(existing, AC_NO, patchNoDemo, "user-3", NOW);
    expect(buildSetFields(existing, afterNoDemo, patchNoDemo)).not.toHaveProperty("demo");

    const patchWithDemo = { snapshot: { blocks: { value: "5", source: "s", as_of: "2020" } }, demo: true };
    const { after: afterWithDemo } = buildProfileUpdate(existing, AC_NO, patchWithDemo, "user-3", NOW);
    expect(buildSetFields(existing, afterWithDemo, patchWithDemo)).toHaveProperty("demo", true);
  });

  it("concurrent-write regression (finding 6): a second admin's stale-read patch to a DIFFERENT section does not revert the first admin's just-written section", () => {
    // Two admins both read the SAME pre-write doc D0, then save
    // different-section patches — the exact race the whole-doc-$set bug
    // allowed: Admin A saves Social, Admin B (whose own read predates A's
    // write) saves Economic. Proves the actual Mongo $set payload each
    // produces is scoped to its own patch — not the whole merged doc — so
    // applying them in sequence never loses either admin's change.
    const d0 = existingFixture();

    // Admin A: patches Social only, computed from D0.
    const patchA = {
      social: { religion_note: { value: "A's update", source: "Census 2021", as_of: "2021" } },
    };
    const { after: afterA } = buildProfileUpdate(d0, AC_NO, patchA, "admin-a", NOW);
    const setFieldsA = buildSetFields(d0, afterA, patchA);
    expect(setFieldsA).not.toHaveProperty("economic"); // A never touched Economic

    // Apply A's write to a stand-in "DB" (what a real
    // `col.updateOne({ac_no}, {$set: setFieldsA})` against d0 would produce).
    const d1 = { ...d0, ...setFieldsA } as ConstituencyProfileDoc;
    expect(d1.social.religion_note).toEqual(patchA.social.religion_note);

    // Admin B: reads the SAME pre-A-write doc (D0, not D1 — a stale read),
    // then patches Economic only.
    const patchB = {
      economic: { industry: { value: "B's update", source: "District survey 2023", as_of: "2023" } },
    };
    const { after: afterB } = buildProfileUpdate(d0, AC_NO, patchB, "admin-b", NOW);
    const setFieldsB = buildSetFields(d0, afterB, patchB);

    // B's write must not mention `social` at all — it can't clobber A's
    // just-written section no matter how stale B's own read was.
    expect(setFieldsB).not.toHaveProperty("social");

    // Apply B's write on top of d1 — the real sequential-write order.
    const d2 = { ...d1, ...setFieldsB } as ConstituencyProfileDoc;

    // A's Social change survives B's Economic-only save...
    expect(d2.social.religion_note).toEqual(patchA.social.religion_note);
    // ...and B's Economic change is also applied.
    expect(d2.economic.industry).toEqual(patchB.economic.industry);
  });
});

// getProfile()'s "returns null for a nonexistent AC" contract is verified via
// a one-off throwaway tsx script against the real local MongoDB instance
// (same pattern Phase A used for mongo.ts — see task-2-report.md's fix-round
// entry for the exact command and output), not a permanent vitest test. Every
// other test in this file is pure/DB-free by design; a live-Mongo test here
// would make the whole `npm test` suite depend on a reachable local MongoDB
// and, since mongo.ts sets no serverSelectionTimeoutMS override, hang for
// ~30s before failing in any environment without one.

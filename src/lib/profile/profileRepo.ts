import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";

/**
 * A single curated fact. `source` is required — the UI renders "—" when a
 * fact has no citation. `as_of` is a free-form date granularity string:
 * "2023" | "2023-06" | "2023-06-15".
 */
export type Fact<T = string> = { value: T; source: string; as_of: string; note?: string };

export type CasteNote = {
  group: string;
  group_hi?: string;
  note: string;
  note_hi?: string;
  source: string;
  as_of: string;
  /**
   * Bihar Caste Survey rows are district-level, never AC/booth-level — the
   * UI must print this label next to the note and must never claim finer
   * granularity than the source actually supports.
   */
  granularity: "district" | "block" | "ac" | "qualitative";
};

export type ProfileSnapshot = {
  area_note?: Fact;
  hq_note?: Fact;
  blocks?: Fact;
  panchayats?: Fact;
  literacy_pct?: Fact<number>;
  sex_ratio?: Fact<number>;
};

export type ProfileSocial = {
  caste_notes: CasteNote[];
  religion_note?: Fact;
  migration_note?: Fact;
  communities: Array<{ name: string; name_hi?: string; note?: string }>;
  institutions: Array<{ name: string; type: "school" | "college" | "hospital" | "other"; note?: string }>;
};

export type ProfileEconomic = {
  occupations: Array<Fact & { label: string; label_hi?: string }>;
  agriculture?: Fact;
  industry?: Fact;
  schemes: Array<{ name: string; name_hi?: string; coverage_note: string; source: string; as_of: string }>;
  projects: Array<{ title: string; title_hi?: string; status: "proposed" | "ongoing" | "done"; year?: number; note?: string }>;
  issues: Array<{ title: string; title_hi?: string; rank: number; note?: string }>;
};

export type ProfilePolitical = {
  history_note?: Fact;
  key_leaders: Array<{ name: string; name_hi?: string; role: string; note?: string }>;
  organisation_note?: Fact;
  alliances_note?: Fact;
};

export type ConstituencyProfileDoc = {
  _id: ObjectId;
  ac_no: number; // unique index
  snapshot: ProfileSnapshot;
  social: ProfileSocial;
  economic: ProfileEconomic;
  political: ProfilePolitical;
  brief_en?: string; // editable narrative, seeded from ac-series.json `narrative`
  brief_hi?: string;
  /**
   * Set on illustrative/demo content created by `scripts/seed-demo-profile.ts`
   * (never by real curation). Lets any caller filter demo docs out of real
   * queries/exports (e.g. `db.collection("constituency_profiles").find({demo:
   * {$ne: true}})`) — the technical half of the "no fabricated data" guardrail;
   * honest `source` strings on the seeded facts are the human-readable half.
   * A normal doc field: threaded through `buildProfileUpdate()` the same way
   * as `brief_en`/`brief_hi` (settable via patch, otherwise carried over
   * unchanged by the merge — never special-cased away).
   */
  demo?: boolean;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
};

/** The four curated sections, without the doc envelope (_id/ac_no/timestamps/briefs). */
export type ProfileSections = Pick<ConstituencyProfileDoc, "snapshot" | "social" | "economic" | "political">;

/**
 * Patch accepted by `upsertProfile()`. Each section, when present, is
 * merged field-by-field onto the existing section (see `mergeProfileSections`)
 * — sibling fields the patch doesn't mention are left untouched. Array
 * fields (e.g. `social.caste_notes`) are whole-value replacements when
 * present, same as any other field in the section.
 */
export type ProfilePatch = Partial<{
  snapshot: Partial<ProfileSnapshot>;
  social: Partial<ProfileSocial>;
  economic: Partial<ProfileEconomic>;
  political: Partial<ProfilePolitical>;
  brief_en: string;
  brief_hi: string;
  demo: boolean;
}>;

/** The empty/default shape for a section object's required array fields. */
export function defaultProfileSections(): ProfileSections {
  return {
    snapshot: {},
    social: { caste_notes: [], communities: [], institutions: [] },
    economic: { occupations: [], schemes: [], projects: [], issues: [] },
    political: { key_leaders: [] },
  };
}

/**
 * Pure, DB-free section-wise deep merge: for each of the four sections
 * present in `patch`, shallow-merges the patch section's own fields onto
 * the existing section (`{ ...existingSection, ...patchSection }`). A
 * section entirely absent from `patch` is carried over unchanged. This is
 * NOT a blind `$set` of the whole nested object — fields within a touched
 * section that the patch doesn't mention are preserved from `existing`.
 */
export function mergeProfileSections(existing: ProfileSections, patch: ProfilePatch): ProfileSections {
  // Built explicitly from the four known section keys — never `{ ...existing }`
  // — because `existing` at the call site is often a full ConstituencyProfileDoc
  // (envelope fields and all), and a blind spread would silently let
  // _id/ac_no/brief_en/brief_hi/updated_by/timestamps leak into a value whose
  // own type claims to be section-only. Written out per-section (rather than
  // looping over the four keys and indexing generically) so each merge stays
  // correlated to its own section's type — no `any`/union-indexing escape
  // hatch needed.
  return {
    snapshot: patch.snapshot !== undefined ? { ...existing.snapshot, ...patch.snapshot } : existing.snapshot,
    social: patch.social !== undefined ? { ...existing.social, ...patch.social } : existing.social,
    economic: patch.economic !== undefined ? { ...existing.economic, ...patch.economic } : existing.economic,
    political: patch.political !== undefined ? { ...existing.political, ...patch.political } : existing.political,
  };
}

/** Synthetic "empty" doc used as `before` when no profile exists yet for an AC. */
function emptyProfile(acNo: number, now: Date): ConstituencyProfileDoc {
  return {
    _id: new ObjectId(),
    ac_no: acNo,
    ...defaultProfileSections(),
    updated_by: "",
    created_at: now,
    updated_at: now,
  };
}

/**
 * Fully-shaped "nothing curated yet" doc for `acNo` — every section present
 * (`snapshot`/`social`/`economic`/`political` all defined objects, array
 * fields `[]` not `undefined`), no facts populated. This is the "or empty
 * skeleton" shape the future `GET /api/v1/acs/:ac/profile` route returns
 * when `getProfile()` resolves `null`, so consumers can render against it
 * without special-casing missing nested objects. Thin public wrapper around
 * the same `emptyProfile()` helper `buildProfileUpdate()` uses internally
 * for its creation-path `before`.
 */
export function emptyProfileSkeleton(acNo: number): ConstituencyProfileDoc {
  return emptyProfile(acNo, new Date());
}

/**
 * Pure core of `upsertProfile()`: given the current DB state (or `null` if
 * no profile exists for `acNo` yet) and a patch, computes the `{before,
 * after}` pair the caller will persist and hand to `diffFields()`. Has no
 * DB dependency, which is what makes it unit-testable in isolation.
 */
export function buildProfileUpdate(
  existing: ConstituencyProfileDoc | null,
  acNo: number,
  patch: ProfilePatch,
  userId: string,
  now: Date = new Date()
): { before: ConstituencyProfileDoc; after: ConstituencyProfileDoc } {
  const before = existing ?? emptyProfile(acNo, now);
  const mergedSections = mergeProfileSections(before, patch);

  const after: ConstituencyProfileDoc = {
    _id: before._id,
    ac_no: acNo,
    ...mergedSections,
    brief_en: patch.brief_en !== undefined ? patch.brief_en : before.brief_en,
    brief_hi: patch.brief_hi !== undefined ? patch.brief_hi : before.brief_hi,
    demo: patch.demo !== undefined ? patch.demo : before.demo,
    updated_by: userId,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
  };

  return { before, after };
}

/**
 * Pure post-step for the creation path: `before` from `buildProfileUpdate()`
 * carries a synthetic placeholder `_id` (minted by `emptyProfile()`, since no
 * real doc existed yet to read one from) that never matched, and was never
 * meant to match, the real DB-assigned `_id` the insert produces. Left
 * misaligned, a caller piping `{before, after}` into `diffFields()` would see
 * a spurious "_id changed" entry on every single profile creation, even
 * though `_id` isn't something the patch ever touched. `wasExisting` is
 * whether a doc already existed pre-write (i.e. this was an update, not a
 * creation) — the update path's `before` already carries the real `_id` and
 * is returned unchanged.
 */
export function reconcileCreationId(
  before: ConstituencyProfileDoc,
  after: ConstituencyProfileDoc,
  wasExisting: boolean
): ConstituencyProfileDoc {
  if (wasExisting) return before;
  return { ...before, _id: after._id };
}

/**
 * Computes exactly what `upsertProfile()` passes to MongoDB's `$set` — split
 * out as its own pure function (no DB dependency) so this scoping behavior
 * is unit-testable without a live MongoDB connection, matching this file's
 * existing "DB-dependent tests live elsewhere" convention (see
 * `profileRepo.test.ts`'s closing comment).
 *
 * Creation (`existing === null`): no prior doc exists to clobber, so `$set`
 * gets the FULL merged doc (every section's default shape, not just the
 * patched ones) so a fresh profile is completely shaped from the start —
 * same behavior as before this function existed.
 *
 * Update (`existing !== null`): `$set` gets ONLY the top-level keys the
 * caller's `patch` itself touched — mapped through `after`'s already-merged
 * section values — plus the always-updated bookkeeping fields
 * (`updated_by`, `updated_at`, and `demo` only when `patch.demo` is set).
 * This is the fix for a real concurrent-multi-admin-editing data-loss race:
 * writing the whole merged `after` unconditionally meant every save
 * re-`$set` all four top-level sections regardless of which one the caller
 * actually patched, so a second admin's save — computed from a doc read
 * BEFORE a first admin's concurrent write landed — could silently revert
 * the first admin's untouched-by-B section back to its pre-write value.
 * Scoping `$set` to only the patched keys means a save can never touch a
 * section it didn't itself patch, no matter how stale its own read was.
 */
export function buildSetFields(
  existing: ConstituencyProfileDoc | null,
  after: ConstituencyProfileDoc,
  patch: ProfilePatch
): Record<string, unknown> {
  if (existing === null) {
    const { _id: _afterId, ...rest } = after;
    void _afterId;
    return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  }

  const setFields: Record<string, unknown> = {
    updated_by: after.updated_by,
    updated_at: after.updated_at,
  };
  if (patch.snapshot !== undefined) setFields.snapshot = after.snapshot;
  if (patch.social !== undefined) setFields.social = after.social;
  if (patch.economic !== undefined) setFields.economic = after.economic;
  if (patch.political !== undefined) setFields.political = after.political;
  if (patch.brief_en !== undefined) setFields.brief_en = after.brief_en;
  if (patch.brief_hi !== undefined) setFields.brief_hi = after.brief_hi;
  if (patch.demo !== undefined) setFields.demo = after.demo;
  return setFields;
}

export async function ensureProfileIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection("constituency_profiles").createIndex({ ac_no: 1 }, { unique: true });
}

export async function getProfile(acNo: number): Promise<ConstituencyProfileDoc | null> {
  const db = await getDb();
  return db.collection<ConstituencyProfileDoc>("constituency_profiles").findOne({ ac_no: acNo });
}

/**
 * Section-wise deep-merge upsert. Returns `{before, after}` (both full
 * docs) so a caller — a later task's API route — can pass them straight
 * into `diffFields()` from `@/lib/audit/logAudit` to build a real audit
 * diff, the same way `usersRepo.updateUser()` does.
 */
export async function upsertProfile(
  acNo: number,
  patch: ProfilePatch,
  userId: string
): Promise<{ before: ConstituencyProfileDoc; after: ConstituencyProfileDoc }> {
  const db = await getDb();
  const col = db.collection<ConstituencyProfileDoc>("constituency_profiles");
  const existing = await col.findOne({ ac_no: acNo });

  const { before: computedBefore, after: computedAfter } = buildProfileUpdate(existing, acNo, patch, userId);
  // Scoped to only the patch's own top-level keys (plus bookkeeping) on the
  // update path — see `buildSetFields()` doc comment for why (finding 6:
  // concurrent-write data-loss fix).
  const setFields = buildSetFields(existing, computedAfter, patch);

  await col.updateOne({ ac_no: acNo }, { $set: setFields }, { upsert: true });
  const after = (await col.findOne({ ac_no: acNo })) as ConstituencyProfileDoc;
  const before = reconcileCreationId(computedBefore, after, existing !== null);

  return { before, after };
}

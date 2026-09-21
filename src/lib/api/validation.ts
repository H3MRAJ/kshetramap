import { z } from "zod";

export const roleEnum = z.enum(["super_admin", "admin", "candidate", "worker", "viewer"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name required"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleEnum,
  ac_scope: z.array(z.number().int()).default([]),
  email: z.string().email().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: roleEnum.optional(),
  ac_scope: z.array(z.number().int()).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// ---------------------------------------------------------------------------
// Constituency profile patch (B3: PUT /api/v1/acs/:ac/profile)
//
// Mirrors the shapes in `@/lib/profile/profileRepo` field-for-field. Kept in
// this file (not a parallel validation module) per B-Task 4's brief. Every
// section is optional and, within a present section, every field is also
// optional (`mergeProfileSections` shallow-merges only the fields the patch
// actually sends) — "deep-partial" in the profile-patch sense. Array-typed
// fields (e.g. `social.caste_notes`) are whole-value replacements when
// present, so their item schemas require the item's own real fields rather
// than being partial themselves.
// ---------------------------------------------------------------------------

/**
 * A single curated `{value, source, as_of, note?}` fact. `source`/`as_of`
 * are required non-empty strings — the UI renders "—" for a fact with no
 * citation, so a patch must never introduce a fact without one. `value`'s
 * type is parameterized because `ProfileSnapshot.literacy_pct`/`sex_ratio`
 * are `Fact<number>` while every other fact in the schema is `Fact<string>`
 * (the profileRepo default) — see `numericFactSchema` below.
 */
function makeFactSchema<V extends z.ZodTypeAny>(valueSchema: V) {
  return z.object({
    value: valueSchema,
    source: z.string().trim().min(1, "Fact source is required"),
    as_of: z.string().trim().min(1, "Fact as_of is required"),
    note: z.string().optional(),
  });
}

export const factSchema = makeFactSchema(z.string());
const numericFactSchema = makeFactSchema(z.number());

const casteNoteSchema = z.object({
  group: z.string(),
  group_hi: z.string().optional(),
  note: z.string(),
  note_hi: z.string().optional(),
  source: z.string().trim().min(1, "Caste note source is required"),
  as_of: z.string().trim().min(1, "Caste note as_of is required"),
  granularity: z.enum(["district", "block", "ac", "qualitative"]),
});

const communitySchema = z.object({
  name: z.string(),
  name_hi: z.string().optional(),
  note: z.string().optional(),
});

const institutionSchema = z.object({
  name: z.string(),
  type: z.enum(["school", "college", "hospital", "other"]),
  note: z.string().optional(),
});

const occupationSchema = factSchema.extend({
  label: z.string(),
  label_hi: z.string().optional(),
});

const schemeSchema = z.object({
  name: z.string(),
  name_hi: z.string().optional(),
  coverage_note: z.string(),
  source: z.string().trim().min(1, "Scheme source is required"),
  as_of: z.string().trim().min(1, "Scheme as_of is required"),
});

const projectSchema = z.object({
  title: z.string(),
  title_hi: z.string().optional(),
  status: z.enum(["proposed", "ongoing", "done"]),
  year: z.number().int().optional(),
  note: z.string().optional(),
});

const issueSchema = z.object({
  title: z.string(),
  title_hi: z.string().optional(),
  rank: z.number().int(),
  note: z.string().optional(),
});

const keyLeaderSchema = z.object({
  name: z.string(),
  name_hi: z.string().optional(),
  role: z.string(),
  note: z.string().optional(),
});

const profileSnapshotPatchSchema = z.object({
  area_note: factSchema.optional(),
  hq_note: factSchema.optional(),
  blocks: factSchema.optional(),
  panchayats: factSchema.optional(),
  literacy_pct: numericFactSchema.optional(),
  sex_ratio: numericFactSchema.optional(),
});

const profileSocialPatchSchema = z.object({
  caste_notes: z.array(casteNoteSchema).optional(),
  religion_note: factSchema.optional(),
  migration_note: factSchema.optional(),
  communities: z.array(communitySchema).optional(),
  institutions: z.array(institutionSchema).optional(),
});

const profileEconomicPatchSchema = z.object({
  occupations: z.array(occupationSchema).optional(),
  agriculture: factSchema.optional(),
  industry: factSchema.optional(),
  schemes: z.array(schemeSchema).optional(),
  projects: z.array(projectSchema).optional(),
  issues: z.array(issueSchema).optional(),
});

const profilePoliticalPatchSchema = z.object({
  history_note: factSchema.optional(),
  key_leaders: z.array(keyLeaderSchema).optional(),
  organisation_note: factSchema.optional(),
  alliances_note: factSchema.optional(),
});

export const profilePatchSchema = z.object({
  snapshot: profileSnapshotPatchSchema.optional(),
  social: profileSocialPatchSchema.optional(),
  economic: profileEconomicPatchSchema.optional(),
  political: profilePoliticalPatchSchema.optional(),
  brief_en: z.string().optional(),
  brief_hi: z.string().optional(),
  demo: z.boolean().optional(),
});

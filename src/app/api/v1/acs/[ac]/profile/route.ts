import { NextResponse } from "next/server";
import { requireApiSession, checkAcScope, apiError } from "@/lib/api/session";
import { profilePatchSchema } from "@/lib/api/validation";
import {
  getProfile,
  upsertProfile,
  emptyProfileSkeleton,
  type ConstituencyProfileDoc,
  type ProfilePatch,
} from "@/lib/profile/profileRepo";
import { logAudit, diffFields } from "@/lib/audit/logAudit";

/**
 * Write-bookkeeping fields on `ConstituencyProfileDoc` that change on every
 * single write regardless of what the patch actually touched (`_id` never
 * changes post-creation but is included for completeness/symmetry). Stripped
 * before diffing so `profile.update` audit entries only ever reflect the
 * profile's real content sections (`snapshot`/`social`/`economic`/
 * `political`/`brief_en`/`brief_hi`/`demo`) — never write-bookkeeping noise.
 * Kept local to this route (not a `diffFields`/`logAudit.ts` change) since
 * it's specific to how this one route uses `diffFields`.
 */
function stripBookkeeping(doc: ConstituencyProfileDoc): Record<string, unknown> {
  const { _id, created_at, updated_at, updated_by, ...content } = doc;
  void _id;
  void created_at;
  void updated_at;
  void updated_by;
  return content;
}

/** `Number(ac)` on a non-numeric segment yields `NaN`, not a throw — must be checked explicitly. */
function parseAcParam(ac: string): number | null {
  const acNo = Number(ac);
  return Number.isNaN(acNo) ? null : acNo;
}

/**
 * Builds a dynamic audit summary listing the exact fields the patch touched
 * (e.g. "Updated economic.schemes, brief_en for AC 178") — deliberately NOT
 * a static string, so the audit trail reflects what actually changed on
 * each individual PUT rather than a fixed template.
 */
function summarizePatch(patch: ProfilePatch, acNo: number): string {
  const touched: string[] = [];
  for (const section of ["snapshot", "social", "economic", "political"] as const) {
    const value = patch[section];
    if (value && typeof value === "object") {
      for (const field of Object.keys(value)) {
        touched.push(`${section}.${field}`);
      }
    }
  }
  if (patch.brief_en !== undefined) touched.push("brief_en");
  if (patch.brief_hi !== undefined) touched.push("brief_hi");
  if (patch.demo !== undefined) touched.push("demo");

  const what = touched.length > 0 ? touched.join(", ") : "profile";
  return `Updated ${what} for AC ${acNo}`;
}

/**
 * GET /api/v1/acs/:ac/profile — viewer+ (any authenticated role), gated by
 * `hasAcScope` for every role including viewer (`super_admin` bypasses, per
 * `requireApiSession`'s existing behavior). `allowed` is passed as
 * `undefined` because "viewer+" spans every role in the system — the AC
 * scope check (via `checkAcScope` below) is the only gate that matters here.
 *
 * Auth runs BEFORE `ac` param parsing (finding 9, Phase B final-review):
 * `requireApiSession()` is called with no `acNo` first, so an unauthenticated
 * caller always gets 401 — never a 400 that would depend on whether their
 * `ac` param happened to parse as a number. The AC-scope half of the check
 * (which does need the parsed `acNo`) runs via `checkAcScope` once `acNo` is
 * known to be valid.
 */
export async function GET(request: Request, { params }: { params: Promise<{ ac: string }> }) {
  const result = await requireApiSession();
  if ("error" in result) return result.error;
  const { session } = result;

  const { ac } = await params;
  const acNo = parseAcParam(ac);
  if (acNo === null) return apiError(400, "invalid_ac", "AC must be a number");

  const scopeError = checkAcScope(session, acNo);
  if (scopeError) return scopeError;

  const profile = await getProfile(acNo);
  return NextResponse.json({ profile: profile ?? emptyProfileSkeleton(acNo) });
}

/**
 * PUT /api/v1/acs/:ac/profile — admin+ AND must pass `hasAcScope` (an admin
 * whose `ac_scope` doesn't include this AC may not edit it; `super_admin`
 * bypasses both the role and scope checks as always).
 *
 * Same "auth before ac-param parsing" ordering as `GET` above (finding 9).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ ac: string }> }) {
  const result = await requireApiSession(["admin"]);
  if ("error" in result) return result.error;
  const { session } = result;

  const { ac } = await params;
  const acNo = parseAcParam(ac);
  if (acNo === null) return apiError(400, "invalid_ac", "AC must be a number");

  const scopeError = checkAcScope(session, acNo);
  if (scopeError) return scopeError;

  const body = await request.json().catch(() => null);
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid_input", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { before, after } = await upsertProfile(acNo, parsed.data, session.user.id);

  // Diffed from the repo's own {before, after} doc pair (per the brief),
  // with write-bookkeeping fields (_id/created_at/updated_at/updated_by)
  // stripped first — those change on every write regardless of what the
  // patch touched, and would otherwise show up as permanent noise on every
  // single profile.update audit entry. Section-granular diff behavior
  // (untouched sections never leak into the diff) is unaffected — see
  // profileRepo.test.ts's coverage of that property at the buildProfileUpdate
  // level, which this route's diffFields call inherits unchanged.
  const diff = diffFields(stripBookkeeping(before), stripBookkeeping(after));

  await logAudit({
    actorId: session.user.id,
    actorRole: session.user.role,
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
    action: "profile.update",
    entity: "constituency_profiles",
    entityId: String(acNo),
    acNo,
    summary: summarizePatch(parsed.data, acNo),
    diff,
  });

  return NextResponse.json({ profile: after });
}

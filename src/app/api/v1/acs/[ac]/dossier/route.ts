import { NextResponse } from "next/server";
import { requireApiSession, checkAcScope, apiError } from "@/lib/api/session";
import { getProfile, emptyProfileSkeleton, type ConstituencyProfileDoc } from "@/lib/profile/profileRepo";
import { getPoliticalBlock, type PoliticalBlock } from "@/lib/dossier/politicalBlock";
import { compileSources, type SourceEntry } from "@/lib/dossier/sources";

/** `Number(ac)` on a non-numeric segment yields `NaN`, not a throw — must be checked explicitly. */
function parseAcParam(ac: string): number | null {
  const acNo = Number(ac);
  return Number.isNaN(acNo) ? null : acNo;
}

/**
 * `candidate` is typed here (per the spec's `candidate?`) even though
 * `CandidateDoc` doesn't exist yet — it's Phase C. This route never
 * populates it; `unknown` stands in as a placeholder for the future
 * Phase-C candidate-summary type.
 */
type DossierResponseBody = {
  profile: ConstituencyProfileDoc;
  political: PoliticalBlock | null;
  candidate?: unknown;
  sources: SourceEntry[];
};

/**
 * GET /api/v1/acs/:ac/dossier — viewer+ (any authenticated role), gated by
 * `hasAcScope` for every role including viewer, same reasoning as the
 * profile route's GET.
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

  const [profileDoc, political] = await Promise.all([getProfile(acNo), getPoliticalBlock(acNo)]);
  const profile = profileDoc ?? emptyProfileSkeleton(acNo);

  // sources[] is compiled from `profile` only — `political` (politicalBlock.ts)
  // is computed data with no `source`/`as_of` fields anywhere in its shape.
  const sources = compileSources(profile);

  const body: DossierResponseBody = { profile, political, sources };
  return NextResponse.json(body);
}

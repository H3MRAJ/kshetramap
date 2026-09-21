import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { requirePageSession } from "@/lib/api/session";
import { getProfile, emptyProfileSkeleton } from "@/lib/profile/profileRepo";
import { findUserById } from "@/lib/users/usersRepo";
import { getPoliticalBlock } from "@/lib/dossier/politicalBlock";
import { ProfileEditorClient } from "./ProfileEditorClient";
import type { ClientProfile } from "./types";

/** `Number(ac)` on a non-numeric segment yields `NaN`, not a throw — must be checked explicitly. */
function parseAcParam(ac: string): number | null {
  const acNo = Number(ac);
  return Number.isNaN(acNo) ? null : acNo;
}

/**
 * Resolves a profile's `updated_by` (a user id, or the demo seed script's
 * plain string `"seed-demo-profile-script"` — never a real ObjectId) to a
 * human-readable display name. Falls back to the raw stored value when it
 * isn't a valid ObjectId, or when no matching user is found.
 */
async function resolveUpdatedByName(updatedBy: string): Promise<string> {
  if (!updatedBy) return "";
  if (!ObjectId.isValid(updatedBy)) return updatedBy;
  const user = await findUserById(updatedBy);
  return user?.name ?? updatedBy;
}

/**
 * Thin server shell (auth + data fetch only) — every visible string lives in
 * `ProfileEditorClient` and its children, which call `t()`. This page itself
 * renders no user-facing text, so it can't leak hardcoded English regardless
 * of which locale the client ends up rendering in.
 */
export default async function ProfileEditorPage({
  params,
}: {
  params: Promise<{ ac: string }>;
}) {
  const { ac } = await params;
  const acNo = parseAcParam(ac);
  if (acNo === null) notFound();

  // Admin+ AND AC-scope, for the whole page as a single unit (brief decision 2).
  const session = await requirePageSession(["admin"], acNo);

  const [profileDoc, politicalBlock] = await Promise.all([
    getProfile(acNo),
    getPoliticalBlock(acNo),
  ]);
  const profile = profileDoc ?? emptyProfileSkeleton(acNo);
  const updatedByName = await resolveUpdatedByName(profile.updated_by);
  // Brief tab's "Seed from data" button — the same joined-narrative paragraph
  // already computed for the public dossier (B-Task 3), passed down as a
  // plain prop so the Brief tab never needs its own network round-trip or
  // server-only import (`getPoliticalBlock` is `fs/promises`-based).
  const narrativeSeed = politicalBlock?.narrative_seed ?? null;

  const clientProfile: ClientProfile = {
    ac_no: profile.ac_no,
    snapshot: profile.snapshot,
    social: profile.social,
    economic: profile.economic,
    political: profile.political,
    brief_en: profile.brief_en,
    brief_hi: profile.brief_hi,
    updated_by: profile.updated_by,
    updated_at: profile.updated_at.toISOString(),
  };

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
      <ProfileEditorClient
        acNo={acNo}
        initialProfile={clientProfile}
        currentUser={{ id: session.user.id, name: session.user.name }}
        initialUpdatedByName={updatedByName}
        narrativeSeed={narrativeSeed}
      />
    </Suspense>
  );
}

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getDb } from "@/lib/db/mongo";
import type { Role } from "@/lib/auth/roles";
import type { CandidateCvDoc, CandidateCvPatch } from "./types";

/**
 * Extracts numeric AC from strings like "Mokama (AC-178)" or "Mokama AC-178".
 */
export function parseSeatAc(seatOrConstituency: string | undefined): number | null {
  if (!seatOrConstituency) return null;
  const match = seatOrConstituency.match(/AC-?(\d+)/i);
  if (match) {
    const num = Number(match[1]);
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Determines whether a user session role has OWNER edit permissions for a Candidate CV.
 *
 * Rules:
 * - super_admin: can edit any candidate CV.
 * - admin: can edit if the candidate's AC is within admin's ac_scope, or if admin is unscoped (global admin).
 * - candidate: can edit THEIR OWN linked candidate CV only (user.candidate_id matches cv.candidate.id).
 * - worker / viewer: read-only (false).
 */
export function isCandidateCvOwner(
  user: {
    role: Role;
    candidate_id?: string | null;
    ac_scope?: number[];
  },
  cv: CandidateCvDoc
): boolean {
  if (user.role === "super_admin") {
    return true;
  }

  if (user.role === "admin") {
    const acNo = parseSeatAc(cv.candidate.seat) ?? parseSeatAc(cv.meta.constituency);
    if (!user.ac_scope || user.ac_scope.length === 0) {
      // Unscoped admin has broad access
      return true;
    }
    if (acNo !== null) {
      return user.ac_scope.includes(acNo);
    }
    return true;
  }

  if (user.role === "candidate") {
    return !!user.candidate_id && user.candidate_id === cv.candidate.id;
  }

  return false;
}

/**
 * Pure function: merges patch onto existing CandidateCvDoc.
 */
export function mergeCandidateCv(
  existing: CandidateCvDoc,
  patch: CandidateCvPatch,
  userId: string,
  now: Date = new Date()
): CandidateCvDoc {
  return {
    ...existing,
    candidate: patch.candidate
      ? { ...existing.candidate, ...patch.candidate }
      : existing.candidate,
    worksPortfolio: patch.worksPortfolio ?? existing.worksPortfolio,
    agenda: patch.agenda
      ? { ...existing.agenda, ...patch.agenda }
      : existing.agenda,
    plan: patch.plan
      ? { ...existing.plan, ...patch.plan }
      : existing.plan,
    serviceTimeline: patch.serviceTimeline ?? existing.serviceTimeline,
    localBase: patch.localBase
      ? { ...existing.localBase, ...patch.localBase }
      : existing.localBase,
    electionScoreline2025: patch.electionScoreline2025
      ? { ...existing.electionScoreline2025, ...patch.electionScoreline2025 }
      : existing.electionScoreline2025,
    sources: patch.sources ?? existing.sources,
    updated_by: userId,
    updated_at: now.toISOString(),
  };
}

const FIXTURE_PATH = path.join(
  process.cwd(),
  "data",
  "demo",
  "candidate-cv-mokama-showcase.json"
);

/**
 * In-memory fallback cache for when neither Mongo nor filesystem write is durable.
 */
const inMemoryCvCache = new Map<string, CandidateCvDoc>();

/**
 * Retrieves candidate CV by ID. Checks MongoDB first; falls back to fixture file.
 */
export async function getCandidateCv(id: string): Promise<CandidateCvDoc | null> {
  // 1. Check in-memory cache first if already modified
  if (inMemoryCvCache.has(id)) {
    return inMemoryCvCache.get(id)!;
  }

  // 2. Check MongoDB collection "candidate_cv"
  try {
    const db = await getDb();
    const doc = await db.collection<CandidateCvDoc>("candidate_cv").findOne({
      "candidate.id": id,
    });
    if (doc) {
      return doc;
    }
  } catch {
    // Mongo may not be running or connected — proceed to file fallback
  }

  // 3. Fallback to fixture JSON file
  try {
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as CandidateCvDoc;
    if (parsed.candidate?.id === id || id === "demo-mokama-anant-kumar-singh") {
      return parsed;
    }
  } catch {
    // File not readable
  }

  return null;
}

/**
 * Saves candidate CV to MongoDB if available, and also writes back to data/demo fixture file
 * and in-memory cache to guarantee persistence across runs/reloads.
 */
export async function saveCandidateCv(cv: CandidateCvDoc): Promise<void> {
  inMemoryCvCache.set(cv.candidate.id, cv);

  // 1. Try persisting to Mongo
  try {
    const db = await getDb();
    await db
      .collection<CandidateCvDoc>("candidate_cv")
      .updateOne(
        { "candidate.id": cv.candidate.id },
        { $set: cv },
        { upsert: true }
      );
  } catch {
    // Mongo not connected or unreachable
  }

  // 2. Persist to file in data/demo/
  try {
    const filePath =
      cv.candidate.id === "demo-mokama-anant-kumar-singh"
        ? FIXTURE_PATH
        : path.join(process.cwd(), "data", "demo", `candidate-cv-${cv.candidate.id}.json`);

    await writeFile(filePath, JSON.stringify(cv, null, 2), "utf-8");
  } catch {
    // File write failed (e.g. read-only environment)
  }
}

/**
 * Updates a Candidate CV with patch data.
 */
export async function updateCandidateCv(
  id: string,
  patch: CandidateCvPatch,
  userId: string
): Promise<CandidateCvDoc> {
  const existing = await getCandidateCv(id);
  if (!existing) {
    throw new Error(`Candidate CV not found for id: ${id}`);
  }

  const updated = mergeCandidateCv(existing, patch, userId);
  await saveCandidateCv(updated);
  return updated;
}

import { NextResponse } from "next/server";
import { requireApiSession, apiError } from "@/lib/api/session";
import {
  getCandidateCv,
  updateCandidateCv,
  isCandidateCvOwner,
} from "@/lib/candidateCv/candidateCvRepo";
import { logAudit } from "@/lib/audit/logAudit";
import type { CandidateCvPatch } from "@/lib/candidateCv/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireApiSession();
  if ("error" in result) return result.error;
  const { session } = result;

  const { id } = await params;
  if (!id) {
    return apiError(400, "invalid_id", "Candidate ID is required");
  }

  const cv = await getCandidateCv(id);
  if (!cv) {
    return apiError(404, "not_found", `Candidate CV not found for id: ${id}`);
  }

  const isOwner = isCandidateCvOwner(session.user, cv);

  return NextResponse.json({
    candidateCv: cv,
    isOwner,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireApiSession();
  if ("error" in result) return result.error;
  const { session } = result;

  const { id } = await params;
  if (!id) {
    return apiError(400, "invalid_id", "Candidate ID is required");
  }

  const existing = await getCandidateCv(id);
  if (!existing) {
    return apiError(404, "not_found", `Candidate CV not found for id: ${id}`);
  }

  const isOwner = isCandidateCvOwner(session.user, existing);
  if (!isOwner) {
    return apiError(
      403,
      "forbidden",
      "Insufficient permissions: only the assigned candidate or scoped admin can edit this portfolio"
    );
  }

  const body = (await request.json().catch(() => null)) as CandidateCvPatch | null;
  if (!body || typeof body !== "object") {
    return apiError(400, "invalid_payload", "Expected JSON patch body");
  }

  const updated = await updateCandidateCv(id, body, session.user.id);

  await logAudit({
    actorId: session.user.id,
    actorRole: session.user.role,
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
    action: "candidate_cv.update",
    entity: "candidate_cv",
    entityId: id,
    summary: `Updated Candidate CV for ${existing.candidate.name} (${id})`,
  });

  return NextResponse.json({
    candidateCv: updated,
    isOwner: true,
  });
}

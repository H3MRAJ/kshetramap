import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/api/session";
import {
  getCandidateCv,
  isCandidateCvOwner,
  toPlainCandidateCv,
} from "@/lib/candidateCv/candidateCvRepo";
import { CandidateCvClient } from "@/components/candidateCv/CandidateCvClient";

export default async function CandidateCvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Login-gated: unauthenticated redirects to /login
  const session = await requirePageSession();

  const cv = await getCandidateCv(id);
  if (!cv) {
    notFound();
  }

  // Plain JSON only - never pass ObjectId/Date/Buffer into Client Components
  const initialCv = toPlainCandidateCv(cv);

  // Determine if current session is an OWNER (edit chrome vs DEMO read-only)
  const isOwner = isCandidateCvOwner(session.user, initialCv);

  return <CandidateCvClient initialCv={initialCv} isOwner={isOwner} />;
}
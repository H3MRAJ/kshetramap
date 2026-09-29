import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/api/session";
import { getCandidateCv, isCandidateCvOwner } from "@/lib/candidateCv/candidateCvRepo";
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

  // Determine if current session is an OWNER
  const isOwner = isCandidateCvOwner(session.user, cv);

  return <CandidateCvClient initialCv={cv} isOwner={isOwner} />;
}

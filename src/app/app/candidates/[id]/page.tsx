import { Suspense } from "react";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;

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

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1220] p-8 text-[#F4EFE6]">Loading candidate portfolio...</div>}>
      <CandidateCvClient initialCv={initialCv} isOwner={isOwner} initialView={view} />
    </Suspense>
  );
}
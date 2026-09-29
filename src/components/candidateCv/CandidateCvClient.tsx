"use client";

import React, { useState } from "react";
import { DemoBanner } from "./DemoBanner";
import { IdentityStrip } from "./IdentityStrip";
import { LeftRailToc } from "./LeftRailToc";
import { ServiceTimeline } from "./ServiceTimeline";
import { WorksCards } from "./WorksCards";
import { AgendaPillars } from "./AgendaPillars";
import { PlanRoadmap } from "./PlanRoadmap";
import { LocalBaseCard } from "./LocalBaseCard";
import { ScorelineWin } from "./ScorelineWin";
import { SourcesFooter } from "./SourcesFooter";
import { EvidenceBadge } from "./EvidenceBadge";
import type {
  CandidateCvDoc,
  CandidateCvWork,
  CandidateCvAgenda,
  CandidateCvPlan,
} from "@/lib/candidateCv/types";

interface CandidateCvClientProps {
  initialCv: CandidateCvDoc;
  isOwner: boolean;
}

export function CandidateCvClient({ initialCv, isOwner }: CandidateCvClientProps) {
  const [cv, setCv] = useState<CandidateCvDoc>(initialCv);
  const [editState, setEditState] = useState<CandidateCvDoc>(initialCv);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleEdit = () => {
    if (!isEditing) {
      setEditState(JSON.parse(JSON.stringify(cv)));
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditState(JSON.parse(JSON.stringify(cv)));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/candidates/${cv.candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate: editState.candidate,
          worksPortfolio: editState.worksPortfolio,
          agenda: editState.agenda,
          plan: editState.plan,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to save changes (${res.status})`
        );
      }

      const data = await res.json();
      setCv(data.candidateCv);
      setEditState(data.candidateCv);
      setIsEditing(false);
      showToast("Candidate portfolio saved successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving";
      showToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfClick = () => {
    showToast("PDF campaign portfolio export scheduled for Phase B");
  };

  const currentData = isEditing ? editState : cv;

  // Handlers for edit mode
  const handleSummaryChange = (val: string) => {
    setEditState((prev) => ({
      ...prev,
      candidate: { ...prev.candidate, oneLiner: val },
    }));
  };

  const handleTagsChange = (val: string) => {
    const tags = val.split(",").map((t) => t.trim()).filter(Boolean);
    setEditState((prev) => ({
      ...prev,
      candidate: { ...prev.candidate, tags },
    }));
  };

  const handleWorksChange = (works: CandidateCvWork[]) => {
    setEditState((prev) => ({
      ...prev,
      worksPortfolio: works,
    }));
  };

  const handleAgendaChange = (agenda: CandidateCvAgenda) => {
    setEditState((prev) => ({
      ...prev,
      agenda,
    }));
  };

  const handlePlanChange = (plan: CandidateCvPlan) => {
    setEditState((prev) => ({
      ...prev,
      plan,
    }));
  };

  return (
    <div
      className="-m-4 min-h-[calc(100vh-45px)] bg-[var(--km-ink)] text-[var(--km-text-on-ink)] pb-12"
      style={{
        fontFamily: "var(--km-font-sans)",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-[var(--km-navy)] border border-[var(--km-accent)] px-4 py-2.5 text-xs text-white shadow-xl flex items-center gap-2">
          <span className="text-[var(--km-accent)]">●</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* CV-01: Demo honesty banner (sticky) */}
      <DemoBanner meta={currentData.meta} />

      {/* CV-02: Identity strip (sticky under banner) */}
      <IdentityStrip
        candidate={currentData.candidate}
        meta={currentData.meta}
        isOwner={isOwner}
        isEditing={isEditing}
        isSaving={isSaving}
        hasUnsavedChanges={true}
        onToggleEdit={handleToggleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onPdfClick={handlePdfClick}
      />

      {/* Main Container Layout */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8 md:px-8">
        {/* CV-08: Left rail TOC + Map Stub */}
        <LeftRailToc blocks={currentData.localBase?.blocks} />

        {/* Main Content Area (Warm Paper Panel) */}
        <main
          id="cv"
          className="flex-1 rounded-lg border border-[var(--km-paper-line)] bg-[var(--km-paper)] p-6 md:p-8 text-[var(--km-text)] shadow-sm space-y-10 min-w-0"
        >
          {/* Section 1: Summary */}
          <section id="summary" aria-labelledby="summary-heading" className="scroll-mt-32">
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[var(--km-paper-line)]">
              <h2
                id="summary-heading"
                className="text-lg md:text-xl font-bold text-[var(--km-text)]"
                style={{ fontFamily: "var(--km-font-display)" }}
              >
                Summary
              </h2>
              <span className="text-xs text-[var(--km-slate)]">• Campaign strengths &amp; focus</span>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--km-slate)] mb-1">
                    Candidate Profile Summary:
                  </label>
                  <textarea
                    rows={3}
                    value={currentData.candidate.oneLiner}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    className="w-full text-sm rounded border border-[var(--km-paper-line)] bg-white p-2.5 text-[var(--km-text)] leading-relaxed focus:ring-1 focus:ring-[var(--km-accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--km-slate)] mb-1">
                    Tags (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={currentData.candidate.tags?.join(", ") || ""}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="w-full text-xs rounded border border-[var(--km-paper-line)] bg-white px-2.5 py-1.5 text-[var(--km-text)] focus:ring-1 focus:ring-[var(--km-accent)]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm md:text-base text-[var(--km-text)] leading-relaxed font-normal">
                  {currentData.candidate.oneLiner}
                </p>

                {/* Tag chips */}
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {currentData.candidate.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-[var(--km-paper-raised)] text-[var(--km-text)] border border-[var(--km-paper-line)] shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Channels */}
                {currentData.candidate.channels && (
                  <div className="mt-4 pt-3 border-t border-[var(--km-paper-line)] flex flex-wrap items-center gap-3 text-xs text-[var(--km-slate)]">
                    <span className="font-semibold text-[var(--km-text)]">
                      Channels:
                    </span>
                    {currentData.candidate.channels.x && (
                      <span className="font-medium text-[var(--km-text-muted)]">
                        X {currentData.candidate.channels.x}
                      </span>
                    )}
                    {currentData.candidate.channels.youtube && (
                      <span className="font-medium text-[var(--km-text-muted)]">
                        YT {currentData.candidate.channels.youtube}
                      </span>
                    )}
                    {currentData.candidate.channels.facebook && (
                      <span className="font-medium text-[var(--km-text-muted)]">
                        FB {currentData.candidate.channels.facebook}
                      </span>
                    )}
                    <EvidenceBadge
                      grade={currentData.candidate.channels.evidenceGrade || "SOURCED-cited"}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 2: Service timeline (CV-04) */}
          <ServiceTimeline timeline={currentData.serviceTimeline} />

          {/* Section 3: Works & delivery (CV-05) */}
          <WorksCards
            works={currentData.worksPortfolio}
            isEditing={isEditing}
            onWorksChange={handleWorksChange}
          />

          {/* Section 4: Agenda (CV-06) */}
          <AgendaPillars
            agenda={currentData.agenda}
            isEditing={isEditing}
            onAgendaChange={handleAgendaChange}
          />

          {/* Section 5: Plan (CV-07) */}
          <PlanRoadmap
            plan={currentData.plan}
            isEditing={isEditing}
            onPlanChange={handlePlanChange}
          />

          {/* Section 6: Local base (CV-09) */}
          <LocalBaseCard localBase={currentData.localBase} />

          {/* Section 7: 2025 win scoreline (CV-10) */}
          <ScorelineWin scoreline={currentData.electionScoreline2025} />

          {/* Section 8: Sources (CV-11) */}
          <SourcesFooter sources={currentData.sources} />
        </main>
      </div>
    </div>
  );
}

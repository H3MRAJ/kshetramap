import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvWork } from "@/lib/candidateCv/types";

interface WorksTeaserProps {
  works: CandidateCvWork[];
  onOpenGazette: () => void;
}

export function WorksTeaser({ works, onOpenGazette }: WorksTeaserProps) {
  const teaserWorks = works.slice(0, 3);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-900/10 text-emerald-800 border-emerald-300";
      case "in progress":
        return "bg-amber-900/10 text-amber-800 border-amber-300";
      case "priority":
        return "bg-[var(--km-accent-soft)] text-[var(--km-accent-ink)] border-[var(--km-accent-soft)]";
      default:
        return "bg-[var(--km-paper)] text-[var(--km-text)] border-[var(--km-paper-line)]";
    }
  };

  return (
    <section id="works" aria-labelledby="works-teaser-heading" className="scroll-mt-44">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-[var(--km-paper-line)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="works-teaser-heading"
            className="text-lg md:text-xl font-bold text-[var(--km-text)]"
            style={{ fontFamily: "var(--km-font-display)" }}
          >
            Works &amp; delivery
          </h2>
          <EvidenceBadge demoLabel="DEMO/FAKE" />
          <span className="text-xs text-[var(--km-slate)] hidden sm:inline">
            • Key delivery highlights
          </span>
        </div>
      </div>

      {/* Teaser Rows (≤3 items) */}
      <div className="space-y-3">
        {teaserWorks.map((work, idx) => {
          const yearsStr =
            work.years?.length > 1
              ? `${work.years[0]}–${work.years[work.years.length - 1]}`
              : String(work.years?.[0] ?? "");

          return (
            <div
              key={work.id || idx}
              className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-3.5 space-y-1.5 shadow-2xs hover:border-[var(--km-accent)]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-[var(--km-text)] leading-snug">
                  {work.title}
                </h3>
                <EvidenceBadge demoLabel={work.demoLabel} grade={work.evidenceGrade} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="tabular-nums font-semibold text-[var(--km-accent-ink)]">
                  {yearsStr}
                </span>
                <span className="text-[var(--km-slate)]">•</span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getStatusClass(
                    work.status
                  )}`}
                >
                  {work.status}
                </span>
              </div>
              <p className="text-xs text-[var(--km-text-muted)] leading-relaxed">
                {work.summary}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA to open full Gazette */}
      <div className="mt-4 pt-3 border-t border-[var(--km-paper-line)] flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-[var(--km-slate)]">
          Showing {teaserWorks.length} of {works.length} delivery receipts
        </span>
        <button
          type="button"
          onClick={onOpenGazette}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--km-navy)] text-white text-xs font-semibold border border-[var(--km-accent)] hover:bg-[var(--km-navy-muted)] transition-colors shadow-sm cursor-pointer"
        >
          <span>Open full Gazette</span>
          <span className="text-[var(--km-accent)]">→</span>
        </button>
      </div>
    </section>
  );
}

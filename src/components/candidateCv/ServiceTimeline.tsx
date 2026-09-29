import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvServiceTimelineNode } from "@/lib/candidateCv/types";

interface ServiceTimelineProps {
  timeline: CandidateCvServiceTimelineNode[];
}

export function ServiceTimeline({ timeline }: ServiceTimelineProps) {
  return (
    <section id="service" aria-labelledby="service-heading" className="scroll-mt-32">
      <div className="flex items-center gap-2 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="service-heading"
          className="text-lg md:text-xl font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          Service timeline
        </h2>
        <span className="text-xs text-[var(--km-slate)]">• Electoral milestones &amp; terms</span>
      </div>

      <ol className="relative border-l-2 border-[var(--km-navy)] ml-3 pl-6 space-y-6 pt-2">
        {timeline.map((node, i) => {
          const isLatest = i === timeline.length - 1;
          return (
            <li key={`${node.year}-${node.title}`} className="relative group">
              {/* Dot node */}
              <span
                aria-hidden
                className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 transition-all ${
                  isLatest
                    ? "bg-[var(--km-accent)] border-[var(--km-accent)] ring-4 ring-[var(--km-accent-soft)]"
                    : "bg-[var(--km-paper)] border-[var(--km-navy)] group-hover:border-[var(--km-accent)]"
                }`}
              />

              <div className="flex flex-wrap items-baseline gap-2.5">
                <time className="tabular-nums font-bold text-sm md:text-base text-[var(--km-text)]">
                  {node.year}
                </time>
                <EvidenceBadge grade={node.evidenceGrade} />
                {isLatest && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase km-badge-soft-accent">
                    Now
                  </span>
                )}
              </div>

              <p className="mt-1 font-semibold text-sm md:text-base text-[var(--km-text)]">
                {node.title}
              </p>
              <p className="text-xs md:text-sm text-[var(--km-text-muted)] mt-0.5">
                {node.detail}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

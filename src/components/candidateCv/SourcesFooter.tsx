import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvSource } from "@/lib/candidateCv/types";

interface SourcesFooterProps {
  sources: CandidateCvSource[];
}

export function SourcesFooter({ sources }: SourcesFooterProps) {
  return (
    <footer id="sources" aria-labelledby="sources-heading" className="scroll-mt-44 pt-4">
      <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="sources-heading"
          className="text-base font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          Sources (proof of delivery)
        </h2>
        <span className="text-xs text-[var(--km-slate)]">• Verified electoral citations</span>
      </div>

      <div className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-4 shadow-none">
        <ul className="space-y-2 text-xs">
          {sources.map((s, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[var(--km-accent)]">•</span>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--km-text)] hover:underline truncate"
                  >
                    {s.label}
                  </a>
                ) : (
                  <span className="font-medium text-[var(--km-text)] truncate">
                    {s.label}
                  </span>
                )}
              </div>
              <EvidenceBadge grade={s.evidenceGrade || "SOURCED"} />
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvLocalBase } from "@/lib/candidateCv/types";

interface LocalBaseCardProps {
  localBase: CandidateCvLocalBase;
}

export function LocalBaseCard({ localBase }: LocalBaseCardProps) {
  return (
    <section id="local" aria-labelledby="local-heading" className="scroll-mt-44">
      <div className="flex items-center gap-2 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="local-heading"
          className="text-lg md:text-xl font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          Local base
        </h2>
        <EvidenceBadge grade={localBase.evidenceGrade || "SOURCED"} />
        <span className="text-xs text-[var(--km-slate)] ml-auto">
          Stewardship Geography
        </span>
      </div>

      <div className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-5 shadow-none space-y-4">
        <div>
          <p className="text-xs font-semibold text-[var(--km-slate)] uppercase tracking-wider mb-2">
            Blocks &amp; Panchayats
          </p>
          <div className="flex flex-wrap gap-2">
            {localBase.blocks?.map((block) => (
              <span
                key={block}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--km-paper)] border border-[var(--km-paper-line)] text-xs font-semibold text-[var(--km-text)] shadow-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--km-accent)]" />
                {block} GP
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--km-paper-line)] grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-[var(--km-slate)] uppercase tracking-wider mb-1">
              Ecology &amp; Crop Cycle
            </p>
            <p className="text-sm text-[var(--km-text)] font-medium">
              {localBase.ecology}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--km-slate)] uppercase tracking-wider mb-1">
              Ground Presence
            </p>
            <p className="text-sm text-[var(--km-text)] font-medium">
              {localBase.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

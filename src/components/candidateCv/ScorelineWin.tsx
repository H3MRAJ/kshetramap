import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvElectionScoreline } from "@/lib/candidateCv/types";

interface ScorelineWinProps {
  scoreline: CandidateCvElectionScoreline;
}

export function ScorelineWin({ scoreline }: ScorelineWinProps) {
  const formatNum = (n: number) => n.toLocaleString("en-IN");

  return (
    <section id="scoreline" aria-labelledby="scoreline-heading" className="scroll-mt-44">
      <div className="flex items-center gap-2 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="scoreline-heading"
          className="text-lg md:text-xl font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          2025 win scoreline
        </h2>
        <EvidenceBadge grade={scoreline.evidenceGrade || "SOURCED"} />
        <span className="text-xs text-[var(--km-slate)] ml-auto">
          Electoral Win Metrics
        </span>
      </div>

      <div className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-5 shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Winner */}
          <div className="p-3 rounded bg-[var(--km-paper)] border border-[var(--km-paper-line)]">
            <span className="text-[11px] font-semibold text-[var(--km-sourced)] uppercase tracking-wider">
              Winner • {scoreline.winner.party}
            </span>
            <p className="text-sm font-bold text-[var(--km-text)] mt-1 truncate">
              {scoreline.winner.name}
            </p>
            <p className="tabular-nums text-lg font-bold text-[var(--km-text)] mt-0.5">
              {formatNum(scoreline.winner.votes)}
              <span className="text-xs font-normal text-[var(--km-text-muted)] ml-1">
                votes
              </span>
            </p>
          </div>

          {/* Runner-up */}
          <div className="p-3 rounded bg-[var(--km-paper)] border border-[var(--km-paper-line)]">
            <span className="text-[11px] font-semibold text-[var(--km-slate)] uppercase tracking-wider">
              Runner-up • {scoreline.runnerUp.party}
            </span>
            <p className="text-sm font-semibold text-[var(--km-text)] mt-1 truncate">
              {scoreline.runnerUp.name}
            </p>
            <p className="tabular-nums text-lg font-bold text-[var(--km-text-muted)] mt-0.5">
              {formatNum(scoreline.runnerUp.votes)}
              <span className="text-xs font-normal text-[var(--km-text-muted)] ml-1">
                votes
              </span>
            </p>
          </div>

          {/* Third */}
          <div className="p-3 rounded bg-[var(--km-paper)] border border-[var(--km-paper-line)]">
            <span className="text-[11px] font-semibold text-[var(--km-slate)] uppercase tracking-wider">
              3rd • {scoreline.third.party}
            </span>
            <p className="text-sm font-semibold text-[var(--km-text)] mt-1 truncate">
              {scoreline.third.name}
            </p>
            <p className="tabular-nums text-lg font-bold text-[var(--km-text-muted)] mt-0.5">
              {formatNum(scoreline.third.votes)}
              <span className="text-xs font-normal text-[var(--km-text-muted)] ml-1">
                votes
              </span>
            </p>
          </div>

          {/* Victory Margin */}
          <div className="p-3 rounded bg-[var(--km-accent-soft)]/40 border border-[var(--km-accent)]/30">
            <span className="text-[11px] font-bold text-[var(--km-accent-ink)] uppercase tracking-wider">
              Victory Margin
            </span>
            <p className="text-sm font-semibold text-[var(--km-accent-ink)] mt-1">
              Decisive win
            </p>
            <p className="tabular-nums text-lg font-bold text-[var(--km-accent-ink)] mt-0.5">
              +{formatNum(scoreline.margin)}
              <span className="text-xs font-normal text-[var(--km-accent-ink)] ml-1">
                votes
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

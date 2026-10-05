"use client";

import Link from "next/link";
import type { Candidate, MapMode } from "@/lib/types";
import { HEAT_BINS } from "@/lib/mapStyles";
import { PartyLabel } from "./PartyLabel";
import {
  isAnantCandidate,
  ANANT_CANDIDATE_CV_HREF,
} from "@/lib/candidateCv/candidateLink";

type Props = {
  mode: MapMode;
  candidates: Candidate[];
  selectedCandidateKey: string | null;
};

const MARGIN_STOPS = [
  { label: "0 (tight)", color: "#dc2626" },
  { label: "~50", color: "#eab308" },
  { label: "~100", color: "#84cc16" },
  { label: "~200+", color: "#16a34a" },
  { label: "400+ blowout", color: "#14532d" },
];

export function Legend({ mode, candidates, selectedCandidateKey }: Props) {
  const selected = candidates.find((c) => c.key === selectedCandidateKey);

  return (
    <div className="pointer-events-auto rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Legend
      </div>
      {mode === "winner" ? (
        <ul className="space-y-1.5">
          {candidates
            .filter((c) => c.booths_won > 0)
            .sort((a, b) => b.booths_won - a.booths_won)
            .map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  {isAnantCandidate(c.key, c.name) ? (
                    <Link
                      href={ANANT_CANDIDATE_CV_HREF}
                      className="truncate text-zinc-800 underline decoration-zinc-400/40 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-400 font-medium"
                      title="Open Candidate CV"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span className="truncate">{c.name}</span>
                  )}
                  <PartyLabel party={c.party} size="xs" className="text-zinc-500" />
                </span>
                <span className="ml-auto tabular-nums text-zinc-500">
                  {c.booths_won}
                </span>
              </li>
            ))}
          {candidates.some((c) => c.booths_won === 0) && (
            <li className="pt-1 text-[11px] text-zinc-400">
              Others won 0 booths
            </li>
          )}
        </ul>
      ) : mode === "margin" ? (
        <div>
          <div className="mb-2 text-sm font-medium">
            Win margin{" "}
            <span className="font-normal text-zinc-500">(votes)</span>
          </div>
          <ul className="space-y-1.5">
            {MARGIN_STOPS.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm font-medium">
            {selected ? selected.name : "Select a member"}
            {selected && (
              <span className="ml-1 font-normal text-zinc-500">
                — booth vote %
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {HEAT_BINS.map((bin) => (
              <li key={bin.label} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                  style={{ backgroundColor: bin.color }}
                />
                {bin.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2 border-t border-zinc-100 pt-2 text-[10px] leading-snug text-zinc-400 dark:border-zinc-800">
        Marker size ∝ total valid votes. Coords from NIC map georeference
        (~hundreds of m typical).
      </p>
    </div>
  );
}

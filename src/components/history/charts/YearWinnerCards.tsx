"use client";

import type { AcSeriesYear } from "@/lib/historyTypes";
import { PartyLabel } from "@/components/PartyLabel";

export function YearWinnerCards({ years }: { years: AcSeriesYear[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {years.map((y) => (
        <div
          key={y.year}
          className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {y.year}
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {y.winner_name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <PartyLabel party={y.winner_party} size="xs" />
            <span>· {y.winner_share_pct}% share</span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <div className="text-[10px] text-zinc-500">Votes</div>
              <div className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {y.winner_votes.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500">Margin</div>
              <div className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                {y.margin.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            vs {y.runner_up_name} · {y.booth_count} units
          </div>
        </div>
      ))}
    </div>
  );
}

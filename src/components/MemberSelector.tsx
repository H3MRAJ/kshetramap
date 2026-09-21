"use client";

import type { Candidate } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayCandidateName } from "@/lib/i18n/displayNames";
import { PartyLabel } from "./PartyLabel";

type Props = {
  candidates: Candidate[];
  value: string | null;
  onChange: (key: string) => void;
  dark?: boolean;
};

export function MemberSelector({
  candidates,
  value,
  onChange,
  dark = false,
}: Props) {
  const { locale, t } = useLanguage();
  const sorted = [...candidates].sort((a, b) => b.evm_votes - a.evm_votes);
  const totalVotes = sorted.reduce((s, c) => s + c.evm_votes, 0) || 1;

  return (
    <ul className="space-y-1">
      {sorted.map((c, i) => {
        const active = c.key === value;
        const share = (100 * c.evm_votes) / totalVotes;

        if (dark) {
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onChange(c.key)}
                className={`relative w-full overflow-hidden rounded-lg border px-2.5 py-2 text-left transition ${
                  active
                    ? "border-emerald-500 bg-emerald-950"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 opacity-25"
                  style={{ width: `${share}%`, backgroundColor: c.color }}
                />
                <div className="relative flex items-center gap-2">
                  <span className="w-4 shrink-0 text-center text-[10px] tabular-nums text-zinc-400">
                    {i + 1}
                  </span>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-1 ring-zinc-600"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {displayCandidateName(locale, c.key, c.name)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-300">
                      <PartyLabel party={c.party} size="xs" className="text-zinc-200" />
                      <span className="tabular-nums">
                        {c.evm_votes.toLocaleString()}
                      </span>
                      <span className="tabular-nums text-zinc-400">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums text-white">
                      {c.booths_won}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {t("member.booths")}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        }

        return (
          <li key={c.key}>
            <button
              type="button"
              onClick={() => onChange(c.key)}
              className={`relative w-full overflow-hidden rounded-lg border px-2.5 py-2 text-left transition ${
                active
                  ? "border-zinc-900 bg-zinc-50 shadow-sm dark:border-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/80"
              }`}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 opacity-15"
                style={{ width: `${share}%`, backgroundColor: c.color }}
              />
              <div className="relative flex items-center gap-2">
                <span className="w-4 shrink-0 text-center text-[10px] tabular-nums text-zinc-400">
                  {i + 1}
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/15"
                  style={{ backgroundColor: c.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {displayCandidateName(locale, c.key, c.name)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                    <PartyLabel party={c.party} size="xs" />
                    <span className="tabular-nums">
                      {c.evm_votes.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                  {c.booths_won}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

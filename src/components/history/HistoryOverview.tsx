"use client";

import { useMemo } from "react";
import type { AcSeries, ElectionPackage } from "@/lib/historyTypes";
import {
  buildFocusNarrative,
  focusYearSeries,
  type FocusOption,
} from "@/lib/historyFocus";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayCandidateName } from "@/lib/i18n/displayNames";
import { VoteShareLine } from "./charts/VoteShareLine";
import { PartyLabel } from "@/components/PartyLabel";

type Props = {
  series: AcSeries;
  elections: Record<number, ElectionPackage>;
  focus: FocusOption;
};

/** Simple Overview: winner snapshot + one share chart + short brief. */
export function HistoryOverview({ series, elections, focus }: Props) {
  const { locale, t } = useLanguage();
  const focusName = displayCandidateName(locale, focus.key, focus.name);

  const focusPts = useMemo(
    () => focusYearSeries(elections, focus.key),
    [elections, focus.key]
  );

  const narrative = useMemo(
    () => buildFocusNarrative(focus, elections).slice(0, 2),
    [focus, elections]
  );

  const onBallotPts = focusPts.filter((p) => p.on_ballot);
  const peak = onBallotPts.length
    ? [...onBallotPts].sort((a, b) => b.votes - a.votes)[0]
    : null;
  const latest = onBallotPts[onBallotPts.length - 1] ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/25 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          {t("history.snapshot", { name: focusName })}
        </div>
        {narrative.map((line) => (
          <p key={line} className="mt-1 text-sm leading-snug text-zinc-200">
            {line.replace(focus.name, focusName)}
          </p>
        ))}
        {peak && latest && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>
              {t("history.peak")}{" "}
              <strong className="text-zinc-100">
                {peak.votes.toLocaleString()}
              </strong>{" "}
              ({peak.year})
            </span>
            <span>
              {t("history.latestShare")}{" "}
              <strong className="text-zinc-100">{latest.share}%</strong> (
              {latest.year})
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {series.years.map((y) => {
          const isFocus = y.winner_key === focus.key;
          return (
            <div
              key={y.year}
              className={`rounded-xl border p-3 ${
                isFocus
                  ? "border-emerald-700/60 bg-emerald-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                {y.year}
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {displayCandidateName(locale, y.winner_key, y.winner_name)}
              </div>
              <div className="mt-1">
                <PartyLabel party={y.winner_party} size="xs" />
              </div>
              <div className="mt-2 text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {y.winner_share_pct}
                <span className="text-sm font-medium text-zinc-500">%</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {t("history.votesMargin", {
                  votes: y.winner_votes.toLocaleString(),
                  margin: y.margin.toLocaleString(),
                })}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("history.voteShareByYear", { name: focusName })}
        </h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {t("history.shareOfVotes")}
        </p>
        <div className="mt-2">
          <VoteShareLine
            points={focusPts}
            candidateName={focusName}
            color={focus.color}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[18rem] text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-950/80">
            <tr>
              <th className="px-3 py-2 font-medium">{t("history.year")}</th>
              <th className="px-3 py-2 text-right font-medium">
                {t("history.votes")}
              </th>
              <th className="px-3 py-2 text-right font-medium">
                {t("history.share")}
              </th>
            </tr>
          </thead>
          <tbody>
            {focusPts.map((p) => (
              <tr
                key={p.year}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {p.year}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                  {p.on_ballot ? p.votes.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                  {p.on_ballot ? `${p.share}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

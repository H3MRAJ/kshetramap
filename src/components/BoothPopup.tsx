"use client";

import Link from "next/link";
import type { BoothProps, Candidate } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayCandidateName,
  displayPlaceName,
  displayPsName,
  displayVillageName,
} from "@/lib/i18n/displayNames";
import { BoothAssets } from "./BoothAssets";
import { BoothIntelligence } from "./BoothIntelligence";
import { PartyLabel } from "./PartyLabel";

type Props = {
  booth: BoothProps;
  candidates: Candidate[];
  acGrandTotal: number;
  acNo: number;
  electionYear?: number;
  onClose: () => void;
};

export function BoothPopup({
  booth,
  candidates,
  acGrandTotal,
  acNo,
  electionYear,
  onClose,
}: Props) {
  const { locale, t } = useLanguage();
  const rows = candidates
    .map((c) => ({
      ...c,
      name: displayCandidateName(locale, c.key, c.name),
      votes: booth.votes[c.key] ?? 0,
      pct: booth.pct[c.key] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  const placeLabel =
    displayVillageName(locale, booth.village, booth.booth_no) ||
    displayPlaceName(locale, booth.nearest_place);

  return (
    <div className="max-h-[min(75vh,520px)] w-[min(94vw,360px)] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-zinc-100 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("booth.booth", { n: booth.booth_no })}
            {placeLabel ? (
              <span className="font-normal text-zinc-500"> · {placeLabel}</span>
            ) : null}
          </div>
          <div className="text-xs text-zinc-500">
            {electionYear != null && (
              <span className="mr-1.5 rounded bg-zinc-100 px-1.5 py-0.5 font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {electionYear}
              </span>
            )}
            {t("booth.winner")}:{" "}
            <span style={{ color: booth.winner_color }} className="font-medium">
              {displayCandidateName(
                locale,
                booth.winner_key,
                booth.winner_name
              )}
            </span>{" "}
            ({booth.winner_pct}%)
            {booth.match_confidence &&
              booth.match_confidence !== "high" && (
                <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
                  ·{" "}
                  {booth.match_confidence === "unmatched"
                    ? t("booth.noMatch")
                    : t("booth.approx")}
                </span>
              )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>

      <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <Link
          href={`/ac/${acNo}/history?booth=${booth.booth_no}`}
          className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {t("booth.history")}
        </Link>
      </div>

      <div className="space-y-2 border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
        <BoothIntelligence
          booth={booth}
          acGrandTotal={acGrandTotal}
          variant="full"
        />
      </div>

      <BoothAssets
        acNo={acNo}
        boothNo={booth.booth_no}
        className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
      />

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800">
            <th className="px-3 py-1.5 font-medium">{t("booth.candidate")}</th>
            <th className="px-2 py-1.5 font-medium">{t("booth.party")}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t("booth.votes")}</th>
            <th className="px-3 py-1.5 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className="border-b border-zinc-50 dark:border-zinc-800/60"
            >
              <td className="px-3 py-1.5">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {r.name}
                  </span>
                </span>
              </td>
              <td className="px-2 py-1.5 text-zinc-500">
                <PartyLabel party={r.party} size="xs" />
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {r.votes.toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-zinc-500">
                {r.pct.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800">
        <div>
          <div className="kshetra-ui-hi text-[10px] font-medium">
            {t("booth.totalValid")}
          </div>
          <div className="tabular-nums font-medium text-zinc-800 dark:text-zinc-100">
            {booth.total_valid.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="kshetra-ui-hi text-[10px] font-medium">
            {t("booth.nota")}
          </div>
          <div className="tabular-nums font-medium text-zinc-800 dark:text-zinc-100">
            {booth.nota.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="kshetra-ui-hi text-[10px] font-medium">
            {t("booth.margin")}
          </div>
          <div className="tabular-nums font-medium text-zinc-800 dark:text-zinc-100">
            {booth.margin.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

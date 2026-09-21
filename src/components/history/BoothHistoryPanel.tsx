"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  confidenceBadgeClass,
  getMatchEntry,
  resolveBoothYear,
  topSwings,
} from "@/lib/boothMatch";
import type { FocusOption } from "@/lib/historyFocus";
import type {
  BoothMatches,
  ElectionPackage,
  MatchConfidence,
} from "@/lib/historyTypes";
import { buildQuery } from "@/lib/shareUrl";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayCandidateName,
  displayPlaceName,
} from "@/lib/i18n/displayNames";
import { ChartLegend } from "./charts/ChartLegend";

type Props = {
  acNo: number;
  matches: BoothMatches;
  elections: Record<number, ElectionPackage>;
  focus: FocusOption;
  initialBooth?: number | null;
};

export function BoothHistoryPanel({
  acNo,
  matches,
  elections,
  focus,
  initialBooth,
}: Props) {
  const { locale, t } = useLanguage();
  const maxBooth = Math.max(...matches.matches.map((m) => m.booth_no_2025));
  const [boothNo, setBoothNo] = useState(initialBooth || 1);
  const [input, setInput] = useState(String(initialBooth || 1));

  useEffect(() => {
    if (initialBooth && !Number.isNaN(initialBooth)) {
      setBoothNo(initialBooth);
      setInput(String(initialBooth));
    }
  }, [initialBooth]);

  const entry = getMatchEntry(matches, boothNo);
  const years = [2015, 2020, 2025] as const;

  const yearRows = useMemo(() => {
    return years.map((year) => {
      const ym = entry?.by_year[String(year)];
      // G3: 2015 Form 20 has no PS names — exclude from booth chart series
      if (year === 2015) {
        return {
          year,
          row: null,
          confidence: "low" as const,
          match: ym,
          demoted: true as const,
        };
      }
      const { row, confidence } = resolveBoothYear(elections[year], ym);
      return { year, row, confidence, match: ym, demoted: false as const };
    });
  }, [entry, elections]);

  /** Single series: focus votes only — simple chart (2020/2025; not 2015) */
  const chartData = useMemo(() => {
    return yearRows
      .filter((y) => y.row && !y.demoted)
      .map(({ year, row }) => ({
        year: String(year),
        votes: row?.votes[focus.key] ?? 0,
        share:
          row && row.total_valid
            ? Math.round(
                (10000 * (row.votes[focus.key] ?? 0)) / row.total_valid
              ) / 100
            : 0,
        winner: row?.winner_name ?? "—",
      }));
  }, [yearRows, focus.key]);

  const swings = useMemo(() => {
    if (!elections[2020] || !elections[2025]) return [];
    return topSwings(
      matches,
      elections[2020],
      elections[2025],
      focus.key,
      8
    );
  }, [matches, elections, focus.key]);

  function goBooth(n: number) {
    if (n < 1 || n > maxBooth) return;
    setBoothNo(n);
    setInput(String(n));
  }

  const mapHref = `/ac/${acNo}${buildQuery({ booth: boothNo, member: focus.key })}`;
  const focusName = displayCandidateName(locale, focus.key, focus.name);
  const shortName =
    focusName.split(" ").slice(-2).join(" ") || focusName;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t("history.boothNumber")}
          <input
            type="number"
            min={1}
            max={maxBooth}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goBooth(Number(input));
            }}
            placeholder={t("goto.placeholder", { n: maxBooth })}
            className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm tabular-nums text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <button
          type="button"
          onClick={() => goBooth(Number(input))}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {t("history.load")}
        </button>
        <Link
          href={mapHref}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("history.showOnMap")}
        </Link>
        <div className="ml-auto max-w-[12rem] truncate text-xs text-zinc-500">
          {displayPlaceName(locale, entry?.nearest_place) || "—"}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {yearRows.map(({ year, confidence, demoted }) => (
          <span
            key={year}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${confidenceBadgeClass(
              confidence as MatchConfidence
            )}`}
          >
            {year} ·{" "}
            {demoted
              ? t("history.totalsOnly")
              : confidence === "high"
                ? t("history.matched")
                : confidence === "medium" || confidence === "low"
                  ? t("booth.approx")
                  : t("history.noMatch")}
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
        {t("history.y2015Note")}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("history.boothVotes", { n: boothNo, name: shortName })}
        </h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {t("history.boothChartSub")}
        </p>
        {chartData.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">{t("history.noMatchedYears")}</p>
        ) : (
          <div className="mt-3">
            <div className="h-48 w-full sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    opacity={0.3}
                  />
                  <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} width={40} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "votes")
                        return [
                          typeof value === "number"
                            ? value.toLocaleString()
                            : value,
                          "Votes",
                        ];
                      return [value, name];
                    }}
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="votes"
                    name="votes"
                    fill={focus.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend
              items={[
                {
                  key: "votes",
                  label: `${shortName} ${t("history.votes")}`,
                  color: focus.color,
                },
              ]}
            />
          </div>
        )}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 pr-2">{t("history.year")}</th>
                <th className="py-1 pr-2">{t("history.winnerCol")}</th>
                <th className="py-1 pr-2 text-right">{shortName}</th>
                <th className="py-1 text-right">{t("history.share")}</th>
              </tr>
            </thead>
            <tbody>
              {yearRows.map(({ year, row, confidence, demoted }) => (
                <tr
                  key={year}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-1.5 pr-2 font-medium">{year}</td>
                  {demoted ? (
                    <td colSpan={3} className="py-1.5 text-amber-700 dark:text-amber-300">
                      {t("history.seeOverview2015")}
                    </td>
                  ) : row ? (
                    <>
                      <td className="py-1.5 pr-2 truncate max-w-[8rem]">
                        {displayCandidateName(
                          locale,
                          row.winner_key,
                          row.winner_name
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {row.votes[focus.key] ?? 0}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {row.total_valid
                          ? `${(
                              Math.round(
                                (10000 * (row.votes[focus.key] ?? 0)) /
                                  row.total_valid
                              ) / 100
                            ).toFixed(1)}%`
                          : "—"}
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="py-1.5 text-zinc-500">
                      {t("history.noMatch")}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Biggest share moves 2020→2025
        </h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {shortName} · matched booths only
        </p>
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {swings.slice(0, 6).map((s) => (
            <li
              key={s.booth_no}
              className="flex items-center gap-2 py-2 text-xs"
            >
              <button
                type="button"
                onClick={() => goBooth(s.booth_no)}
                className="font-semibold text-emerald-600 tabular-nums hover:underline dark:text-emerald-400"
              >
                #{s.booth_no}
              </button>
              <span className="min-w-0 flex-1 truncate text-zinc-500">
                {s.place || "—"}
              </span>
              <span className="tabular-nums text-zinc-400">
                {s.share_2020}→{s.share_2025}%
              </span>
              <span
                className={`w-12 text-right font-semibold tabular-nums ${
                  s.swing_pp >= 0 ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {s.swing_pp > 0 ? "+" : ""}
                {s.swing_pp}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  recomputePlaceSeries,
  type FocusOption,
} from "@/lib/historyFocus";
import type {
  BoothMatches,
  ElectionPackage,
  PlaceSeries,
  PlaceSeriesEntry,
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
  placeSeries: PlaceSeries;
  matches: BoothMatches;
  elections: Record<number, ElectionPackage>;
  focus: FocusOption;
  initialPlace?: string | null;
};

export function PlaceSwingPanel({
  acNo,
  placeSeries,
  matches,
  elections,
  focus,
  initialPlace,
}: Props) {
  const { locale, t } = useLanguage();
  const places = useMemo(() => {
    const recomputed = recomputePlaceSeries(
      placeSeries.places,
      matches,
      elections,
      focus.key
    );
    return recomputed.filter((p) => p.place !== "Unknown");
  }, [placeSeries, matches, elections, focus.key]);

  const [placeName, setPlaceName] = useState(
    initialPlace ||
      places.find((p) => p.place === "Mokama")?.place ||
      places[0]?.place ||
      ""
  );

  const selected: PlaceSeriesEntry | undefined = places.find(
    (p) => p.place === placeName
  );

  const chartData = useMemo(() => {
    if (!selected) return [];
    return selected.years
      // G3: exclude 2015 from place booth-aggregate charts (serial join demoted)
      .filter(
        (y) =>
          y.year !== 2015 &&
          y.matched_booth_count > 0 &&
          y.total_valid > 0
      )
      .map((y) => ({
        year: String(y.year),
        share: y.focus_share_pct,
      }));
  }, [selected]);

  const ranked = useMemo(() => {
    return [...places]
      .filter((p) => p.swing_2020_2025_pp != null)
      .sort(
        (a, b) =>
          Math.abs(b.swing_2020_2025_pp ?? 0) -
          Math.abs(a.swing_2020_2025_pp ?? 0)
      )
      .slice(0, 10);
  }, [places]);

  const focusName = displayCandidateName(locale, focus.key, focus.name);
  const shortName =
    focusName.split(" ").slice(-2).join(" ") || focusName;

  const mapHref = selected
    ? `/ac/${acNo}${buildQuery({ place: selected.place, member: focus.key })}`
    : `/ac/${acNo}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
          {t("history.place")}
          <select
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {places.map((p) => (
              <option key={p.place} value={p.place}>
                {displayPlaceName(locale, p.place)} ({p.booth_nos_2025.length})
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <Link
            href={mapHref}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("history.showOnMap")}
          </Link>
        )}
      </div>

      {selected && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {displayPlaceName(locale, selected.place)} · {shortName}{" "}
            {t("history.share")}
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Average over booths in this place · 2020→2025:{" "}
            <span
              className={
                (selected.swing_2020_2025_pp ?? 0) >= 0
                  ? "font-semibold text-emerald-500"
                  : "font-semibold text-red-400"
              }
            >
              {selected.swing_2020_2025_pp == null
                ? "n/a"
                : `${selected.swing_2020_2025_pp > 0 ? "+" : ""}${selected.swing_2020_2025_pp} pp`}
            </span>
          </p>
          <div className="mt-3 h-48 sm:h-56">
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
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  unit="%"
                  width={40}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Share"]}
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="share"
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
                key: "share",
                label: `${shortName} share %`,
                color: focus.color,
              },
            ]}
          />
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Places that moved most (2020→2025)
        </h3>
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {ranked.map((p) => (
            <li key={p.place} className="flex items-center gap-2 py-2 text-xs">
              <button
                type="button"
                onClick={() => setPlaceName(p.place)}
                className="min-w-0 flex-1 truncate text-left font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {p.place}
              </button>
              <span className="tabular-nums text-zinc-400">
                {p.booth_nos_2025.length} booths
              </span>
              <span
                className={`w-12 text-right font-semibold tabular-nums ${
                  (p.swing_2020_2025_pp ?? 0) >= 0
                    ? "text-emerald-500"
                    : "text-red-400"
                }`}
              >
                {(p.swing_2020_2025_pp ?? 0) > 0 ? "+" : ""}
                {p.swing_2020_2025_pp}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AcSeriesYear } from "@/lib/historyTypes";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayCandidateName } from "@/lib/i18n/displayNames";
import { ChartLegend } from "./ChartLegend";

/** Top candidates per year as grouped bars. */
export function CandidateYearBars({
  years,
  highlightKey,
}: {
  years: AcSeriesYear[];
  highlightKey?: string;
}) {
  const { locale, t } = useLanguage();
  const keyMeta = new Map<string, { name: string; color: string; max: number }>();
  for (const y of years) {
    for (const c of y.candidates) {
      const prev = keyMeta.get(c.key);
      if (!prev || c.evm_votes > prev.max) {
        keyMeta.set(c.key, {
          name: displayCandidateName(locale, c.key, c.name),
          color: c.color,
          max: c.evm_votes,
        });
      }
    }
  }
  const topKeys = [...keyMeta.entries()]
    .sort((a, b) => b[1].max - a[1].max)
    .slice(0, 5)
    .map(([k]) => k);
  if (
    highlightKey &&
    keyMeta.has(highlightKey) &&
    !topKeys.includes(highlightKey)
  ) {
    topKeys[topKeys.length - 1] = highlightKey;
  }

  const data = years.map((y) => {
    const row: Record<string, string | number> = { year: String(y.year) };
    for (const k of topKeys) {
      const c = y.candidates.find((x) => x.key === k);
      row[k] = c?.evm_votes ?? 0;
    }
    row.nota = y.nota;
    return row;
  });

  const legendItems = [
    ...topKeys.map((k) => ({
      key: k,
      label: keyMeta.get(k)?.name || k,
      color: keyMeta.get(k)?.color || "#71717a",
    })),
    { key: "nota", label: t("booth.nota"), color: "#a1a1aa" },
  ];

  const fullName = (k: string) =>
    k === "nota" ? t("booth.nota") : keyMeta.get(k)?.name || k;

  return (
    <div className="w-full">
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            barCategoryGap="16%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              opacity={0.35}
            />
            <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={48}
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(value, name) => {
                const v =
                  typeof value === "number" ? value.toLocaleString() : value;
                return [v, fullName(String(name))];
              }}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
                maxWidth: 260,
              }}
              wrapperStyle={{ zIndex: 20 }}
              cursor={{ fill: "rgba(113,113,122,0.12)" }}
            />
            {topKeys.map((k) => (
              <Bar
                key={k}
                dataKey={k}
                name={k}
                fill={keyMeta.get(k)?.color || "#71717a"}
                radius={[3, 3, 0, 0]}
                maxBarSize={36}
              />
            ))}
            <Bar
              dataKey="nota"
              name="nota"
              fill="#a1a1aa"
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={legendItems} />
    </div>
  );
}

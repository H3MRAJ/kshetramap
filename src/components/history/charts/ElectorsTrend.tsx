"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AcSeriesYear } from "@/lib/historyTypes";
import { ChartLegend } from "./ChartLegend";

export function ElectorsTrend({ years }: { years: AcSeriesYear[] }) {
  const data = years.map((y) => ({
    year: String(y.year),
    electors: y.electors_total ?? null,
    valid: y.total_valid,
    nota: y.nota,
  }));

  return (
    <div className="w-full">
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              opacity={0.35}
            />
            <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={52}
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(value, name) => {
                const v =
                  typeof value === "number" ? value.toLocaleString() : value;
                const labels: Record<string, string> = {
                  electors: "Electors",
                  valid: "Valid votes",
                  nota: "NOTA",
                };
                return [v ?? "—", labels[String(name)] || String(name)];
              }}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
              }}
              wrapperStyle={{ zIndex: 20 }}
            />
            <Line
              type="monotone"
              dataKey="electors"
              name="electors"
              stroke="#0ea5e9"
              strokeWidth={2}
              connectNulls
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="valid"
              name="valid"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="nota"
              name="nota"
              stroke="#a1a1aa"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { key: "electors", label: "Electors", color: "#0ea5e9" },
          { key: "valid", label: "Valid votes", color: "#10b981" },
          { key: "nota", label: "NOTA", color: "#a1a1aa" },
        ]}
      />
    </div>
  );
}

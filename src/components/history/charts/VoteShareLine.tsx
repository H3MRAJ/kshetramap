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
import type { FocusYearPoint } from "@/lib/historyFocus";
import { ChartLegend, shortCandidateLabel } from "./ChartLegend";

type Props = {
  points: FocusYearPoint[];
  candidateName: string;
  color: string;
};

export function VoteShareLine({ points, candidateName, color }: Props) {
  const data = points.map((y) => ({
    year: String(y.year),
    share: y.on_ballot ? y.share : null,
    votes: y.on_ballot ? y.votes : null,
  }));

  const maxShare = Math.max(40, ...points.map((p) => p.share), 10);
  const short = shortCandidateLabel(candidateName);

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
              domain={[0, Math.min(100, Math.ceil(maxShare / 10) * 10 + 10)]}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              unit="%"
              width={40}
            />
            <Tooltip
              formatter={(value) => {
                if (value == null) return ["—", "Share"];
                return [`${value}%`, candidateName];
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
            />
            <Line
              type="monotone"
              dataKey="share"
              name="share"
              stroke={color}
              strokeWidth={2.5}
              connectNulls={false}
              dot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[{ key: "share", label: `${short} share %`, color }]}
      />
    </div>
  );
}

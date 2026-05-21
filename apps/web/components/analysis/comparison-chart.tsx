"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Comparison, Document } from "@/lib/api";
import {
  buildComparisonChartData,
  chartPercent,
  type ComparisonChartRow,
} from "@/lib/comparison";

const COLOR_A = "#3F6F5C";
const COLOR_B = "#8FB5A3";

interface ComparisonChartProps {
  comparison: Comparison;
  documents: Document[];
}

function toChartRows(
  rows: ComparisonChartRow[]
): { label: string; promptA: number | null; promptB: number | null }[] {
  return rows.map((r) => ({
    label: r.label,
    promptA: chartPercent(r.promptA, r.hasA),
    promptB: chartPercent(r.promptB, r.hasB),
  }));
}

export function ComparisonChart({
  comparison,
  documents,
}: ComparisonChartProps) {
  const raw = buildComparisonChartData(comparison, documents);
  const data = toChartRows(raw);
  const labelA = comparison.prompt_a.name;
  const labelB = comparison.prompt_b.name;

  return (
    <div className="mt-10 rounded-lg border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">
        Accuracy by category
      </p>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            barGap={4}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E8E8E3"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#737373" }}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#737373" }}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "rgba(63, 111, 92, 0.06)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E8E8E3",
                fontSize: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              formatter={(value) => {
                const n =
                  typeof value === "number"
                    ? value
                    : value != null
                      ? Number(value)
                      : NaN;
                if (Number.isNaN(n)) return ["—", ""];
                return [`${n}%`, ""];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#737373", paddingTop: 12 }}
              iconType="square"
              iconSize={10}
            />
            <Bar
              dataKey="promptA"
              name={labelA}
              fill={COLOR_A}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="promptB"
              name={labelB}
              fill={COLOR_B}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-6 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLOR_A }}
          />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLOR_B }}
          />
          {labelB}
        </span>
      </div>
    </div>
  );
}

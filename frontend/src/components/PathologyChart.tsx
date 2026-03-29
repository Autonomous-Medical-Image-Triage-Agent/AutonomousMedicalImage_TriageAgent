"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { PATHOLOGY_COLORS } from "@/lib/types";

interface Props {
  predictions: Record<string, number>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const positive = value >= 0.5;
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium">{name}</p>
      <p className={positive ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
        {(value * 100).toFixed(1)}% — {positive ? "POSITIVE" : "Negative"}
      </p>
    </div>
  );
};

export default function PathologyChart({ predictions }: Props) {
  const data = Object.entries(predictions).map(([name, value]) => ({
    name: name === "Pleural Effusion" ? "Pl. Effusion" : name,
    fullName: name,
    value: parseFloat((value * 100).toFixed(1)),
  }));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#2a2d3a" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={82}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
          <ReferenceLine
            x={50}
            stroke="#f97316"
            strokeDasharray="4 2"
            strokeWidth={1.5}
            label={{ value: "50%", fill: "#f97316", fontSize: 10, position: "insideTopRight" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry) => (
              <Cell
                key={entry.fullName}
                fill={
                  entry.value >= 50
                    ? PATHOLOGY_COLORS[entry.fullName] || "#ef4444"
                    : "#1e3a2f"
                }
                stroke={
                  entry.value >= 50
                    ? PATHOLOGY_COLORS[entry.fullName] || "#ef4444"
                    : "#22c55e40"
                }
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

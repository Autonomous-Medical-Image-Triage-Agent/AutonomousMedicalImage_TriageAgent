"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface Props {
  individualPredictions: Record<string, number[]>;
}

const MODEL_NAMES = ["DenseNet-121", "EffNet-B0", "EffNet-B3", "ResNet-50"];
const MODEL_COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f97316"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs space-y-1">
      <p className="text-slate-300 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {p.value.toFixed(1)}%
        </p>
      ))}
    </div>
  );
};

export default function ModelAgreementChart({ individualPredictions }: Props) {
  const labels = Object.keys(individualPredictions);
  const data = labels.map((label) => {
    const row: Record<string, string | number> = {
      name: label === "Pleural Effusion" ? "Pl. Effusion" : label,
    };
    individualPredictions[label].forEach((v, i) => {
      row[MODEL_NAMES[i]] = parseFloat((v * 100).toFixed(1));
    });
    return row;
  });

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#2a2d3a" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff06" }} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 4 }}
          />
          <ReferenceLine
            y={50}
            stroke="#ffffff30"
            strokeDasharray="4 2"
            strokeWidth={1}
          />
          {MODEL_NAMES.map((name, i) => (
            <Bar
              key={name}
              dataKey={name}
              fill={MODEL_COLORS[i]}
              radius={[2, 2, 0, 0]}
              barSize={8}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

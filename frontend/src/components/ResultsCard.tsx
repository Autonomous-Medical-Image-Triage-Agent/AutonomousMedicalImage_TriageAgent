// MediScan AI — Results card
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Stethoscope, AlertTriangle, BookOpen, FileText } from "lucide-react";
import type { TriageResult, Urgency } from "@/lib/types";
import { URGENCY_CONFIG, PATHOLOGY_COLORS } from "@/lib/types";
import UrgencyBadge from "./UrgencyBadge";
import PathologyChart from "./PathologyChart";
import ModelAgreementChart from "./ModelAgreementChart";
import clsx from "clsx";

interface Props { result: TriageResult; }

export default function ResultsCard({ result }: Props) {
  const [tab, setTab] = useState<"findings" | "charts" | "evidence" | "report">("findings");
  const cfg = URGENCY_CONFIG[result.urgency as Urgency];

  return (
    <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10 bg-[#0d1424]">
      {/* Header band */}
      <div className={clsx("px-4 py-3 flex items-center justify-between", cfg.bg, "border-b", cfg.border)}>
        <div className="flex items-center gap-3">
          <UrgencyBadge urgency={result.urgency as Urgency} pulse size="lg" />
          <div className="text-xs text-slate-400">
            <span className="font-mono">{result.patient_id}</span>
          </div>
        </div>
        <div className={clsx("text-xs font-semibold", cfg.color)}>
          {result.urgency === "CRITICAL" || result.urgency === "URGENT"
            ? result.alerts[0]
            : result.specialist}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(["findings", "charts", "evidence", "report"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === "findings" && (
          <div className="space-y-4">
            {/* Specialist */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Stethoscope size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Refer to</p>
                <p className="text-sm font-semibold text-blue-300">{result.specialist}</p>
                <p className="text-xs text-slate-400 mt-0.5">{result.routing_reason}</p>
              </div>
            </div>

            {/* Urgency reason */}
            <div className={clsx("flex items-start gap-3 p-3 rounded-xl border", cfg.bg, cfg.border)}>
              <AlertTriangle size={16} className={clsx(cfg.color, "mt-0.5 flex-shrink-0")} />
              <div>
                <p className={clsx("text-xs font-medium", cfg.color)}>{result.urgency_reason}</p>
              </div>
            </div>

            {/* Pathology bars */}
            <div className="space-y-2.5">
              {Object.entries(result.predictions).map(([label, prob]) => {
                const positive = prob >= 0.5;
                const pct = Math.round(prob * 100);
                const color = PATHOLOGY_COLORS[label] || "#3b82f6";
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        {positive
                          ? <XCircle size={12} className="text-red-400" />
                          : <CheckCircle size={12} className="text-green-400" />}
                        {label}
                      </span>
                      <span className={clsx("font-mono font-bold", positive ? "text-red-400" : "text-green-400")}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bar-fill rounded-full"
                        style={{ width: `${pct}%`, background: positive ? color : "#22c55e50" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "charts" && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Disease Probability</p>
              <PathologyChart predictions={result.predictions} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Model Agreement</p>
              <ModelAgreementChart individualPredictions={result.individual_predictions} />
            </div>
          </div>
        )}

        {tab === "evidence" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-xs text-slate-400">Retrieved clinical guidelines</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
              {result.evidence}
            </p>
          </div>
        )}

        {tab === "report" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-blue-400" />
              <span className="text-xs text-slate-400">Full triage report</span>
            </div>
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {result.report}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

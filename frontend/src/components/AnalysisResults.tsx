"use client";

import { useState } from "react";
import {
  RefreshCw,
  User,
  Clock,
  Stethoscope,
  AlertTriangle,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import UrgencyBadge from "./UrgencyBadge";
import PathologyChart from "./PathologyChart";
import ModelAgreementChart from "./ModelAgreementChart";
import type { TriageResult, Urgency } from "@/lib/types";
import { URGENCY_CONFIG, PATHOLOGY_COLORS } from "@/lib/types";
import clsx from "clsx";

interface Props {
  result: TriageResult;
  onReset: () => void;
}

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-[#1a1d27] rounded-xl border border-[#2a2d3a] overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2d3a]">
        <span className="text-blue-400">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AnalysisResults({ result, onReset }: Props) {
  const [showReport, setShowReport] = useState(false);
  const cfg = URGENCY_CONFIG[result.urgency as Urgency];

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UrgencyBadge urgency={result.urgency as Urgency} pulse size="lg" />
          <div className="text-xs text-slate-500 font-mono space-y-0.5">
            <div className="flex items-center gap-1.5">
              <User size={11} />
              {result.patient_id}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} />
              {formatTime(result.timestamp)}
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-[#2a2d3a] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
        >
          <RefreshCw size={14} />
          New Analysis
        </button>
      </div>

      {/* Alert banner for critical/urgent */}
      {(result.urgency === "CRITICAL" || result.urgency === "URGENT") && (
        <div
          className={clsx(
            "flex items-start gap-3 p-4 rounded-xl border",
            cfg.bg,
            cfg.border,
            result.urgency === "CRITICAL" && "urgency-pulse"
          )}
        >
          <AlertTriangle size={18} className={clsx(cfg.color, "flex-shrink-0 mt-0.5")} />
          <div className="space-y-1">
            {result.alerts.map((a, i) => (
              <p key={i} className={clsx("text-sm font-semibold", cfg.color)}>
                {a}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pathology findings */}
        <Card title="AI Findings" icon={<Stethoscope size={15} />}>
          <div className="space-y-3">
            {Object.entries(result.predictions).map(([label, prob]) => {
              const positive = prob >= 0.5;
              const pct = Math.round(prob * 100);
              const color = PATHOLOGY_COLORS[label] || "#3b82f6";
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {positive ? (
                        <XCircle size={13} className="text-red-400" />
                      ) : (
                        <CheckCircle size={13} className="text-green-400" />
                      )}
                      {label}
                    </span>
                    <span
                      className={clsx(
                        "font-mono font-bold",
                        positive ? "text-red-400" : "text-green-400"
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0f1117] overflow-hidden">
                    <div
                      className="h-full bar-fill rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: positive ? color : "#22c55e50",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Triage decision */}
        <Card title="Triage Decision" icon={<AlertTriangle size={15} />}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Urgency</p>
              <div className="flex items-center gap-2">
                <UrgencyBadge urgency={result.urgency as Urgency} />
                <span className="text-xs text-slate-400">{result.urgency_reason}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Specialist</p>
              <p className="text-sm font-semibold text-blue-300">{result.specialist}</p>
              <p className="text-xs text-slate-400">{result.routing_reason}</p>
            </div>
            {result.positive_findings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Positive Findings
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.positive_findings.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.urgency === "ROUTINE" && result.alerts.length > 0 && (
              <div className="text-xs text-green-400 flex items-center gap-1.5">
                <CheckCircle size={13} />
                {result.alerts[0]}
              </div>
            )}
          </div>
        </Card>

        {/* Disease probability chart */}
        <Card title="Disease Probability" icon={<Stethoscope size={15} />}>
          <PathologyChart predictions={result.predictions} />
        </Card>

        {/* Model agreement chart */}
        <Card title="Model Agreement" icon={<Stethoscope size={15} />}>
          <ModelAgreementChart individualPredictions={result.individual_predictions} />
        </Card>
      </div>

      {/* Clinical Evidence */}
      <Card title="Clinical Evidence (RAG)" icon={<BookOpen size={15} />}>
        <p className="text-xs leading-relaxed text-slate-400 whitespace-pre-wrap font-mono">
          {result.evidence}
        </p>
      </Card>

      {/* Full Report (collapsible) */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2a2d3a] overflow-hidden">
        <button
          onClick={() => setShowReport((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-[#2a2d3a] hover:bg-[#22263a] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FileText size={15} className="text-blue-400" />
            Full Triage Report
          </div>
          {showReport ? (
            <ChevronUp size={15} className="text-slate-400" />
          ) : (
            <ChevronDown size={15} className="text-slate-400" />
          )}
        </button>
        {showReport && (
          <div className="p-4">
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {result.report}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

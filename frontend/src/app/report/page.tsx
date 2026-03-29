"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Printer, ArrowLeft, CheckCircle, XCircle,
  Stethoscope, AlertTriangle, BookOpen, Brain, Zap,
  Clock, FileText, ShieldCheck, Hash, List, Info
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { TriageResult, Urgency } from "@/lib/types";
import { URGENCY_CONFIG, PATHOLOGY_COLORS } from "@/lib/types";
import clsx from "clsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function clean(s: string) {
  return s.replace(/\u2014/g, "-").replace(/\u2013/g, "-").replace(/---+/g, "");
}

function RingProgress({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      />
    </svg>
  );
}

const URGENCY_LEVELS = ["ROUTINE", "MODERATE", "URGENT", "CRITICAL"] as const;
const LEVEL_COLORS   = { ROUTINE: "#22c55e", MODERATE: "#eab308", URGENT: "#f97316", CRITICAL: "#ef4444" };
const LEVEL_ICONS    = { ROUTINE: "🟢", MODERATE: "🟡", URGENT: "🟠", CRITICAL: "🔴" };
const MODEL_NAMES    = ["DenseNet-121", "EfficientNet-B0", "EfficientNet-B3", "ResNet-50"];
const MODEL_COLORS   = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f97316"];

const PATHOLOGY_META: Record<string, { icon: string; brief: string; tags: string[] }> = {
  Pneumothorax:        { icon: "🫁", brief: "Air in pleural space causing lung collapse",        tags: ["Chest tube", "O2 monitoring", "Thoracic Surgery"] },
  Edema:               { icon: "💧", brief: "Fluid accumulation in lung parenchyma",             tags: ["IV diuretics", "Oxygen therapy", "Fluid restriction"] },
  Pneumonia:           { icon: "🦠", brief: "Bacterial or viral infection of lung tissue",       tags: ["Antibiotics", "CURB-65 scoring", "Blood culture"] },
  Cardiomegaly:        { icon: "❤️",  brief: "Enlarged cardiac silhouette on radiograph",        tags: ["Echocardiogram", "BNP level", "Cardiology consult"] },
  "Pleural Effusion":  { icon: "🌊", brief: "Fluid accumulation in the pleural cavity",         tags: ["Thoracentesis", "CT chest", "Exudate vs transudate"] },
};

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.22)" }}>
        <Icon size={16} style={{ color: "#60a5fa" }} />
      </div>
      <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
      {badge && (
        <span className="text-[10px] font-mono px-2 py-1 rounded-full"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd" }}>
          {badge}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: "rgba(148,163,184,0.07)" }} />
    </div>
  );
}

// ─── Parsed Report Renderer ────────────────────────────────────────────────────
function ParsedReport({ reportText, result }: { reportText: string; result: TriageResult }) {
  const text = clean(reportText);

  // Split into named sections
  const sectionRegex = /^([A-Z][A-Z\s()]+)\s*$/gm;
  const parts: { heading: string; body: string }[] = [];
  const matches = Array.from(text.matchAll(sectionRegex));

  matches.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end   = matches[i + 1]?.index ?? text.length;
    const body  = text.slice(start, end).replace(/={10,}/g, "").trim();
    if (body) parts.push({ heading: m[0].trim(), body });
  });

  return (
    <div className="space-y-5">
      {parts.map((section, si) => {
        const h = section.heading;
        const body = section.body;

        // ── PATHOLOGY PREDICTIONS ──
        if (h.includes("PATHOLOGY")) {
          const rows = body.split("\n").filter(l => l.trim().match(/\[(POSITIVE|negative)\]/i));
          return (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
              <div className="flex items-center gap-2 mb-4">
                <Hash size={12} style={{ color: "#60a5fa" }} />
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#60a5fa" }}>{h}</span>
              </div>
              <div className="space-y-2.5">
                {rows.map((row, ri) => {
                  const pos = /\[POSITIVE\]/i.test(row);
                  const match = row.match(/(?:POSITIVE|negative)\]\s*(.+?):\s*([\d.]+)%/i);
                  if (!match) return null;
                  const [, label, pctStr] = match;
                  const pct = parseFloat(pctStr);
                  const color = PATHOLOGY_COLORS[label.trim()] || "#3b82f6";
                  return (
                    <div key={ri}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-2">
                          {pos ? <XCircle size={12} className="text-red-400" /> : <CheckCircle size={12} className="text-green-400" />}
                          <span style={{ color: pos ? "white" : "#64748b" }} className={pos ? "font-bold" : ""}>{label.trim()}</span>
                          {pos && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                              style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                              DETECTED
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-black text-sm" style={{ color: pos ? color : "#334155" }}>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: pos ? `linear-gradient(90deg, ${color}80, ${color})` : "rgba(34,197,94,0.25)" }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 + ri * 0.07 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        }

        // ── TRIAGE DECISION ──
        if (h.includes("TRIAGE")) {
          const kvLines = body.split("\n").filter(l => l.includes(":"));
          const kv: Record<string, string> = {};
          kvLines.forEach(l => {
            const idx = l.indexOf(":");
            const k = l.slice(0, idx).trim().replace(/\s+/g, " ");
            const v = l.slice(idx + 1).trim();
            if (k && v) kv[k] = v;
          });
          const urgency = (kv["Urgency"] || result.urgency) as Urgency;
          const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG[result.urgency as Urgency];
          const lvlColor = LEVEL_COLORS[urgency as keyof typeof LEVEL_COLORS] || "#3b82f6";
          return (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
              <div className="flex items-center gap-2 mb-4">
                <Hash size={12} style={{ color: "#60a5fa" }} />
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#60a5fa" }}>{h}</span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${lvlColor}28` }}>
                {/* Urgency banner */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: `${lvlColor}10`, borderBottom: `1px solid ${lvlColor}20` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{LEVEL_ICONS[urgency as keyof typeof LEVEL_ICONS] || "⚪"}</span>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold block" style={{ color: "#64748b" }}>Urgency Level</span>
                      <span className="text-xl font-black" style={{ color: lvlColor }}>{urgency}</span>
                    </div>
                  </div>
                  {/* Severity bar */}
                  <div className="flex items-center gap-1.5">
                    {URGENCY_LEVELS.map((lvl, i) => {
                      const idx = URGENCY_LEVELS.indexOf(urgency as typeof URGENCY_LEVELS[number]);
                      return (
                        <div key={lvl} className="w-6 h-2 rounded-full" style={{
                          background: i <= idx ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.06)",
                          boxShadow: i === idx ? `0 0 8px ${LEVEL_COLORS[lvl]}80` : "none",
                        }} />
                      );
                    })}
                  </div>
                </div>
                {/* KV pairs */}
                <div className="divide-y divide-white/5">
                  {Object.entries(kv).filter(([k]) => k !== "Urgency").map(([k, v]) => (
                    <div key={k} className="flex items-start gap-4 px-5 py-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold flex-shrink-0 w-24 pt-0.5"
                        style={{ color: "#475569" }}>{k}</span>
                      <span className="text-sm text-white font-semibold">{clean(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        }

        // ── ALERTS ──
        if (h.includes("ALERT")) {
          const alerts = body.split("\n").filter(l => l.trim()).map(l => l.replace(/^[•\-*]\s*/, "").trim());
          return (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
              <div className="flex items-center gap-2 mb-4">
                <Hash size={12} style={{ color: "#60a5fa" }} />
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#60a5fa" }}>{h}</span>
              </div>
              <div className="space-y-2">
                {alerts.map((a, ai) => (
                  <div key={ai} className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-red-300">{clean(a)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        }

        // ── CLINICAL EVIDENCE ──
        if (h.includes("EVIDENCE") || h.includes("CLINICAL")) {
          const paras = body.split(/\n\n+/).filter(p => p.trim());
          return (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
              <div className="flex items-center gap-2 mb-4">
                <Hash size={12} style={{ color: "#60a5fa" }} />
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#60a5fa" }}>{h}</span>
              </div>
              <div className="space-y-3">
                {paras.map((para, pi) => {
                  // Detect if it's a labelled section (starts with a condition name)
                  const labelMatch = para.match(/^([A-Za-z\s]+?):\s*([\s\S]+)/);
                  const isLabelled = labelMatch && labelMatch[1].trim().length < 30;
                  if (isLabelled) {
                    const [, label, content] = labelMatch!;
                    const color = PATHOLOGY_COLORS[label.trim()] || "#60a5fa";
                    const meta = PATHOLOGY_META[label.trim()];
                    return (
                      <div key={pi} className="rounded-2xl overflow-hidden"
                        style={{ border: `1px solid ${color}22`, background: `${color}06` }}>
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                          style={{ background: `${color}10`, borderColor: `${color}18` }}>
                          <span className="text-sm">{meta?.icon || "📋"}</span>
                          <span className="text-xs font-black" style={{ color }}>{label.trim()}</span>
                        </div>
                        <p className="px-4 py-3 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{clean(content.trim())}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={pi} className="px-4 py-3 rounded-xl text-xs leading-relaxed"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.06)", color: "#64748b" }}>
                      {clean(para.trim())}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        }

        // ── GENERIC SECTION ──
        return (
          <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <Hash size={12} style={{ color: "#60a5fa" }} />
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#60a5fa" }}>{h}</span>
            </div>
            <div className="px-4 py-3 rounded-xl text-xs leading-relaxed"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.06)", color: "#64748b" }}>
              {clean(body)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [result, setResult]   = useState<TriageResult | null>(null);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("triageResult");
    if (raw) { try { setResult(JSON.parse(raw)); } catch {} }
    setLoaded(true);
  }, []);

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020c18" }}>
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!result) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "#020c18" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <FileText size={24} style={{ color: "#60a5fa" }} />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-black text-white mb-2">No Report Found</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>Run an analysis first, then open the report.</p>
      </div>
      <button onClick={() => window.close()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#1d4ed8" }}>
        <ArrowLeft size={14} /> Close
      </button>
    </div>
  );

  const cfg        = URGENCY_CONFIG[result.urgency as Urgency];
  const urgencyIdx = URGENCY_LEVELS.indexOf(result.urgency as Urgency);
  const lvlColor   = LEVEL_COLORS[result.urgency as Urgency] || "#3b82f6";
  const posFindings = Object.entries(result.predictions).filter(([,v]) => v >= 0.5).sort(([,a],[,b]) => b - a);
  const negFindings = Object.entries(result.predictions).filter(([,v]) => v < 0.5).sort(([,a],[,b]) => b - a);

  const fmt = (ts: string) => {
    try { return new Date(ts).toLocaleString("en-US", { month:"long", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ts; }
  };

  return (
    <div style={{ background: "#020c18", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3.5 border-b"
        style={{ background: "rgba(2,12,24,0.9)", backdropFilter: "blur(24px)", borderColor: "rgba(96,165,250,0.1)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => window.close()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
            style={{ color: "#64748b", border: "1px solid rgba(148,163,184,0.1)" }}>
            <ArrowLeft size={13} /> Close
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Activity size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">MediScan AI</span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-full"
              style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>
              TRIAGE REPORT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono hidden sm:block" style={{ color: "#334155" }}>{result.patient_id}</span>
          <ThemeToggle />
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: "#1d4ed8", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
            <Printer size={13} /> Print / PDF
          </button>
        </div>
      </nav>

      <div className="pt-20 pb-20 px-5 max-w-5xl mx-auto space-y-10">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden p-8"
          style={{ background: "linear-gradient(135deg, #091828 0%, #0c2040 100%)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${lvlColor}12 0%, transparent 65%)` }} />

          <div className="relative flex flex-col md:flex-row gap-8">
            {/* Left */}
            <div className="flex-1 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#475569" }}>Patient</p>
                <p className="text-3xl font-black text-white font-mono">{result.patient_id}</p>
                <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "#475569" }}>
                  <Clock size={11} /> {fmt(result.timestamp)}
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <Stethoscope size={16} style={{ color: "#60a5fa" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#475569" }}>Specialist Referral</p>
                  <p className="text-sm font-black text-white">{result.specialist}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#64748b" }}>{clean(result.routing_reason)}</p>
                </div>
              </div>

              {result.alerts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}>
                      <AlertTriangle size={10} /> {clean(a)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: urgency */}
            <div className="md:w-56 space-y-4 flex-shrink-0">
              <div className="text-center p-6 rounded-2xl"
                style={{ background: `${lvlColor}10`, border: `1px solid ${lvlColor}28` }}>
                <p className="text-4xl mb-2">{LEVEL_ICONS[result.urgency as keyof typeof LEVEL_ICONS]}</p>
                <p className="text-xl font-black" style={{ color: lvlColor }}>{result.urgency}</p>
                <p className="text-xs mt-2 leading-snug" style={{ color: "#94a3b8" }}>{clean(result.urgency_reason)}</p>
              </div>
              {/* Scale */}
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.06)" }}>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-center mb-2.5" style={{ color: "#334155" }}>Severity Scale</p>
                <div className="flex items-center gap-1">
                  {URGENCY_LEVELS.map((lvl, i) => (
                    <div key={lvl} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-2 rounded-full"
                        style={{ background: i <= urgencyIdx ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.05)", boxShadow: i === urgencyIdx ? `0 0 8px ${LEVEL_COLORS[lvl]}90` : "none" }} />
                      <span className="text-[8px] font-bold" style={{ color: i <= urgencyIdx ? LEVEL_COLORS[lvl] : "#1e293b" }}>{lvl.slice(0,3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── DETECTED CONDITIONS ─────────────────────────────────────── */}
        {posFindings.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionHeader icon={XCircle} title="Detected Conditions" badge={`${posFindings.length} positive`} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posFindings.map(([label, prob], i) => {
                const pct   = Math.round(prob * 100);
                const color = PATHOLOGY_COLORS[label] || "#ef4444";
                const meta  = PATHOLOGY_META[label];
                return (
                  <motion.div key={label}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    className="rounded-2xl p-5"
                    style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-2xl">{meta?.icon}</span>
                        <p className="text-sm font-black text-white mt-1">{label}</p>
                        <p className="text-[11px] leading-snug mt-0.5" style={{ color: "#64748b" }}>{meta?.brief}</p>
                      </div>
                      <div className="relative flex-shrink-0 ml-2">
                        <RingProgress pct={pct} color={color} size={68} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-black" style={{ color }}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {meta?.tags.map(t => (
                        <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{t}</span>
                      ))}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.3 + i * 0.07 }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── CLEAR CONDITIONS ───────────────────────────────────────── */}
        {negFindings.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <SectionHeader icon={CheckCircle} title="No Finding" badge={`${negFindings.length} clear`} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {negFindings.map(([label, prob]) => {
                const pct  = Math.round(prob * 100);
                const meta = PATHOLOGY_META[label];
                return (
                  <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{meta?.icon} {label}</p>
                      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: "rgba(34,197,94,0.35)" }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.16,1,0.3,1], delay: 0.35 }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black flex-shrink-0" style={{ color: "#4ade80" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── MODEL ENSEMBLE ─────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <SectionHeader icon={Brain} title="Ensemble Model Breakdown" badge="4 models" />
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(148,163,184,0.08)" }}>
            {/* Column headers */}
            <div className="grid px-5 py-3 text-[9px] uppercase tracking-wider font-bold"
              style={{ gridTemplateColumns: "150px repeat(5, 1fr)", background: "rgba(255,255,255,0.02)", color: "#334155" }}>
              <span>Model</span>
              {Object.keys(result.predictions).map(k => (
                <span key={k} className="text-center">{k === "Pleural Effusion" ? "Pl. Eff." : k}</span>
              ))}
            </div>
            {MODEL_NAMES.map((name, mi) => {
              const color = MODEL_COLORS[mi];
              return (
                <div key={name} className="grid px-5 py-3.5 border-t items-center"
                  style={{ gridTemplateColumns: "150px repeat(5, 1fr)", borderColor: "rgba(148,163,184,0.05)", background: mi % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{name}</span>
                  </div>
                  {Object.entries(result.individual_predictions).map(([label, vals]) => {
                    const v   = vals[mi] ?? 0;
                    const pct = Math.round(v * 100);
                    const pos = v >= 0.5;
                    return (
                      <div key={label} className="flex flex-col items-center gap-1.5 px-2">
                        <span className="text-xs font-bold" style={{ color: pos ? PATHOLOGY_COLORS[label] || color : "#1e293b" }}>{pct}%</span>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <motion.div className="h-full rounded-full"
                            style={{ background: pos ? PATHOLOGY_COLORS[label] || color : "#1e293b" }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: [0.16,1,0.3,1], delay: 0.4 + mi * 0.06 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* Ensemble row */}
            <div className="grid px-5 py-4 border-t items-center"
              style={{ gridTemplateColumns: "150px repeat(5, 1fr)", borderColor: "rgba(96,165,250,0.12)", background: "rgba(59,130,246,0.05)" }}>
              <div className="flex items-center gap-2">
                <Zap size={12} style={{ color: "#60a5fa" }} />
                <span className="text-xs font-black text-white">Ensemble</span>
              </div>
              {Object.entries(result.predictions).map(([label, prob]) => {
                const pct = Math.round(prob * 100);
                const pos = prob >= 0.5;
                const c   = PATHOLOGY_COLORS[label] || "#ef4444";
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5 px-2">
                    <span className="text-xs font-black" style={{ color: pos ? c : "#22c55e" }}>{pct}%</span>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: pos ? `linear-gradient(90deg,${c}70,${c})` : "rgba(34,197,94,0.45)" }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.65 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ── TRIAGE REPORT (parsed, visual) ─────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <SectionHeader icon={FileText} title="Triage Report" badge="parsed" />
          <ParsedReport reportText={result.report} result={result} />
        </motion.section>

        {/* ── CLINICAL EVIDENCE ──────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
          <SectionHeader icon={BookOpen} title="Clinical Evidence" badge="RAG" />
          <div className="space-y-3">
            {clean(result.evidence).split(/\n\n+/).filter(p => p.trim() && !p.startsWith("---")).map((para, pi) => {
              const labelMatch = para.match(/^([A-Za-z\s]+?):\s*([\s\S]+)/);
              if (labelMatch && labelMatch[1].trim().length < 30) {
                const [, label, content] = labelMatch;
                const color = PATHOLOGY_COLORS[label.trim()] || "#60a5fa";
                const meta  = PATHOLOGY_META[label.trim()];
                return (
                  <motion.div key={pi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + pi * 0.06 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b"
                      style={{ background: `${color}0e`, borderColor: `${color}18` }}>
                      <span className="text-base">{meta?.icon || "📋"}</span>
                      <span className="text-xs font-black" style={{ color }}>{label.trim()}</span>
                    </div>
                    <p className="px-4 py-3 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{clean(content.trim())}</p>
                  </motion.div>
                );
              }
              return (
                <div key={pi} className="px-4 py-3 rounded-xl text-xs leading-relaxed italic"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.06)", color: "#475569" }}>
                  {clean(para.trim())}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── ACTIONS ────────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <SectionHeader icon={ShieldCheck} title="Recommended Actions" />
          <div className="space-y-3">
            {[
              { priority: "Immediate", action: `Refer to ${result.specialist}`,             color: "#ef4444", num: "01" },
              { priority: "Urgent",    action: clean(result.urgency_reason),                color: "#f97316", num: "02" },
              ...result.alerts.map((a, i) => ({ priority: "Alert", action: clean(a),        color: "#eab308", num: `0${i+3}` })),
              { priority: "Follow-up", action: "Document findings and schedule follow-up imaging if required.", color: "#22c55e", num: "—" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.68 + i * 0.06 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: `${item.color}07`, border: `1px solid ${item.color}18` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-mono font-black text-xs"
                  style={{ background: `${item.color}15`, color: item.color }}>
                  {item.num}
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: item.color }}>{item.priority}</span>
                  <p className="text-sm font-semibold text-white">{item.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <footer className="border-t pt-8 text-center space-y-1.5" style={{ borderColor: "rgba(148,163,184,0.06)" }}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Activity size={10} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">MediScan AI</span>
          </div>
          <p className="text-xs" style={{ color: "#334155" }}>Autonomous X-Ray Triage Agent</p>
          <p className="text-[10px]" style={{ color: "#1e293b" }}>For research use only. Not validated for clinical diagnosis. Always consult a licensed physician.</p>
        </footer>
      </div>
    </div>
  );
}


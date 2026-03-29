"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Scan, Activity, AlertTriangle,
  Stethoscope, CheckCircle, XCircle, BookOpen, FileText,
  Loader2, ImageIcon, User, Trash2, ExternalLink,
  BarChart2, Zap, Brain, TrendingUp, ChevronRight
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import type { TriageResult, Urgency } from "@/lib/types";
import { URGENCY_CONFIG, PATHOLOGY_COLORS } from "@/lib/types";
import PathologyChart from "./PathologyChart";
import ModelAgreementChart from "./ModelAgreementChart";
import UrgencyBadge from "./UrgencyBadge";
import clsx from "clsx";

interface Props { onBack: () => void; }
type AppState = "idle" | "analyzing" | "done" | "error";
type Tab = "findings" | "charts" | "evidence" | "report";

const PATHOLOGY_META: Record<string, { icon: string; brief: string; color: string }> = {
  Pneumothorax:      { icon: "🫁", brief: "Collapsed lung — air in pleural space", color: "#ef4444" },
  Edema:             { icon: "💧", brief: "Fluid accumulation in lung tissue",        color: "#8b5cf6" },
  Pneumonia:         { icon: "🦠", brief: "Bacterial / viral lung infection",          color: "#f97316" },
  Cardiomegaly:      { icon: "❤️",  brief: "Enlarged cardiac silhouette",             color: "#3b82f6" },
  "Pleural Effusion":{ icon: "🌊", brief: "Fluid in pleural cavity",                  color: "#06b6d4" },
};

const MODELS = ["DenseNet-121", "EfficientNet-B0", "EfficientNet-B3", "ResNet-50"];

export default function XrayApp({ onBack }: Props) {
  const router = useRouter();
  const [state, setState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("findings");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f); setPreview(URL.createObjectURL(f));
    setState("idle"); setResult(null); setError("");
  };

  const clearFile = () => {
    setFile(null); setPreview(null); setState("idle");
    setResult(null); setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = useCallback(async () => {
    if (!file || state === "analyzing") return;
    setState("analyzing"); setError(""); setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId.trim());
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze`, { method: "POST", body: formData });
      if (!res.ok) { const b = await res.json().catch(()=>({})); throw new Error(b.detail||`Error ${res.status}`); }
      const data: TriageResult = await res.json();
      setResult(data); setState("done"); setTab("findings");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error"); setState("error");
    }
  }, [file, patientId, state]);

  const openFullReport = () => {
    if (!result) return;
    sessionStorage.setItem("triageResult", JSON.stringify(result));
    if (preview) sessionStorage.setItem("triagePreview", preview);
    window.open("/report", "_blank");
  };

  const cfg = result ? URGENCY_CONFIG[result.urgency as Urgency] : null;

  /* ── Evidence parser: split into sections ── */
  const parseEvidence = (raw: string) => {
    const lines = raw.split("\n").filter(Boolean);
    const sections: { heading: string; lines: string[] }[] = [];
    let cur: { heading: string; lines: string[] } | null = null;
    for (const line of lines) {
      if (line.startsWith("---") || line.startsWith("⚕️")) {
        if (cur) sections.push(cur);
        if (line.startsWith("⚕️")) sections.push({ heading: "", lines: [line] });
        cur = null;
      } else if (/^[A-Z][A-Za-z\s]+:/.test(line) && line.length < 60) {
        if (cur) sections.push(cur);
        cur = { heading: line.replace(/:$/, ""), lines: [] };
      } else {
        if (!cur) cur = { heading: "Overview", lines: [] };
        cur.lines.push(line);
      }
    }
    if (cur) sections.push(cur);
    return sections.filter(s => s.lines.length || s.heading);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b z-10"
        style={{ borderColor: "var(--border)", background: "rgba(2,8,23,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl transition-all"
            style={{ color: "var(--muted)" }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Activity size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">MediScan AI</span>
            <span className="text-xs" style={{ color: "var(--dim)" }}>· Chest X-Ray Triage</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {result && cfg && (
            <>
              <div className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                cfg.bg, cfg.border, cfg.color)}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                {result.urgency}
              </div>
              <button onClick={openFullReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all no-print"
                style={{ background: "var(--blue-lo)", border: "1px solid var(--border3)", color: "var(--blue)" }}>
                <ExternalLink size={12} /> Full Report
              </button>
            </>
          )}
          <ThemeToggle />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#4ade80" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:block">Ready</span>
          </div>
        </div>
      </header>

      {/* ── Split Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT — Upload ══════════════════════════════════════ */}
        <div className="w-[400px] flex-shrink-0 flex flex-col overflow-y-auto border-r"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          <div className="p-6 flex flex-col gap-5 h-full">

            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">Upload X-Ray</h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>JPEG · PNG · max 20 MB</p>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !preview && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
              className="relative rounded-2xl overflow-hidden transition-all duration-200 border-2 border-dashed"
              style={{
                borderColor: dragOver ? "var(--blue)" : preview ? "var(--border2)" : "var(--border)",
                background: dragOver ? "var(--blue-lo)" : "transparent",
                cursor: preview ? "default" : "pointer",
              }}>
              <AnimatePresence mode="wait">
                {!preview ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center float"
                      style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
                      <ImageIcon size={26} style={{ color: "var(--dim)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {dragOver ? "Release to upload" : "Drop X-Ray or click"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Chest radiographs · JPEG / PNG</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--blue-lo)", border: "1px solid var(--border3)", color: "var(--blue)" }}>
                      <Upload size={12} /> Choose File
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="X-ray" className="w-full max-h-[300px] object-cover"
                      style={{ filter: "brightness(0.88) contrast(1.15) saturate(0.3)" }} />
                    {state === "analyzing" && (
                      <div className="absolute inset-0">
                        <div className="scan-beam absolute left-0 right-0 h-20" />
                        <div className="absolute inset-0" style={{ background: "rgba(59,130,246,0.06)" }} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
                      style={{ background: "linear-gradient(to top, rgba(2,8,23,0.9), transparent)" }}>
                      <span className="text-xs font-mono truncate max-w-[200px]" style={{ color: "var(--text)" }}>
                        {file?.name}
                      </span>
                      <button onClick={e => { e.stopPropagation(); clearFile(); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />

            {/* Patient ID */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <User size={13} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
                placeholder="Patient ID (optional)"
                className="flex-1 bg-transparent text-xs outline-none font-mono-med"
                style={{ color: "var(--text)", caretColor: "var(--blue)" }} />
            </div>

            {/* Analyze button */}
            <motion.button onClick={analyze}
              disabled={!file || state === "analyzing"}
              whileHover={file && state !== "analyzing" ? { scale: 1.02 } : {}}
              whileTap={file && state !== "analyzing" ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all duration-200"
              style={file && state !== "analyzing"
                ? { background: "#2563eb", color: "white", boxShadow: "0 0 32px rgba(59,130,246,0.4)" }
                : { background: "var(--surface)", color: "var(--dim)", cursor: "not-allowed", border: "1px solid var(--border)" }}>
              {state === "analyzing"
                ? <><Loader2 size={16} className="animate-spin" /> Analyzing with 4 models…</>
                : <><Scan size={16} /> {result ? "Re-Analyze" : "Analyze X-Ray"}</>}
            </motion.button>

            {/* Error */}
            <AnimatePresence>
              {state === "error" && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Detects list */}
            <div className="mt-auto pt-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--dim)" }}>Detects</p>
              <div className="space-y-1.5">
                {Object.entries(PATHOLOGY_META).map(([name, meta]) => (
                  <div key={name} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="text-sm">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{meta.brief}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color, opacity: 0.7 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT — Results ════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#020c1e" }}>
          <AnimatePresence mode="wait">

            {/* Idle */}
            {state === "idle" && !result && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-8 p-10 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full spin-slow"
                    style={{ border: "1px dashed rgba(59,130,246,0.2)", transform: "scale(1.6)" }} />
                  <div className="absolute inset-0 rounded-full"
                    style={{ border: "1px solid rgba(59,130,246,0.08)", transform: "scale(2.1)" }} />
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border2)" }}>
                    <Scan size={32} style={{ color: "rgba(59,130,246,0.5)" }} />
                  </div>
                </div>
                <div className="max-w-sm">
                  <h3 className="text-xl font-black text-white mb-2">Awaiting Upload</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    Upload a chest X-ray on the left and click <strong className="text-white">Analyze X-Ray</strong>.
                    The AI ensemble will return results in under 2 seconds.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {[
                    { icon: Brain, label: "4-Model Ensemble", sub: "DenseNet · EffNet · ResNet" },
                    { icon: Zap, label: "< 2s Triage", sub: "Urgency + routing" },
                    { icon: BarChart2, label: "5 Pathologies", sub: "Simultaneous detection" },
                    { icon: BookOpen, label: "RAG Evidence", sub: "Clinical guidelines" },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="p-4 rounded-2xl text-left"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <Icon size={16} style={{ color: "var(--blue)" }} className="mb-2" />
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analyzing */}
            {state === "analyzing" && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="text-blue-400 animate-spin" />
                  <span className="text-sm font-bold text-blue-400">Running ensemble inference…</span>
                </div>
                <div className="space-y-4">
                  <div className="skeleton h-20 rounded-2xl" />
                  <div className="space-y-2">
                    {[90,70,55,40,22].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="skeleton h-3 rounded-full flex-1" style={{ maxWidth: `${w}%` }} />
                        <div className="skeleton h-3 w-10 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="skeleton h-24 rounded-2xl" />
                </div>
                <div className="mt-auto space-y-2.5 p-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {[
                    { label: "Image preprocessing", done: true },
                    { label: "DenseNet-121 inference", done: true },
                    { label: "EfficientNet-B0 / B3 inference", done: false },
                    { label: "ResNet-50 inference", done: false },
                    { label: "Soft-vote ensemble aggregation", done: false },
                    { label: "Retrieving clinical evidence (RAG)", done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      {s.done
                        ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                        : <div className="w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center"
                            style={{ borderColor: "var(--dim)" }}>
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: "var(--dim)" }} />
                          </div>}
                      <span style={{ color: s.done ? "var(--text)" : "var(--dim)" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results */}
            {state === "done" && result && cfg && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
                className="flex-1 flex flex-col overflow-hidden">

                {/* Urgency banner */}
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b"
                  style={{ background: `${cfg.bg.replace("bg-","").replace("/10","")}10`, borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <UrgencyBadge urgency={result.urgency as Urgency} pulse size="lg" />
                    <div>
                      <p className={clsx("text-sm font-bold", cfg.color)}>{result.urgency_reason}</p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--muted)" }}>{result.patient_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Stethoscope size={13} style={{ color: "var(--muted)" }} />
                    <span className={clsx("font-bold", cfg.color)}>{result.specialist}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 flex border-b px-2"
                  style={{ borderColor: "var(--border)" }}>
                  {(["findings","charts","evidence","report"] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className="px-4 py-3 text-xs font-semibold capitalize transition-colors relative">
                      <span style={{ color: tab === t ? "#60a5fa" : "var(--muted)" }}>{t}</span>
                      {tab === t && (
                        <motion.div layoutId="tab-line"
                          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full"
                          style={{ background: "var(--blue)" }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">

                    {/* FINDINGS ──────────────────────────────────── */}
                    {tab === "findings" && (
                      <motion.div key="findings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-5 space-y-5">
                        {/* Routing card */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl"
                          style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--blue-lo)", border: "1px solid var(--border3)" }}>
                            <Stethoscope size={17} style={{ color: "var(--blue)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--muted)" }}>Refer to</p>
                            <p className="text-base font-black text-white">{result.specialist}</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{result.routing_reason}</p>
                          </div>
                          <ChevronRight size={16} style={{ color: "var(--dim)" }} className="flex-shrink-0 mt-1" />
                        </div>

                        {/* Alerts */}
                        {result.alerts.length > 0 && (
                          <div className="p-4 rounded-2xl flex items-start gap-3"
                            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              {result.alerts.map((a,i) => (
                                <p key={i} className="text-xs font-semibold text-red-300">{a}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pathology bars */}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--dim)" }}>
                            Prediction Confidence
                          </p>
                          <div className="space-y-3.5">
                            {Object.entries(result.predictions)
                              .sort(([,a],[,b]) => b - a)
                              .map(([label, prob]) => {
                                const pos = prob >= 0.5;
                                const pct = Math.round(prob * 100);
                                const color = PATHOLOGY_COLORS[label] || "#3b82f6";
                                const meta = PATHOLOGY_META[label];
                                return (
                                  <div key={label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="flex items-center gap-2 text-xs">
                                        {pos
                                          ? <XCircle size={12} className="text-red-400" />
                                          : <CheckCircle size={12} className="text-green-400" />}
                                        <span style={{ color: pos ? "white" : "var(--muted)" }} className={pos ? "font-bold" : ""}>
                                          {meta?.icon} {label}
                                        </span>
                                        {pos && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                                            style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                                            DETECTED
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-mono font-black text-sm"
                                        style={{ color: pos ? color : "var(--dim)" }}>
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                                      <motion.div className="h-full rounded-full"
                                        style={{ background: pos
                                          ? `linear-gradient(90deg, ${color}bb, ${color})`
                                          : "rgba(34,197,94,0.25)" }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.9, ease: [0.16,1,0.3,1], delay: 0.1 }} />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* CHARTS ─────────────────────────────────────── */}
                    {tab === "charts" && (
                      <motion.div key="charts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-5 space-y-8">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={14} style={{ color: "var(--blue)" }} />
                            <p className="text-xs font-semibold text-white">Disease Probability</p>
                          </div>
                          <PathologyChart predictions={result.predictions} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Brain size={14} style={{ color: "var(--blue)" }} />
                            <p className="text-xs font-semibold text-white">Model Agreement — 4 Models</p>
                          </div>
                          <ModelAgreementChart individualPredictions={result.individual_predictions} />
                        </div>
                      </motion.div>
                    )}

                    {/* EVIDENCE ───────────────────────────────────── */}
                    {tab === "evidence" && (
                      <motion.div key="evidence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} style={{ color: "var(--blue)" }} />
                            <p className="text-xs font-semibold text-white">Retrieved Clinical Guidelines</p>
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full font-mono"
                            style={{ background: "var(--blue-lo)", color: "var(--blue)", border: "1px solid var(--border3)" }}>
                            RAG · Knowledge Base
                          </span>
                        </div>

                        {/* Parsed evidence sections */}
                        {parseEvidence(result.evidence).map((section, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="evidence-card">
                            {section.heading && (
                              <div className="evidence-card-header">
                                <div className="w-1.5 h-4 rounded-full" style={{ background: "var(--blue)" }} />
                                <span className="text-xs font-bold text-white">{section.heading}</span>
                              </div>
                            )}
                            <div className="p-4 space-y-2">
                              {section.lines.map((line, j) => (
                                <p key={j} className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                                  {line.startsWith("•") || line.startsWith("-")
                                    ? <span className="flex gap-2"><span style={{ color: "var(--blue)" }}>›</span><span>{line.slice(1).trim()}</span></span>
                                    : line.startsWith("⚕️")
                                      ? <span className="italic text-[11px]" style={{ color: "var(--muted)" }}>{line}</span>
                                      : line}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* REPORT ─────────────────────────────────────── */}
                    {tab === "report" && (
                      <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-5 space-y-4">
                        {/* Open full report CTA */}
                        <motion.div
                          whileHover={{ y: -2 }}
                          onClick={openFullReport}
                          className="cursor-pointer p-5 rounded-2xl flex items-center gap-4 transition-all"
                          style={{ background: "var(--surface2)", border: "1px solid var(--border3)" }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--blue-lo)" }}>
                            <ExternalLink size={20} style={{ color: "var(--blue)" }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-white">Open Full Interactive Report</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                              Full-page report with charts, model breakdown, evidence & print/PDF export
                            </p>
                          </div>
                          <ChevronRight size={16} style={{ color: "var(--blue)" }} />
                        </motion.div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Conditions Detected", value: (result.positive_findings ?? []).length },
                            { label: "Models Ensemble", value: "4" },
                            { label: "Urgency Level", value: result.urgency },
                          ].map(({ label, value }) => (
                            <div key={label} className="p-3 rounded-2xl text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                              <p className="text-lg font-black text-white">{value}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

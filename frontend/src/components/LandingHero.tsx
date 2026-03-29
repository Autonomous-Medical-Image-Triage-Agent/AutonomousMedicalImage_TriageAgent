"use client";
// MediScan AI — Landing hero page with animated demo preview
import { motion, useScroll, useTransform } from "framer-motion";
import { Activity, Brain, Zap, ShieldCheck, ArrowRight, Cpu, Scan, Layers, ChevronDown } from "lucide-react";
import { useRef } from "react";
import ThemeToggle from "./ThemeToggle";

const features = [
  { icon: Brain,       title: "4-Model Ensemble",  desc: "DenseNet-121, EfficientNet-B0/B3, ResNet-50 — soft-voted consensus for peak accuracy.", accent: "#3b82f6" },
  { icon: Zap,         title: "Real-Time Triage",  desc: "Critical findings flagged in under 2 seconds with urgency-based specialist routing.", accent: "#f59e0b" },
  { icon: ShieldCheck, title: "5 Pathologies",     desc: "Pneumothorax · Edema · Pneumonia · Cardiomegaly · Pleural Effusion simultaneously.", accent: "#22c55e" },
  { icon: Cpu,         title: "RAG Evidence",      desc: "Clinical guidelines retrieved in real-time, grounding every decision in evidence.", accent: "#a78bfa" },
];

const stats = [
  { value: "0.88", label: "Ensemble AUC",   sub: "vs 0.81 single model" },
  { value: "4×",   label: "Model Votes",    sub: "consensus inference" },
  { value: "5",    label: "Pathologies",    sub: "detected simultaneously" },
  { value: "<2s",  label: "Triage Time",    sub: "end-to-end latency" },
];

const pathologies = [
  { name: "Pneumothorax",      pct: 82, color: "#ef4444" },
  { name: "Pleural Effusion",  pct: 67, color: "#06b6d4" },
  { name: "Edema",             pct: 44, color: "#8b5cf6" },
  { name: "Pneumonia",         pct: 31, color: "#f97316" },
  { name: "Cardiomegaly",      pct: 19, color: "#3b82f6" },
];

interface Props { onStart: () => void; }

export default function LandingHero({ onStart }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: "rgba(2,8,23,0.85)", backdropFilter: "blur(20px)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity size={15} className="text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">MediScan AI</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden sm:block" style={{ color: "var(--muted)" }}>Autonomous X-Ray Triage</span>
          <ThemeToggle />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            System Online
          </div>
          <button onClick={onStart}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ background: "white", color: "black" }}>
            Launch App <ArrowRight size={12} />
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden grid-bg">
        {/* Radial bloom */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Pill badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
            <Scan size={12} />
            Autonomous Chest X-Ray Triage Agent · Research Project
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(2.8rem,8vw,5.5rem)] font-black leading-[1.05] tracking-tight mb-6">
            AI Triage for
            <br />
            <span className="grad-blue">Chest X-Rays</span>
            <br />
            in Seconds.
          </motion.h1>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onStart}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all"
              style={{ background: "#2563eb", boxShadow: "0 0 40px rgba(59,130,246,0.45)" }}>
              <Scan size={18} />
              Start X-Ray Analysis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ color: "var(--dim)" }}>
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </motion.div>
      </section>

      {/* ── Live Demo Preview ────────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#60a5fa" }}>Live preview</p>
            <h2 className="text-3xl md:text-4xl font-black">
              What the AI sees in <span className="grad-text">every scan</span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}
            className="rounded-3xl overflow-hidden card-glow"
            style={{ background: "var(--surface)" }}>

            {/* Header band */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.15)" }}>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold urgency-pulse"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  ⚡ CRITICAL
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>PT-A3F2C1</span>
              </div>
              <span className="text-xs font-bold" style={{ color: "#f87171" }}>→ Thoracic Surgery</span>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Scan visual */}
              <div className="relative p-8 flex items-center justify-center border-r" style={{ borderColor: "var(--border)" }}>
                <div className="relative w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #0a0f1a, #0f1a2d)", border: "1px solid var(--border2)" }}>
                  <div className="absolute inset-0 opacity-15"
                    style={{ backgroundImage: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.35) 0%, transparent 62%)" }} />
                  <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 260 260">
                    <ellipse cx="88" cy="148" rx="52" ry="76" stroke="white" strokeWidth="1.2" fill="none" />
                    <ellipse cx="172" cy="148" rx="52" ry="76" stroke="white" strokeWidth="1.2" fill="none" />
                    <line x1="130" y1="55" x2="130" y2="235" stroke="white" strokeWidth="0.8" />
                    <line x1="90"  y1="65" x2="90"  y2="90"  stroke="white" strokeWidth="0.8" />
                    <line x1="170" y1="65" x2="170" y2="90"  stroke="white" strokeWidth="0.8" />
                  </svg>
                  <div className="scan-beam absolute left-0 right-0 h-16" />
                  {/* Detection box */}
                  <div className="absolute top-[20%] left-[10%] w-[35%] h-[30%] rounded-xl"
                    style={{ border: "2px solid rgba(239,68,68,0.75)", background: "rgba(239,68,68,0.08)", boxShadow: "0 0 20px rgba(239,68,68,0.25)" }} />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <span className="text-[9px] font-mono" style={{ color: "var(--muted)" }}>AI MODEL PROCESSING…</span>
                  </div>
                </div>
              </div>

              {/* Bars */}
              <div className="p-8 space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-6" style={{ color: "var(--dim)" }}>
                  Ensemble Predictions
                </p>
                {pathologies.map((p, i) => (
                  <motion.div key={p.name}
                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 + 0.2 }}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2" style={{ color: "var(--text)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className="font-mono font-bold" style={{ color: p.color }}>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${p.color}90, ${p.color})` }}
                        initial={{ width: 0 }} whileInView={{ width: `${p.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 + 0.3, ease: [0.16,1,0.3,1] }} />
                    </div>
                  </motion.div>
                ))}
                <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>Pneumothorax detected — immediate intervention</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#60a5fa" }}>Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-black">
              Built for <span className="grad-text">clinical precision</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl p-5 cursor-default transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}28` }}>
                  <f.icon size={18} style={{ color: f.accent }} />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#60a5fa" }}>How it works</p>
            <h2 className="text-3xl md:text-4xl font-black">Three steps to triage</h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { step:"01", title:"Upload X-Ray",          desc:"Drop any chest radiograph (JPEG/PNG). Optionally enter a patient ID for tracking.", icon:Layers },
              { step:"02", title:"Ensemble Inference",    desc:"Four deep learning models run in parallel. Soft-vote averaging for maximum reliability.", icon:Brain },
              { step:"03", title:"Interactive Report",    desc:"Urgency level, specialist routing, RAG evidence, model breakdown & downloadable PDF report.", icon:ShieldCheck },
            ].map((item, i) => (
              <motion.div key={item.step}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex items-start gap-5 p-5 rounded-2xl transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--blue-lo)", border: "1px solid var(--border3)" }}>
                  <item.icon size={18} style={{ color: "#60a5fa" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono font-bold" style={{ color: "#3b82f6" }}>{item.step}</span>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden p-12 blue-glow"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full blur-[70px]"
                style={{ background: "rgba(59,130,246,0.15)" }} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <Activity size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-black mb-3">Ready to analyze?</h2>
              <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
                Upload a chest X-ray or ask the AI assistant about any of the 5 pathologies.
              </p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onStart}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm text-black transition-colors shadow-lg"
                style={{ background: "white" }}>
                <Scan size={16} />
                Open MediScan AI
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-6" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--dim)" }}>
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Activity size={10} className="text-white" />
            </div>
            MediScan AI — Autonomous Chest X-Ray Triage
          </div>
          <span className="text-xs" style={{ color: "var(--dim)" }}>For research use only · Not for clinical diagnosis</span>
        </div>
      </footer>
    </div>
  );
}

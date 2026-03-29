"use client";
// MediScan AI — RAG-powered floating chatbot widget
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Activity, Minimize2, Moon, Maximize2 } from "lucide-react";
import clsx from "clsx";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  typing?: boolean;
};

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  content: "👋 Hi! I'm **MediScan Assistant** — your AI guide for this platform.\n\nAsk me about the **5 conditions** we detect:\n• Pneumothorax · Edema · Pneumonia\n• Cardiomegaly · Pleural Effusion\n\nOr ask about triage levels, urgency, specialist routing, or how to read results.",
};

const SUGGESTIONS = [
  "What is pneumothorax?",
  "How urgent is pulmonary edema?",
  "What causes pleural effusion?",
  "Explain triage urgency levels",
];

function uid() { return Math.random().toString(36).slice(2); }

function renderMd(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1
          ? <strong key={j} className="text-white font-semibold">{part}</strong>
          : part
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function FloatingChat() {
  const [open, setOpen]         = useState(false);
  const [dimBg, setDimBg]       = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [hasNew, setHasNew]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      // Remove dim when closed
      setDimBg(false);
    }
  }, [open]);

  const send = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    setInput("");

    const userMsg: Message = { id: uid(), role: "user", content: question };
    const typingId = uid();
    setMessages(prev => [...prev, userMsg, { id: typingId, role: "ai", content: "", typing: true }]);
    setLoading(true);

    const newHistory = [...history, { role: "user", content: question }];

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const data = await res.json();
      const reply = (data.reply || "Sorry, I couldn't get a response.")
        .replace(/\u2014/g, "-").replace(/\u2013/g, "-");

      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        { id: uid(), role: "ai", content: reply },
      ]);
      if (!open) setHasNew(true);
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        { id: uid(), role: "ai", content: "⚠️ Can't reach the server. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, history, open]);

  return (
    <>
      {/* ── Dim overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {open && dimBg && (
          <motion.div
            key="dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(2,8,23,0.75)", backdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Widget container ──────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className={clsx("flex flex-col overflow-hidden", fullscreen ? "rounded-none fixed inset-0 z-[60]" : "w-[370px] rounded-2xl")}
              style={{
                height: fullscreen ? "100vh" : "520px",
                background: "var(--surface)",
                boxShadow: fullscreen ? "none" : "0 8px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.14)",
              }}
            >
              {/* ── Header ── */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
                style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.2), rgba(109,40,217,0.1))", borderColor: "var(--border2)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Activity size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">MediScan Assistant</p>
                    <p className="text-[10px] flex items-center gap-1.5" style={{ color: "#4ade80" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                      Online · Powered by Claude
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Dim toggle */}
                  <button
                    onClick={() => setDimBg(v => !v)}
                    title={dimBg ? "Remove dim" : "Dim background"}
                    className="p-2 rounded-xl transition-all"
                    style={{
                      background: dimBg ? "rgba(59,130,246,0.2)" : "transparent",
                      color: dimBg ? "#60a5fa" : "#475569",
                      border: dimBg ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent",
                    }}>
                    <Moon size={12} />
                  </button>
                  {/* Fullscreen toggle */}
                  <button
                    onClick={() => setFullscreen(v => !v)}
                    title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                    className="p-2 rounded-xl transition-all"
                    style={{
                      background: fullscreen ? "rgba(59,130,246,0.2)" : "transparent",
                      color: fullscreen ? "#60a5fa" : "#475569",
                      border: fullscreen ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent",
                    }}>
                    <Maximize2 size={12} />
                  </button>
                  <button onClick={() => { setOpen(false); setFullscreen(false); }}
                    className="p-2 rounded-xl transition-colors"
                    style={{ color: "#475569" }}>
                    <Minimize2 size={13} />
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
                style={{ background: "#020c18" }}>
                {messages.map(msg => (
                  <div key={msg.id} className={clsx("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
                    {msg.role === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <Activity size={10} className="text-white" />
                      </div>
                    )}
                    <div className={clsx(
                      "rounded-2xl px-3 py-2.5 text-xs leading-relaxed",
                      fullscreen ? "max-w-[680px]" : "max-w-[268px]",
                      msg.role === "ai"
                        ? "rounded-tl-sm chat-ai text-slate-300"
                        : "rounded-tr-sm chat-user text-white ml-auto"
                    )}>
                      {msg.typing ? (
                        <div className="flex items-center gap-1 py-0.5 px-1">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full"
                              style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      ) : renderMd(msg.content)}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* ── Suggestions ── */}
              {messages.length === 1 && (
                <div className="flex-shrink-0 px-3 pb-2 flex flex-wrap gap-1.5" style={{ background: "#020c18" }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-[10px] px-2.5 py-1.5 rounded-full transition-all"
                      style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--muted)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border2)"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div className="flex-shrink-0 border-t px-3 py-3"
                style={{ borderColor: "var(--border2)", background: "var(--surface)" }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "#020c18", border: "1px solid var(--border2)" }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send(input.trim())}
                    placeholder="Ask about chest X-ray findings…"
                    className="flex-1 bg-transparent text-xs outline-none"
                    style={{ color: "var(--text)", caretColor: "#3b82f6" }}
                  />
                  <button
                    onClick={() => send(input.trim())}
                    disabled={!input.trim() || loading}
                    className="p-1.5 rounded-lg transition-all flex-shrink-0"
                    style={input.trim() && !loading
                      ? { background: "#2563eb", color: "white" }
                      : { background: "rgba(255,255,255,0.04)", color: "#334155", cursor: "not-allowed" }}>
                    {loading
                      ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={12} />}
                  </button>
                </div>
                <p className="text-center text-[9px] mt-2" style={{ color: "#1e293b" }}>
                  Scoped to project knowledge · Powered by OpenRouter
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Trigger button ── */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            boxShadow: open
              ? "0 4px 40px rgba(59,130,246,0.7)"
              : "0 4px 28px rgba(59,130,246,0.45)",
          }}>
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={20} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="chat"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle size={22} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread dot */}
          {hasNew && !open && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 animate-bounce"
              style={{ borderColor: "#020c18" }} />
          )}
        </motion.button>
      </div>
    </>
  );
}

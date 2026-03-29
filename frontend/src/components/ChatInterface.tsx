"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Activity, ImageIcon, X, ArrowLeft, Paperclip } from "lucide-react";
import type { TriageResult } from "@/lib/types";
import ResultsCard from "./ResultsCard";
import clsx from "clsx";

type MessageRole = "ai" | "user";

interface Message {
  id: string;
  role: MessageRole;
  type: "text" | "image" | "results" | "typing";
  content?: string;
  imageUrl?: string;
  results?: TriageResult;
}

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  type: "text",
  content: "👋 Hi! I'm **MediScan AI** — your chest X-ray triage assistant.\n\nI can help you with:\n• 🔬 **X-ray analysis** — upload a chest scan for instant AI triage\n• 🫁 **Pathology questions** — Pneumothorax, Edema, Pneumonia, Cardiomegaly, Pleural Effusion\n• 📋 **Triage & urgency** — understand severity levels and specialist routing\n\n*Note: I only answer questions related to the 5 conditions this system detects.*",
};

const SUGGESTIONS = [
  "What is pneumothorax?",
  "How is pulmonary edema treated?",
  "What is pleural effusion?",
  "Explain triage urgency levels",
  "Symptoms of pneumonia",
  "What causes cardiomegaly?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot w-2 h-2 rounded-full bg-blue-400" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function renderMarkdown(text: string) {
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

interface Props { onBack: () => void; }

export default function ChatInterface({ onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPatientId, setShowPatientId] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (msg: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { ...msg, id: Math.random().toString(36).slice(2) }]);

  const acceptFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowPatientId(true);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setShowPatientId(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Send a text question to the chatbot
  const sendChat = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    setInput("");

    addMsg({ role: "user", type: "text", content: question });
    const typingId = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id: typingId, role: "ai", type: "typing" }]);
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
      const reply = data.reply || "Sorry, I couldn't get a response.";

      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        { id: Math.random().toString(36).slice(2), role: "ai", type: "text", content: reply },
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      addMsg({ role: "ai", type: "text", content: "⚠️ Couldn't reach the server. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  }, [loading, history]);

  // Send an X-ray for analysis
  const analyzeXray = useCallback(async () => {
    if (!file || loading) return;

    addMsg({ role: "user", type: "image", imageUrl: preview!, content: file.name });
    addMsg({ role: "ai", type: "text", content: "🔬 Got it! Analyzing your X-ray with our **4-model ensemble** (DenseNet-121, EfficientNet-B0/B3, ResNet-50)..." });
    setFile(null);
    setPreview(null);
    setShowPatientId(false);

    const typingId = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id: typingId, role: "ai", type: "typing" }]);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId.trim());

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/analyze`, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Error ${res.status}`);
      const result: TriageResult = await res.json();

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        { id: Math.random().toString(36).slice(2), role: "ai", type: "results", results: result },
      ]);

      setTimeout(() => {
        addMsg({
          role: "ai",
          type: "text",
          content: `Analysis complete! Urgency: **${result.urgency}** · Refer to **${result.specialist}**.\n\nDo you have any questions about the findings? I'm here to help explain anything.`,
        });
      }, 500);
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      addMsg({ role: "ai", type: "text", content: `⚠️ **Analysis failed:** ${e instanceof Error ? e.message : "Unknown error"}` });
    } finally {
      setLoading(false);
      setPatientId("");
    }
  }, [file, loading, preview, patientId]);

  const handleSend = () => {
    if (file) analyzeXray();
    else if (input.trim()) sendChat(input.trim());
  };

  return (
    <div className="h-screen flex flex-col bg-[#080c14]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0a0f1a]/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">MediScan AI</div>
          <div className="text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            Online · Medical assistant + X-ray analysis
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={clsx("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Activity size={13} className="text-white" />
                </div>
              )}

              <div className={clsx("max-w-2xl", msg.role === "user" && "flex justify-end w-full")}>
                {msg.type === "typing" && (
                  <div className="chat-ai rounded-2xl rounded-tl-sm inline-block">
                    <TypingIndicator />
                  </div>
                )}
                {msg.type === "text" && (
                  <div className={clsx(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "ai" ? "chat-ai rounded-tl-sm text-slate-300 max-w-2xl" : "chat-user rounded-tr-sm text-white"
                  )}>
                    {renderMarkdown(msg.content!)}
                  </div>
                )}
                {msg.type === "image" && (
                  <div className="rounded-2xl rounded-tr-sm overflow-hidden max-w-[220px] border border-blue-500/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.imageUrl} alt="X-ray" className="w-full object-cover" />
                    <div className="px-3 py-1.5 bg-[#1e40af]/30 text-xs text-blue-200 font-mono truncate">{msg.content}</div>
                  </div>
                )}
                {msg.type === "results" && msg.results && (
                  <ResultsCard result={msg.results} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggestion chips — show only at start */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 pl-11"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendChat(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/5 bg-[#0a0f1a] p-4 space-y-2">
        {/* File preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{file?.name}</p>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Patient ID (optional)"
                  className="text-xs bg-transparent text-slate-400 placeholder-slate-600 outline-none mt-0.5 w-full font-mono"
                />
              </div>
              <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-2xl border transition-colors",
            "border-white/10 bg-[#0f172a] focus-within:border-blue-500/40"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
        >
          {/* Attach */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Upload X-ray"
            className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
          >
            <Paperclip size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />

          {/* Text input */}
          <input
            ref={textRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={file ? "Press send to analyze X-ray..." : "Ask about pneumothorax, edema, pneumonia, triage levels..."}
            disabled={!!file}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !file) || loading}
            className={clsx(
              "p-2.5 rounded-xl flex-shrink-0 transition-all",
              (input.trim() || file) && !loading
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            )}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} />}
          </button>
        </div>

        <p className="text-center text-xs text-slate-700">
          📎 Attach X-ray for analysis · ✍️ Type any medical question · For research use only
        </p>
      </div>
    </div>
  );
}

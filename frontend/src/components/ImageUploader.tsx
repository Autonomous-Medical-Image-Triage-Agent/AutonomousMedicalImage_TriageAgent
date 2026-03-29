// MediScan AI — Image uploader
"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, ImageIcon, X, AlertCircle, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  onAnalyze: (file: File, patientId: string) => void;
  loading: boolean;
  error: string | null;
}

export default function ImageUploader({ onAnalyze, loading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) accept(f);
  }, []);

  const clear = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (file) onAnalyze(file, patientId);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl font-bold text-slate-100">
          Autonomous X-Ray Triage
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Upload a chest X-ray image. Our 4-model ensemble analyzes 5 pathologies
          and routes to the appropriate specialist in seconds.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={clsx(
          "drop-zone rounded-xl cursor-pointer transition-all",
          dragging && "drag-over"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }}
        />

        {preview ? (
          <div className="relative group rounded-xl overflow-hidden bg-[#1a1d27]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="X-ray preview"
              className="w-full max-h-72 object-contain"
            />
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-[#0f1117]/80 hover:bg-red-500/20 border border-[#2a2d3a] text-slate-400 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1117]/90 to-transparent p-3">
              <p className="text-xs text-slate-300 font-mono truncate">{file?.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 hover:text-slate-400 transition-colors">
            <div className="p-4 rounded-full bg-[#1a1d27] border border-[#2a2d3a]">
              <ImageIcon size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                Drop chest X-ray here
              </p>
              <p className="text-xs mt-1">or click to browse &bull; PNG, JPG, DICOM</p>
            </div>
          </div>
        )}
      </div>

      {/* Patient ID */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Patient ID <span className="text-slate-600">(optional)</span>
        </label>
        <input
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="Auto-generated if left blank"
          className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors font-mono"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!file || loading}
        className={clsx(
          "w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all",
          file && !loading
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            : "bg-[#1a1d27] text-slate-500 cursor-not-allowed border border-[#2a2d3a]"
        )}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analyzing X-Ray...
          </>
        ) : (
          <>
            <Upload size={16} />
            Analyze X-Ray
          </>
        )}
      </button>

      {/* Model info pills */}
      <div className="flex flex-wrap gap-2 justify-center pt-1">
        {["DenseNet-121", "EfficientNet-B0", "EfficientNet-B3", "ResNet-50"].map((m) => (
          <span
            key={m}
            className="text-xs px-2.5 py-1 rounded-full bg-[#1a1d27] border border-[#2a2d3a] text-slate-500 font-mono"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

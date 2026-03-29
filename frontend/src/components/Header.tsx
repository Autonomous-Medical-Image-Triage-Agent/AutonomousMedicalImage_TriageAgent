// MediScan AI — Header component
import { Activity } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-[#2a2d3a] bg-[#1a1d27]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Activity size={20} />
          <span className="font-semibold text-slate-100 text-sm tracking-wide">
            Medical Triage Agent
          </span>
        </div>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          Chest X-Ray &bull; 5-Pathology Ensemble
        </span>
      </div>
    </header>
  );
}

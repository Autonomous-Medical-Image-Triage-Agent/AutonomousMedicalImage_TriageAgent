// MediScan AI — Type definitions
export type Urgency = "CRITICAL" | "URGENT" | "MODERATE" | "ROUTINE";

export interface TriageResult {
  patient_id: string;
  timestamp: string;
  predictions: Record<string, number>;
  individual_predictions: Record<string, number[]>;
  positive_findings: string[];
  urgency: Urgency;
  urgency_reason: string;
  specialist: string;
  routing_reason: string;
  evidence: string;
  alerts: string[];
  report: string;
}

export const URGENCY_CONFIG: Record<
  Urgency,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  CRITICAL: {
    label: "CRITICAL",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    icon: "🔴",
  },
  URGENT: {
    label: "URGENT",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    icon: "🟠",
  },
  MODERATE: {
    label: "MODERATE",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    icon: "🟡",
  },
  ROUTINE: {
    label: "ROUTINE",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    icon: "🟢",
  },
};

export const PATHOLOGY_COLORS: Record<string, string> = {
  Cardiomegaly: "#3b82f6",
  Pneumonia: "#f97316",
  Pneumothorax: "#ef4444",
  Edema: "#8b5cf6",
  "Pleural Effusion": "#06b6d4",
};

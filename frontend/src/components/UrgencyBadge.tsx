import clsx from "clsx";
import type { Urgency } from "@/lib/types";
import { URGENCY_CONFIG } from "@/lib/types";

interface Props {
  urgency: Urgency;
  pulse?: boolean;
  size?: "sm" | "lg";
}

export default function UrgencyBadge({ urgency, pulse = false, size = "sm" }: Props) {
  const cfg = URGENCY_CONFIG[urgency];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-bold rounded-full border",
        cfg.bg,
        cfg.border,
        cfg.color,
        size === "lg" ? "text-sm px-4 py-1.5" : "text-xs px-3 py-1",
        pulse && urgency === "CRITICAL" && "urgency-pulse"
      )}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

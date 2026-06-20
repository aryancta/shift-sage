"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "running" | "down" | "degraded";
  pulse?: boolean;
}

const styles = {
  running: "bg-emerald-100 text-emerald-800 border-emerald-200",
  down: "bg-red-100 text-red-800 border-red-200",
  degraded: "bg-amber-100 text-amber-800 border-amber-200",
};

const labels = {
  running: "Running",
  down: "DOWN",
  degraded: "Degraded",
};

export function StatusBadge({ status, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        styles[status]
      )}
    >
      {pulse && status === "down" && (
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-red-500" />
      )}
      {labels[status]}
    </span>
  );
}

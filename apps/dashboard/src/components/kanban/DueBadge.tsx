"use client";

import { AlertCircle, CalendarClock, CheckCircle2 } from "lucide-react";

import { getUrgency, formatDueDate } from "@/lib/due-date";

interface Props {
  dueDate: string | null;
}

const urgencyConfig = {
  none: {
    label: "Tanpa deadline",
    className: "bg-slate-100 text-slate-500",
    icon: CalendarClock,
  },

  onTrack: {
    label: "Aman",
    className: "bg-emerald-50 text-emerald-600",
    icon: CheckCircle2,
  },

  dueSoon: {
    label: "Segera",
    className: "bg-amber-50 text-amber-600",
    icon: CalendarClock,
  },

  overdue: {
    label: "Terlambat",
    className: "bg-red-50 text-red-600",
    icon: AlertCircle,
  },
} as const;

export function DueBadge({ dueDate }: Props) {
  const urgency = getUrgency(dueDate);

  const config = urgencyConfig[urgency];

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${config.className}`} title={dueDate ? formatDueDate(dueDate) : undefined}>
      <Icon className="h-3.5 w-3.5" />

      <span>{dueDate ? formatDueDate(dueDate) : config.label}</span>
    </div>
  );
}

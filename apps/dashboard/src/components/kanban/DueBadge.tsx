"use client";

import { AlertCircle, CalendarClock, CheckCircle2 } from "lucide-react";

import { getUrgency, formatDueDate } from "@/lib/due-date";

interface Props {
  dueDate: string | null;
}

const urgencyConfig = {
  none: {
    label: "Tanpa deadline",
    className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
    icon: CalendarClock,
  },

  onTrack: {
    label: "Aman",
    className: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60",
    icon: CheckCircle2,
  },

  dueSoon: {
    label: "Segera",
    className: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60",
    icon: CalendarClock,
  },

  overdue: {
    label: "Terlambat",
    className: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-bold",
    icon: AlertCircle,
  },
} as const;

export function DueBadge({ dueDate }: Props) {
  const urgency = getUrgency(dueDate);

  const config = urgencyConfig[urgency];

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors shadow-2xs ${config.className}`}
      title={dueDate ? formatDueDate(dueDate) : undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />

      <span>{dueDate ? formatDueDate(dueDate) : config.label}</span>
    </div>
  );
}

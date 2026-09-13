import type { TaskStatus, Task } from "@/types";

export const KANBAN_COLUMNS: readonly TaskStatus[] = ["TODO", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

export const KANBAN_META: Record<
  TaskStatus,
  {
    label: string;
    badge: string;
    border: string;
    dropBg: string;
    activeBorder: string;
    activeRing: string;
    glow: string;
  }
> = {
  TODO: {
    label: "Belum Dimulai",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60",
    border: "border-slate-200/80 dark:border-slate-800",
    dropBg: "bg-slate-100/50 dark:bg-slate-800/30",
    activeBorder: "border-slate-400 dark:border-slate-600",
    activeRing: "ring-slate-300 dark:ring-slate-700",
    glow: "shadow-slate-200/50 dark:shadow-slate-900/50",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50",
    border: "border-blue-100/80 dark:border-blue-900/40",
    dropBg: "bg-blue-50/50 dark:bg-blue-950/20",
    activeBorder: "border-blue-400 dark:border-blue-600",
    activeRing: "ring-blue-200 dark:ring-blue-800",
    glow: "shadow-blue-200/50 dark:shadow-blue-950/50",
  },
  NEED_REVIEW: {
    label: "Perlu Review",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50",
    border: "border-amber-100/80 dark:border-amber-900/40",
    dropBg: "bg-amber-50/50 dark:bg-amber-950/20",
    activeBorder: "border-amber-400 dark:border-amber-600",
    activeRing: "ring-amber-200 dark:ring-amber-800",
    glow: "shadow-amber-200/50 dark:shadow-amber-950/50",
  },
  DONE: {
    label: "Selesai",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50",
    border: "border-emerald-100/80 dark:border-emerald-900/40",
    dropBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    activeBorder: "border-emerald-400 dark:border-emerald-600",
    activeRing: "ring-emerald-200 dark:ring-emerald-800",
    glow: "shadow-emerald-200/50 dark:shadow-emerald-950/50",
  },
};

export type KanbanTask = Task;

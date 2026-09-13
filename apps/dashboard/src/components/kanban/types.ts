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
    badge: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
    dropBg: "bg-slate-100/50",
    activeBorder: "border-slate-400",
    activeRing: "ring-slate-300",
    glow: "shadow-slate-200/50",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    badge: "bg-blue-50 text-blue-700",
    border: "border-blue-100",
    dropBg: "bg-blue-50/50",
    activeBorder: "border-blue-400",
    activeRing: "ring-blue-200",
    glow: "shadow-blue-200/50",
  },
  NEED_REVIEW: {
    label: "Perlu Review",
    badge: "bg-amber-50 text-amber-700",
    border: "border-amber-100",
    dropBg: "bg-amber-50/50",
    activeBorder: "border-amber-400",
    activeRing: "ring-amber-200",
    glow: "shadow-amber-200/50",
  },
  DONE: {
    label: "Selesai",
    badge: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
    dropBg: "bg-emerald-50/50",
    activeBorder: "border-emerald-400",
    activeRing: "ring-emerald-200",
    glow: "shadow-emerald-200/50",
  },
};

export type KanbanTask = Task;

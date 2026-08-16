import type { TaskStatus, Task } from "@/types";

export const KANBAN_COLUMNS: readonly TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "NEED_REVIEW",
  "DONE",
];

export const KANBAN_META: Record<
  TaskStatus,
  {
    label: string;
    badge: string;
    border: string;
  }
> = {
  TODO: {
    label: "Belum Dimulai",
    badge: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    badge: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  NEED_REVIEW: {
    label: "Perlu Review",
    badge: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  DONE: {
    label: "Selesai",
    badge: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
};

export type KanbanTask = Task;

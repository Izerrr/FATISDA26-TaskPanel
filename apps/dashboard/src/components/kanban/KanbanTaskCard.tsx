"use client";

import { CalendarClock, CheckCircle2, Clock3, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Task, TaskStatus } from "@/types";
import { formatDueDate, getUrgency } from "@/lib/due-date";

interface KanbanTaskCardProps {
  task: Task;
  index?: number;
  isDragging?: boolean;
  isJustMoved?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const statusLabel: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  NEED_REVIEW: "Need Review",
  DONE: "Done",
};

const statusIcon: Record<TaskStatus, typeof Clock3> = {
  TODO: Clock3,
  IN_PROGRESS: Clock3,
  NEED_REVIEW: CalendarClock,
  DONE: CheckCircle2,
};

export function KanbanTaskCard({ task, index, isDragging = false, isJustMoved = false, onEdit, onDelete }: KanbanTaskCardProps) {
  const StatusIcon = statusIcon[task.status];
  const urgency = getUrgency(task.dueDate);

  return (
    <article
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
        isDragging
          ? "border-liquid-accent/40 bg-white/95 shadow-2xl ring-2 ring-liquid-accent/30 backdrop-blur-md"
          : isJustMoved
            ? "border-emerald-300 bg-emerald-50/20 ring-2 ring-emerald-400/80 shadow-md"
            : "border-slate-200/90 bg-white shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-liquid-text leading-snug">{task.title}</h3>

            {task.course && (
              <p className="mt-1 truncate text-xs text-liquid-text-secondary">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <details className="group/menu">
              <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </summary>

              <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(task)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}

                {onDelete && (
                  <button type="button" onClick={() => onDelete(task)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {task.description && <p className="mt-2.5 pl-6 line-clamp-3 text-xs leading-5 text-liquid-text-secondary">{task.description}</p>}

      <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-6">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          <StatusIcon className="h-3 w-3" />
          {statusLabel[task.status]}
        </span>

        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${task.scope === "CLASS" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>{task.scope === "CLASS" ? "Kelas" : "Personal"}</span>

        {task.dueDate && (
          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${urgency === "overdue" ? "bg-red-50 text-red-600" : urgency === "dueSoon" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </article>
  );
}

export type { KanbanTaskCardProps };

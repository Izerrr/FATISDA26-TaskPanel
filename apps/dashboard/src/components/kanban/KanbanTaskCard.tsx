"use client";

import { ArrowRight, CalendarClock, CheckCircle2, Clock3, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Task, TaskStatus } from "@/types";
import { formatDueDate, getUrgency } from "@/lib/due-date";
import { KANBAN_COLUMNS, KANBAN_META } from "./types";

interface KanbanTaskCardProps {
  task: Task;
  index?: number;
  isDragging?: boolean;
  isJustMoved?: boolean;
  isGhost?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMoveStatus?: (task: Task, newStatus: TaskStatus) => void;
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

export function KanbanTaskCard({ task, index, isDragging = false, isJustMoved = false, isGhost = false, onEdit, onDelete, onMoveStatus }: KanbanTaskCardProps) {
  const StatusIcon = statusIcon[task.status];
  const urgency = getUrgency(task.dueDate);

  if (isGhost) {
    return (
      <article className="relative rounded-2xl border-2 border-dashed border-liquid-accent/40 bg-slate-100/50 p-4 opacity-45 shadow-inner select-none pointer-events-none">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-slate-500 leading-snug">{task.title}</h3>
            {task.course && (
              <p className="mt-1 truncate text-xs text-slate-400">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Sedang digeser...</span>
        </div>
      </article>
    );
  }

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

        {(onEdit || onDelete || onMoveStatus) && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <details className="group/menu">
              <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </summary>

              <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
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

                {onMoveStatus && (
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pindahkan Ke:</span>
                    {KANBAN_COLUMNS.filter((s) => s !== task.status).map((targetStatus) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => onMoveStatus(task, targetStatus)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-liquid-accent transition-colors"
                      >
                        <span>{KANBAN_META[targetStatus].label}</span>
                        <ArrowRight className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
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

      {/* Mobile-Friendly Quick Move Bar (1-tap transition on phone) */}
      {onMoveStatus && (
        <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-100/90 pt-2.5 pl-6 md:hidden" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-slate-400">Pindah:</span>
          <div className="flex items-center gap-1">
            {task.status === "TODO" && (
              <button type="button" onClick={() => onMoveStatus(task, "IN_PROGRESS")} className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 transition active:scale-95">
                <span>Kerjakan</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}

            {task.status === "IN_PROGRESS" && (
              <>
                <button type="button" onClick={() => onMoveStatus(task, "NEED_REVIEW")} className="flex items-center gap-1 rounded-lg bg-purple-500/15 px-2 py-1 text-[11px] font-bold text-purple-700 transition active:scale-95">
                  <span>Review</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => onMoveStatus(task, "DONE")} className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-700 transition active:scale-95">
                  <span>Selesai ✓</span>
                </button>
              </>
            )}

            {task.status === "NEED_REVIEW" && (
              <button type="button" onClick={() => onMoveStatus(task, "DONE")} className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition active:scale-95">
                <span>Selesai ✓</span>
              </button>
            )}

            {task.status === "DONE" && (
              <button type="button" onClick={() => onMoveStatus(task, "TODO")} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition active:scale-95">
                <span>↺ Buka Lagi</span>
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export type { KanbanTaskCardProps };

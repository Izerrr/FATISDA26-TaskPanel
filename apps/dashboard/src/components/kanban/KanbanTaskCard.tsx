"use client";

import { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const StatusIcon = statusIcon[task.status];
  const urgency = getUrgency(task.dueDate);

  useEffect(() => {
    if (!menuOpen) return;

    function handleGlobalPointerDown(event: MouseEvent | TouchEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleGlobalPointerDown, true);
    window.addEventListener("touchstart", handleGlobalPointerDown, true);
    window.addEventListener("keydown", handleGlobalKeyDown, true);

    return () => {
      window.removeEventListener("mousedown", handleGlobalPointerDown, true);
      window.removeEventListener("touchstart", handleGlobalPointerDown, true);
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [menuOpen]);

  if (isGhost) {
    return (
      <article className="relative rounded-2xl border-2 border-dashed border-liquid-accent/40 dark:border-sky-500/40 bg-slate-100/50 dark:bg-slate-800/40 p-4 opacity-45 shadow-inner select-none pointer-events-none">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-slate-500 dark:text-slate-400 leading-snug">{task.title}</h3>
            {task.course && (
              <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sedang digeser...</span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${menuOpen ? "z-40" : ""} ${
        isDragging
          ? "border-liquid-accent/40 dark:border-sky-500/40 bg-white/95 dark:bg-slate-900/95 shadow-2xl ring-2 ring-liquid-accent/30 dark:ring-sky-500/30 backdrop-blur-md"
          : isJustMoved
            ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-400/80 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{task.title}</h3>

            {task.course && (
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete || onMoveStatus) && (
          <div ref={menuContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
              aria-label="Menu Opsi Tugas"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                )}

                {onMoveStatus && (
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pindahkan Ke:</span>
                    {KANBAN_COLUMNS.filter((s) => s !== task.status).map((targetStatus) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveStatus(task, targetStatus);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-liquid-accent dark:hover:text-sky-400 transition-colors"
                      >
                        <span>{KANBAN_META[targetStatus].label}</span>
                        <ArrowRight className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {task.description && <p className="mt-2.5 pl-6 line-clamp-3 text-xs leading-5 text-liquid-text-secondary dark:text-slate-400">{task.description}</p>}

      <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-6">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
          <StatusIcon className="h-3 w-3" />
          {statusLabel[task.status]}
        </span>

        <span
          className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${task.scope === "CLASS" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300" : "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"}`}
        >
          {task.scope === "CLASS" ? "Kelas" : "Personal"}
        </span>

        {task.dueDate && (
          <span
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${urgency === "overdue" ? "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300" : urgency === "dueSoon" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
          >
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Mobile-Friendly Quick Move Bar (1-tap transition on phone) */}
      {onMoveStatus && (
        <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-100/90 dark:border-slate-800 pt-2.5 pl-6 md:hidden" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Pindah:</span>
          <div className="flex items-center gap-1">
            {task.status === "TODO" && (
              <button
                type="button"
                onClick={() => onMoveStatus(task, "IN_PROGRESS")}
                className="flex items-center gap-1 rounded-lg bg-amber-500/15 dark:bg-amber-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 transition active:scale-95"
              >
                <span>Kerjakan</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}

            {task.status === "IN_PROGRESS" && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveStatus(task, "NEED_REVIEW")}
                  className="flex items-center gap-1 rounded-lg bg-purple-500/15 dark:bg-purple-950/60 px-2 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 transition active:scale-95"
                >
                  <span>Review</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveStatus(task, "DONE")}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/15 dark:bg-emerald-950/60 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 transition active:scale-95"
                >
                  <span>Selesai ✓</span>
                </button>
              </>
            )}

            {task.status === "NEED_REVIEW" && (
              <button
                type="button"
                onClick={() => onMoveStatus(task, "DONE")}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/15 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 transition active:scale-95"
              >
                <span>Selesai ✓</span>
              </button>
            )}

            {task.status === "DONE" && (
              <button
                type="button"
                onClick={() => onMoveStatus(task, "TODO")}
                className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition active:scale-95"
              >
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

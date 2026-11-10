"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { LayoutGrid, List, Sparkles, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { KANBAN_COLUMNS, KANBAN_META } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskListView } from "./TaskListView";

interface Props {
  tasks: Task[];
  isLoading?: boolean;
  onMutated?: () => void;
}

export function KanbanBoard({ tasks, isLoading = false, onMutated }: Props) {
  const { courses } = useCourses();
  const { roles, user } = useRole();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [items, setItems] = useState<Task[]>(tasks);
  const [isDragging, setIsDragging] = useState(false);
  const [justMovedTaskId, setJustMovedTaskId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>("TODO");
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(false);
  const [celebrationTaskTitle, setCelebrationTaskTitle] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const searchParams = useSearchParams();
  const paramTaskId = searchParams.get("taskId");

  useEffect(() => {
    if (paramTaskId && tasks.length > 0) {
      const target = tasks.find((t) => t.id === paramTaskId);
      if (target) {
        setDetailTask(target);
      }
    }
  }, [paramTaskId, tasks]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fatisda_task_view");
      if (saved === "list" || saved === "kanban") {
        setViewMode(saved);
      }
      const savedDoneCollapse = localStorage.getItem("fatisda_kanban_done_collapsed");
      if (savedDoneCollapse === "true") {
        setIsDoneCollapsed(true);
      }
    } catch {}

    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(min-width: 768px)");
      setIsDesktop(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const toggleDoneCollapsed = () => {
    setIsDoneCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fatisda_kanban_done_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  function triggerDoneCelebration(title: string) {
    setCelebrationTaskTitle(title);
    setTimeout(() => {
      setCelebrationTaskTitle((curr) => (curr === title ? null : curr));
    }, 1800);
  }

  const handleToggleView = (mode: "kanban" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("fatisda_task_view", mode);
    } catch {}
  };

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  function handleDragStart() {
    setIsDragging(true);
  }

  async function handleMoveTask(task: Task, newStatus: TaskStatus) {
    if (task.status === newStatus) return;

    if (newStatus === "DONE") {
      triggerDoneCelebration(task.title);
    }
    setJustMovedTaskId(task.id);
    setTimeout(() => {
      setJustMovedTaskId((curr) => (curr === task.id ? null : curr));
    }, 1500);

    const previous = items;
    setItems((current) => current.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui status tugas.");
      }

      const data = await response.json();
      if (data.task) {
        setItems((current) => current.map((t) => (t.id === task.id ? data.task : t)));
      }

      onMutated?.();
    } catch (error) {
      console.error("[Kanban] update status error", error);
      setItems(previous);
    }
  }

  const canManageClassTasks = roles.some((role) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(String(role)));

  function canModifyTask(task: Task): boolean {
    if (!user) return false;
    if (task.createdById === user.id) return true;
    if (task.scope === "CLASS" && canManageClassTasks) return true;
    return false;
  }

  async function handleConfirmDelete(task: Task) {
    const previous = items;
    setItems((curr) => curr.filter((t) => t.id !== task.id));

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menghapus tugas.");
      }

      onMutated?.();
    } catch (err) {
      console.error("[Kanban] delete error", err);
      setItems(previous);
      throw err;
    }
  }

  async function handleDragEnd(result: DropResult) {
    setIsDragging(false);

    if (!result.destination) return;

    const taskId = result.draggableId;
    const destinationStatus = result.destination.droppableId as TaskStatus;
    const sourceStatus = result.source.droppableId as TaskStatus;

    if (!KANBAN_COLUMNS.includes(destinationStatus)) {
      return;
    }

    if (destinationStatus !== sourceStatus) {
      if (destinationStatus === "DONE") {
        const movedTask = items.find((t) => t.id === taskId);
        if (movedTask) triggerDoneCelebration(movedTask.title);
      }
      setJustMovedTaskId(taskId);
      setTimeout(() => {
        setJustMovedTaskId((curr) => (curr === taskId ? null : curr));
      }, 1500);
    }

    const previous = items;

    setItems((current) => current.map((task) => (task.id === taskId ? { ...task, status: destinationStatus } : task)));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: destinationStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui status tugas.");
      }

      const data = await response.json();

      if (data.task) {
        setItems((current) => current.map((task) => (task.id === taskId ? data.task : task)));
      }

      onMutated?.();
    } catch (error) {
      console.error("[Kanban] update status", error);
      setItems(previous);
    }
  }



  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle: Kanban vs List */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleView("kanban")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Papan Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleView("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Daftar / Tabel</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "kanban" && (
            <button
              type="button"
              onClick={toggleDoneCollapsed}
              className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
            >
              {isDoneCollapsed ? <PanelRightOpen className="h-3.5 w-3.5 text-emerald-500" /> : <PanelRightClose className="h-3.5 w-3.5 text-slate-400" />}
              <span>{isDoneCollapsed ? "Buka Kolom Selesai" : "Lipat Kolom Selesai"}</span>
            </button>
          )}
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
            Tampilan: {viewMode === "kanban" ? "Papan 5 Kolom" : "Daftar Terurut"}
          </div>
        </div>
      </div>

      {/* Zero-RAM Celebration Pop Banner when a task moves to DONE */}
      {celebrationTaskTitle && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/80 dark:border-emerald-700/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/70 dark:via-teal-950/60 dark:to-emerald-950/70 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">Mantap! Tugas &ldquo;{celebrationTaskTitle}&rdquo; selesai dikerjakan! 🎉</span>
        </div>
      )}

      {viewMode === "list" ? (
        <TaskListView
          tasks={items}
          onSelect={(task) => setDetailTask(task)}
          onMoveStatus={handleMoveTask}
          onEdit={(task) => (canModifyTask(task) ? setEditingTask(task) : undefined)}
          onDelete={(task) => (canModifyTask(task) ? setDeletingTask(task) : undefined)}
          justMovedTaskId={justMovedTaskId}
        />
      ) : (
        <>
          {/* Mobile Status Switcher Tabs (Segmented 5-Column Bar on < md) */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 md:hidden shadow-2xs">
            {KANBAN_COLUMNS.map((status) => {
              const meta = KANBAN_META[status];
              const count = items.filter((task) => task.status === status).length;
              const isActive = activeMobileTab === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveMobileTab(status)}
                  className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all cursor-pointer min-w-0 ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-liquid-accent dark:text-sky-400 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full px-0.5">{meta.shortLabel}</span>
                  <span
                    className={`mt-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] sm:text-[10px] font-bold ${
                      isActive
                        ? "bg-liquid-accent/15 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300"
                        : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Active Column View (Fluid 100% width, zero horizontal snap lag) */}
          <div className="md:hidden">
            <KanbanColumn
              status={activeMobileTab}
              tasks={items.filter((task) => task.status === activeMobileTab)}
              isDraggingAny={false}
              justMovedTaskId={justMovedTaskId}
              isMobileSingleView={true}
              onSelect={(task) => setDetailTask(task)}
              onMoveStatus={handleMoveTask}
              onEdit={(task) => (canModifyTask(task) ? setEditingTask(task) : undefined)}
              onDelete={(task) => (canModifyTask(task) ? setDeletingTask(task) : undefined)}
            />
          </div>

          {/* Desktop Multi-Column Kanban Board (>= md) */}
          {isDesktop && (
            <div className="hidden md:block">
              <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:flex xl:items-stretch gap-3.5">
                  {KANBAN_COLUMNS.map((status) => {
                    const isDone = status === "DONE";
                    const collapsed = isDone && isDoneCollapsed;
                    return (
                      <div
                        key={status}
                        className={
                          collapsed
                            ? "min-w-0 xl:w-16 xl:shrink-0 transition-all duration-200"
                            : "min-w-0 xl:flex-1 transition-all duration-200"
                        }
                      >
                        <KanbanColumn
                          status={status}
                          tasks={items.filter((task) => task.status === status)}
                          isDraggingAny={isDragging}
                          justMovedTaskId={justMovedTaskId}
                          isCollapsed={collapsed}
                          onToggleCollapse={isDone ? toggleDoneCollapsed : undefined}
                          onSelect={(task) => setDetailTask(task)}
                          onMoveStatus={handleMoveTask}
                          onEdit={(task) => (canModifyTask(task) ? setEditingTask(task) : undefined)}
                          onDelete={(task) => (canModifyTask(task) ? setDeletingTask(task) : undefined)}
                        />
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>
          )}
        </>
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          courses={courses}
          roles={roles}
          userId={user?.id}
          onClose={() => setDetailTask(null)}
          onEdit={(task) => {
            setDetailTask(null);
            setEditingTask(task);
          }}
          onDelete={(task) => {
            setDetailTask(null);
            setDeletingTask(task);
          }}
          onStatusChange={async (task, newStatus) => {
            await handleMoveTask(task, newStatus);
            setDetailTask((prev) => (prev ? { ...prev, status: newStatus } : null));
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          open={!!editingTask}
          task={editingTask}
          courses={courses}
          roles={roles}
          onClose={() => setEditingTask(null)}
          onUpdated={() => {
            setEditingTask(null);
            onMutated?.();
          }}
        />
      )}

      {deletingTask && <DeleteTaskModal open={!!deletingTask} task={deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleConfirmDelete} />}
    </div>
  );
}

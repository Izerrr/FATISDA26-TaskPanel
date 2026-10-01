"use client";

import { useEffect, useRef, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { LayoutGrid, List } from "lucide-react";
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
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fatisda_task_view");
      if (saved === "list" || saved === "kanban") {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleToggleView = (mode: "kanban" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("fatisda_task_view", mode);
    } catch {}
  };

  const columnRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const scrollLeft = container.scrollLeft;
        const width = container.offsetWidth;
        const center = scrollLeft + width / 2;

        for (const status of KANBAN_COLUMNS) {
          const el = columnRefs.current[status];
          if (el) {
            const left = el.offsetLeft;
            const right = left + el.offsetWidth;
            if (center >= left && center <= right) {
              setActiveMobileTab(status);
              break;
            }
          }
        }
      }, 60);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  function handleDragStart() {
    setIsDragging(true);
  }

  async function handleMoveTask(task: Task, newStatus: TaskStatus) {
    if (task.status === newStatus) return;

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

  function scrollToColumn(status: TaskStatus) {
    setActiveMobileTab(status);
    const element = columnRefs.current[status];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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

        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Tampilan: {viewMode === "kanban" ? "Papan 4 Kolom" : "Daftar Terurut"}
        </div>
      </div>

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
          {/* Mobile Status Switcher Tabs (< md) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar md:hidden">
            {KANBAN_COLUMNS.map((status) => {
              const meta = KANBAN_META[status];
              const count = items.filter((task) => task.status === status).length;
              const isActive = activeMobileTab === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => scrollToColumn(status)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive ? "bg-liquid-accent text-white shadow-sm scale-[1.02]" : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Unified Responsive Kanban Layout (No duplicate droppables!) */}
            <div ref={scrollContainerRef} className={`flex overflow-x-auto gap-4 pb-4 no-scrollbar md:grid md:grid-cols-4 md:min-w-[960px] md:overflow-visible ${isDragging ? "snap-none" : "snap-x snap-mandatory"}`}>
              {KANBAN_COLUMNS.map((status) => (
                <div
                  key={status}
                  ref={(el) => {
                    columnRefs.current[status] = el;
                  }}
                  className={`w-[85vw] max-w-[360px] shrink-0 md:w-auto md:max-w-none md:shrink md:snap-align-none ${isDragging ? "snap-align-none" : "snap-center"}`}
                >
                  <KanbanColumn
                    status={status}
                    tasks={items.filter((task) => task.status === status)}
                    isDraggingAny={isDragging}
                    justMovedTaskId={justMovedTaskId}
                    onSelect={(task) => setDetailTask(task)}
                    onMoveStatus={handleMoveTask}
                    onEdit={(task) => (canModifyTask(task) ? setEditingTask(task) : undefined)}
                    onDelete={(task) => (canModifyTask(task) ? setDeletingTask(task) : undefined)}
                  />
                </div>
              ))}
            </div>
          </DragDropContext>
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

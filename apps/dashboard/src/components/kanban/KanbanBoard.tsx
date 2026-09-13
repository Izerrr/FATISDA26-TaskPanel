"use client";

import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { KANBAN_COLUMNS, KANBAN_META } from "./types";
import { KanbanColumn } from "./KanbanColumn";

interface Props {
  tasks: Task[];
  isLoading?: boolean;
  onMutated?: () => void;
}

export function KanbanBoard({ tasks, isLoading = false, onMutated }: Props) {
  const [items, setItems] = useState<Task[]>(tasks);
  const [isDragging, setIsDragging] = useState(false);
  const [justMovedTaskId, setJustMovedTaskId] = useState<string | null>(null);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  function handleDragStart() {
    setIsDragging(true);
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

  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>("TODO");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white p-4 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Status Switcher Tabs (< md) */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
        {KANBAN_COLUMNS.map((status) => {
          const meta = KANBAN_META[status];
          const count = items.filter((task) => task.status === status).length;
          const isActive = activeMobileTab === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveMobileTab(status)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${isActive ? "bg-liquid-accent text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              <span>{meta.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Mobile View: Render only active tab */}
        <div className="block md:hidden">
          <KanbanColumn status={activeMobileTab} tasks={items.filter((task) => task.status === activeMobileTab)} isDraggingAny={isDragging} justMovedTaskId={justMovedTaskId} />
        </div>

        {/* Desktop View: Full 4 columns side-by-side */}
        <div className="hidden overflow-x-auto pb-2 md:block">
          <div className="grid grid-cols-4 gap-4 min-w-[960px]">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} tasks={items.filter((task) => task.status === status)} isDraggingAny={isDragging} justMovedTaskId={justMovedTaskId} />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { KANBAN_COLUMNS } from "./types";
import { KanbanColumn } from "./KanbanColumn";

interface Props {
  tasks: Task[];
  isLoading?: boolean;
  onMutated?: () => void;
}

export function KanbanBoard({
  tasks,
  isLoading = false,
  onMutated,
}: Props) {
  const [items, setItems] = useState<Task[]>(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const destinationStatus =
      result.destination.droppableId as TaskStatus;

    if (!KANBAN_COLUMNS.includes(destinationStatus)) {
      return;
    }

    const previous = items;

    setItems((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: destinationStatus }
          : task
      )
    );

    try {
      const response = await fetch(
        `/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: destinationStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memperbarui status tugas.");
      }

      const data = await response.json();

      if (data.task) {
        setItems((current) =>
          current.map((task) =>
            task.id === taskId
              ? data.task
              : task
          )
        );
      }

      onMutated?.();
    } catch (error) {
      console.error("[Kanban] update status", error);
      setItems(previous);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-liquid-border bg-white">
        <div className="flex items-center gap-2 text-sm text-liquid-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-liquid-accent" />
          Memuat papan tugas...
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[1180px] gap-4">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={items.filter(
                (task) => task.status === status
              )}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}

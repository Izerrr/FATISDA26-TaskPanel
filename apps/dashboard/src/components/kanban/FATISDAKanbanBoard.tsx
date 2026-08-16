"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FATISDAKanbanColumn } from "./FATISDAKanbanColumn";
import { useTasks, Task } from "@/hooks/useTasks";
import { useGuild } from "@/components/providers/GuildProvider";
import { useRole } from "@/hooks/useRole";
import { COLUMNS } from "./types";
import { Loader2, AlertCircle } from "lucide-react";

export function FATISDAKanbanBoard() {
  const { selectedGuild } = useGuild();
  const { tasks, isLoading, isError, mutate } = useTasks(selectedGuild);
  const { isMember } = useRole();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Task["status"];

    // Members can only move their own tasks
    const task = localTasks.find((t) => t.id === draggableId);
    if (!task) return;

    const prevTasks = localTasks;
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === draggableId ? data.task : t))
      );
      mutate();
    } catch {
      setLocalTasks(prevTasks);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-fsd-accent animate-spin" />
        <span className="ml-2 text-sm text-fsd-text-secondary">Memuat tugas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <AlertCircle className="w-5 h-5 text-fsd-alert mr-2" />
        <p className="text-sm text-fsd-alert">Gagal memuat tugas. Coba refresh halaman.</p>
      </div>
    );
  }

  if (!selectedGuild) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-fsd-text-secondary">Pilih server Discord di sidebar untuk mulai.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full min-w-[1024px]">
        {COLUMNS.map((col) => (
          <FATISDAKanbanColumn
            key={col}
            status={col}
            tasks={localTasks.filter((t) => t.status === col)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

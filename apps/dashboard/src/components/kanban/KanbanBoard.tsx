"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { useTasks, Task } from "@/hooks/useTasks";
import { useGuild } from "@/components/providers/GuildProvider";
import { COLUMNS } from "./types";
import { Loader2, AlertCircle } from "lucide-react";

export function KanbanBoard() {
  const { selectedGuild } = useGuild();
  const { tasks, isLoading, isError, mutate } = useTasks(selectedGuild);
  const [items, setItems] = useState<Task[]>([]);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Task["status"];
    const prev = items;

    setItems((it) => it.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)));

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setItems((it) => it.map((t) => (t.id === draggableId ? data.task : t)));
      mutate();
    } catch {
      setItems(prev);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-liquid-accent" />
        <span className="ml-2 text-[13px] text-liquid-text-secondary">Memuat tugas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5 text-liquid-danger" />
        <span className="text-[13px] text-liquid-danger">Gagal memuat tugas. Refresh halaman.</span>
      </div>
    );
  }

  if (!selectedGuild) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[13px] text-liquid-text-secondary">Pilih server di sidebar untuk mulai.</span>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 min-w-[1024px]">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col} status={col} tasks={items.filter((t) => t.status === col)} />
        ))}
      </div>
    </DragDropContext>
  );
}

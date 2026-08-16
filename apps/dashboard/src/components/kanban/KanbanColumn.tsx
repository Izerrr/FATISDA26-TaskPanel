"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "@/types";
import { KANBAN_META } from "./types";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface Props {
  status: TaskStatus;
  tasks: Task[];
}

export function KanbanColumn({ status, tasks }: Props) {
  const meta = KANBAN_META[status];

  return (
    <section className={`flex min-w-[280px] flex-1 flex-col rounded-3xl border bg-white/70 backdrop-blur-xl ${meta.border}`}>
      <header className="flex items-center justify-between px-4 py-3.5">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
        <span className="text-xs font-semibold text-liquid-text-secondary">
          {tasks.length}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[180px] flex-1 space-y-3 rounded-b-3xl p-3 transition ${
              snapshot.isDraggingOver ? "bg-blue-50/40" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                index={index}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}

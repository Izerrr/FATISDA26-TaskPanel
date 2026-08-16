"use client";

import { Droppable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { Task, COLUMN_META } from "./types";

interface Props {
  status: string;
  tasks: Task[];
}

export function KanbanColumn({ status, tasks }: Props) {
  const meta = COLUMN_META[status];

  return (
    <div className={`flex w-72 min-w-[280px] flex-col rounded-3xl border ${meta.border} bg-white/40 backdrop-blur-xl`}>
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
        <span className="text-[13px] font-semibold text-liquid-text">{tasks.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2.5 overflow-y-auto p-3 min-h-[120px] rounded-b-3xl transition-colors ${snapshot.isDraggingOver ? "bg-black/[0.02]" : ""}`}
          >
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

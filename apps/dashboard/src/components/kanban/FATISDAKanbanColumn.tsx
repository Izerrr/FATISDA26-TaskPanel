"use client";

import { Droppable } from "@hello-pangea/dnd";
import { FATISDATaskCard } from "./FATISDATaskCard";
import { Task, COLUMN_LABELS, COLUMN_COLORS } from "./types";

interface Props {
  status: string;
  tasks: Task[];
}

export function FATISDAKanbanColumn({ status, tasks }: Props) {
  const colors = COLUMN_COLORS[status];

  return (
    <div className={`flex flex-col w-72 min-w-[280px] rounded-lg border ${colors.border} bg-fsd-card shadow-card`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-fsd-border-light/20">
        <div className="flex items-center gap-2">
          <span className={`fsd-meta text-[10px] px-2 py-0.5 rounded-sm ${colors.badge}`}>
            {COLUMN_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-semibold text-fsd-text">{tasks.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px]
              ${snapshot.isDraggingOver ? colors.bg : ""}
            `}
          >
            {tasks.map((task, i) => (
              <FATISDATaskCard key={task.id} task={task} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

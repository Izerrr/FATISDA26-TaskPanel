"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "@/types";
import { KANBAN_META } from "./types";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  isDraggingAny?: boolean;
  justMovedTaskId?: string | null;
  onMoveStatus?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, isDraggingAny = false, justMovedTaskId, onMoveStatus, onEdit, onDelete }: Props) {
  const meta = KANBAN_META[status];

  return (
    <section className={`flex min-w-[280px] flex-1 flex-col rounded-3xl border bg-white/80 dark:bg-slate-900/90 shadow-xs transition-all duration-200 ${meta.border}`}>
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100/70 dark:border-slate-800">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${meta.badge}`}>{meta.label}</span>
        <span className="text-xs font-semibold text-liquid-text-secondary dark:text-slate-400">{tasks.length}</span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[220px] flex-1 space-y-3 rounded-b-3xl p-3 transition-all duration-200 ${snapshot.isDraggingOver ? `${meta.dropBg} ring-2 ${meta.activeRing} shadow-inner` : isDraggingAny ? "bg-slate-50/40 dark:bg-slate-800/30" : ""}`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      touchAction: "manipulation",
                    }}
                    className={`cursor-grab active:cursor-grabbing select-none transition-shadow ${
                      dragSnapshot.isDragging ? "z-50 rotate-1 scale-[1.03] shadow-2xl ring-2 ring-liquid-accent/30 dark:ring-sky-500/30 rounded-2xl" : "transition-transform duration-150"
                    }`}
                  >
                    <KanbanTaskCard task={task} index={index} isDragging={dragSnapshot.isDragging} isJustMoved={task.id === justMovedTaskId} onMoveStatus={onMoveStatus} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {tasks.length === 0 && (
              <div
                className={`flex h-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
                  snapshot.isDraggingOver
                    ? "border-liquid-accent dark:border-sky-500 bg-liquid-accent/10 dark:bg-sky-500/15 text-liquid-accent dark:text-sky-400 scale-[1.02] shadow-sm"
                    : isDraggingAny
                      ? "border-slate-300/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400"
                      : "border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500"
                }`}
              >
                {snapshot.isDraggingOver ? (
                  <p className="text-xs font-bold text-liquid-accent dark:text-sky-400">Lepaskan tugas di sini</p>
                ) : isDraggingAny ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pindahkan ke kolom ini</p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada tugas</p>
                )}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}

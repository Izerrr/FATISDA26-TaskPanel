import { useState, useEffect } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { KANBAN_META } from "./types";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  isDraggingAny?: boolean;
  justMovedTaskId?: string | null;
  isMobileSingleView?: boolean;
  onSelect?: (task: Task) => void;
  onMoveStatus?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, isDraggingAny = false, justMovedTaskId, isMobileSingleView = false, onSelect, onMoveStatus, onEdit, onDelete }: Props) {
  const meta = KANBAN_META[status];
  const [isExpanded, setIsExpanded] = useState(status !== "DONE");

  // Jika ada tugas yang baru saja dipindahkan ke kolom ini di luar 5 teratas, otomatis buka agar terlihat
  useEffect(() => {
    if (justMovedTaskId && tasks.some((t, idx) => t.id === justMovedTaskId && idx >= 5)) {
      setIsExpanded(true);
    }
  }, [justMovedTaskId, tasks]);

  const hasExcess = tasks.length > 5;
  const visibleTasks = hasExcess && !isExpanded ? tasks.slice(0, 5) : tasks;

  if (isMobileSingleView) {
    return (
      <section className="w-full min-w-0 flex flex-col space-y-3 pt-1">
        {visibleTasks.map((task, index) => (
          <div key={task.id} className="transition-all duration-200">
            <KanbanTaskCard
              task={task}
              index={index}
              isDragging={false}
              isJustMoved={task.id === justMovedTaskId}
              onSelect={onSelect}
              onMoveStatus={onMoveStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}

        {hasExcess && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-98 cursor-pointer mt-1 shadow-2xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Sembunyikan ({tasks.length - 5} tugas)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Lihat {tasks.length - 5} tugas lainnya</span>
              </>
            )}
          </button>
        )}

        {tasks.length === 0 && (
          <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 text-center shadow-xs">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tidak ada tugas {meta.label}</p>
            <p className="text-[11px] text-slate-400 mt-1">Tugas pada kolom ini kosong.</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`flex w-full min-w-0 flex-1 flex-col rounded-3xl border bg-white/80 dark:bg-slate-900/90 shadow-xs transition-all duration-200 ${meta.border}`}>
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100/70 dark:border-slate-800">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${meta.badge}`}>{meta.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-liquid-text-secondary dark:text-slate-400">{tasks.length}</span>
          {hasExcess && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? "Lipat tugas lebih dari 5" : `Tampilkan ${tasks.length - 5} tugas lainnya`}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={isExpanded ? "Lipat tugas" : "Buka semua tugas"}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[220px] flex-1 space-y-3 rounded-b-3xl p-3 transition-all duration-200 ${snapshot.isDraggingOver ? `${meta.dropBg} ring-2 ${meta.activeRing} shadow-inner` : isDraggingAny ? "bg-slate-50/40 dark:bg-slate-800/30" : ""}`}
          >
            {visibleTasks.map((task, index) => (
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
                    <KanbanTaskCard task={task} index={index} isDragging={dragSnapshot.isDragging} isJustMoved={task.id === justMovedTaskId} onSelect={onSelect} onMoveStatus={onMoveStatus} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {hasExcess && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition active:scale-98 cursor-pointer mt-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Sembunyikan ({tasks.length - 5} tugas)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>+{tasks.length - 5} tugas lainnya</span>
                  </>
                )}
              </button>
            )}

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

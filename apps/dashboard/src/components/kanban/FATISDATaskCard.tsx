"use client";

import { Draggable } from "@hello-pangea/dnd";
import { TaskDueBadge } from "./TaskDueBadge";
import { AssigneeAvatar } from "./AssigneeAvatar";
import { EditTaskModal } from "./EditTaskModal";
import { Task } from "./types";
import { useRole } from "@/hooks/useRole";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  task: Task;
  index: number;
}

export function FATISDATaskCard({ task, index }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isModerator } = useRole();
  const canEdit = isAdmin || isModerator;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDelete = async () => {
    if (!confirm("Hapus tugas ini?")) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              relative bg-fsd-card border border-fsd-border-light/20 rounded-md p-3.5
              hover:shadow-card-hover hover:border-fsd-accent/30 transition-all cursor-grab active:cursor-grabbing
              ${snapshot.isDragging ? "shadow-glow border-fsd-accent rotate-1" : ""}
            `}
          >
            {canEdit && (
              <div className="absolute top-2 right-2" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="p-1 rounded hover:bg-fsd-surface text-fsd-muted"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-28 bg-fsd-card rounded-md border border-fsd-border-light/50 shadow-card-hover py-1 z-10">
                    <button
                      onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fsd-text hover:bg-fsd-surface transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fsd-alert hover:bg-fsd-alert/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            )}

            <span className="fsd-meta text-[10px] text-fsd-accent/70">#{task.id.slice(0, 8)}</span>

            <h4 className="mt-1 text-sm font-semibold text-fsd-text leading-snug pr-6">
              {task.title}
            </h4>

            {task.description && (
              <p className="mt-1 text-xs text-fsd-text-secondary line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <TaskDueBadge dueDate={task.dueDate} status={task.status} />
              {task.assignee ? (
                <AssigneeAvatar user={task.assignee} />
              ) : (
                <div className="w-6 h-6 rounded-md bg-fsd-surface border border-dashed border-fsd-border-light/50 flex items-center justify-center">
                  <span className="text-[8px] text-fsd-muted">?</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
      {editOpen && <EditTaskModal task={task} onClose={() => setEditOpen(false)} />}
    </>
  );
}

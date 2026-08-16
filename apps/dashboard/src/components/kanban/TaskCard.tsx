"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Task } from "./types";
import { DueBadge } from "./DueBadge";
import { AssigneeAvatar } from "./AssigneeAvatar";
import { EditTaskSheet } from "./EditTaskSheet";
import { useRole } from "@/hooks/useRole";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isModerator } = useRole();
  const canManage = isAdmin || isModerator;

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
    } catch (e) {
      console.error(e);
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
              group relative rounded-2xl border border-black/[0.04] bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all
              hover:border-black/[0.08] hover:bg-white/90 hover:shadow-md
              ${snapshot.isDragging ? "rotate-1 scale-[1.02] shadow-lg ring-1 ring-liquid-accent/20" : ""}
            `}
          >
            {canManage && (
              <div className="absolute right-2 top-2" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-liquid-text-tertiary opacity-0 transition-all hover:bg-black/[0.04] hover:text-liquid-text-secondary group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-28 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 shadow-glass-lg backdrop-blur-xl">
                    <button
                      onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-liquid-text transition-colors hover:bg-black/[0.03]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-liquid-danger transition-colors hover:bg-liquid-danger-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] font-medium text-liquid-accent/70">#{task.id.slice(0, 8)}</p>
            <h4 className="mt-1 pr-6 text-[13px] font-semibold leading-snug text-liquid-text">{task.title}</h4>
            {task.description && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-liquid-text-secondary">{task.description}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <DueBadge dueDate={task.dueDate} status={task.status} />
              {task.assignee ? (
                <AssigneeAvatar user={task.assignee} />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/[0.02]">
                  <span className="text-[9px] text-liquid-text-tertiary">?</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
      {editOpen && <EditTaskSheet task={task} onClose={() => setEditOpen(false)} />}
    </>
  );
}

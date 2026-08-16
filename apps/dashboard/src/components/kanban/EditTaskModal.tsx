"use client";

import { useState } from "react";
import { useGuild } from "@/components/providers/GuildProvider";
import { useMembers } from "@/hooks/useMembers";
import { useRole } from "@/hooks/useRole";
import { Task } from "./types";
import { X, Loader2 } from "lucide-react";

interface Props {
  task: Task;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: Props) {
  const { selectedGuild } = useGuild();
  const { members } = useMembers(selectedGuild);
  const { isAdmin, isModerator } = useRole();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = isAdmin || isModerator;
  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-fsd-card rounded-lg border border-fsd-border-light/50 p-6 text-center">
          <p className="text-fsd-alert text-sm">Kamu tidak punya izin untuk edit tugas.</p>
          <button onClick={onClose} className="mt-4 text-xs text-fsd-text-secondary hover:text-fsd-text">Tutup</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          assignedTo: assignedTo || null,
          dueDate: dueDate || null,
          status,
        }),
      });
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-fsd-card rounded-lg border border-fsd-border-light/50 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-fsd-text">Edit Tugas</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-fsd-surface text-fsd-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">JUDUL</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none" required />
          </div>
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">DESKRIPSI</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none h-24 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">PENANGGUNG JAWAB</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none">
                <option value="">Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">TENGAT WAKTU</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none" />
            </div>
          </div>
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">STATUS</label>
            <div className="flex gap-2">
              {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-[10px] fsd-meta rounded-md border transition-all ${status === s ? "bg-fsd-accent text-fsd-bg border-fsd-accent" : "bg-fsd-surface text-fsd-text-secondary border-fsd-border-light/30 hover:border-fsd-accent/40"}`}>
                  {s === "TODO" ? "BELUM" : s === "IN_PROGRESS" ? "PROSES" : s === "REVIEW" ? "REVIEW" : "SELESAI"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-medium text-fsd-text-secondary hover:text-fsd-text transition-colors">Batal</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-fsd-accent text-fsd-bg rounded-md hover:bg-fsd-accent-hover transition-colors disabled:opacity-50">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

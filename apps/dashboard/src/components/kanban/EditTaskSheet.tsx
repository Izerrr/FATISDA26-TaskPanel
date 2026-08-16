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

export function EditTaskSheet({ task, onClose }: Props) {
  const { selectedGuild } = useGuild();
  const { members } = useMembers(selectedGuild);
  const { isAdmin, isModerator } = useRole();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [submitting, setSubmitting] = useState(false);

  if (!isAdmin && !isModerator) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-black/[0.06] bg-white/90 p-6 shadow-glass-lg backdrop-blur-xl text-center">
          <p className="text-[13px] text-liquid-danger">Kamu tidak punya izin untuk mengedit tugas.</p>
          <button onClick={onClose} className="mt-4 text-[13px] font-medium text-liquid-text-secondary hover:text-liquid-text">Tutup</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white/90 p-6 shadow-glass-lg backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-liquid-text">Edit Tugas</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-liquid-text-tertiary transition-colors hover:bg-black/[0.04]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">Judul</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-[13px] text-liquid-text outline-none transition-all focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10" required />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full resize-none rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-[13px] text-liquid-text outline-none transition-all focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">Penanggung Jawab</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-[13px] text-liquid-text outline-none focus:border-liquid-accent/40">
                <option value="">Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">Tenggat</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-[13px] text-liquid-text outline-none focus:border-liquid-accent/40" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-liquid-text-secondary">Status</label>
            <div className="flex gap-2">
              {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 rounded-2xl border py-2.5 text-[11px] font-semibold transition-all ${status === s ? "border-liquid-accent bg-liquid-accent text-white shadow-md shadow-liquid-accent/20" : "border-black/[0.06] bg-black/[0.02] text-liquid-text-secondary hover:border-black/[0.10]"}`}>
                  {s === "TODO" ? "Belum" : s === "IN_PROGRESS" ? "Proses" : s === "REVIEW" ? "Review" : "Selesai"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl px-5 py-2.5 text-[13px] font-medium text-liquid-text-secondary transition-colors hover:bg-black/[0.03]">Batal</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-liquid-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-liquid-accent/20 transition-all hover:bg-liquid-accent/90 active:scale-[0.97] disabled:opacity-50">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

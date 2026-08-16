"use client";

import { useState } from "react";
import { useGuild } from "@/components/providers/GuildProvider";
import { useMembers } from "@/hooks/useMembers";
import { useRole } from "@/hooks/useRole";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function NewTaskModal({ onClose }: Props) {
  const { selectedGuild } = useGuild();
  const { members } = useMembers(selectedGuild);
  const { isAdmin, isModerator } = useRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "REVIEW" | "DONE">("TODO");
  const [submitting, setSubmitting] = useState(false);

  const canCreate = isAdmin || isModerator;
  if (!canCreate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-fsd-card rounded-lg border border-fsd-border-light/50 p-6 text-center">
          <p className="text-fsd-alert text-sm">Kamu tidak punya izin untuk membuat tugas.</p>
          <button onClick={onClose} className="mt-4 text-xs text-fsd-text-secondary hover:text-fsd-text">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuild || !title.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: selectedGuild,
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
          <h2 className="text-lg font-bold text-fsd-text">Tugas Baru</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-fsd-surface text-fsd-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">JUDUL</label>
            <input
              type="text"
              placeholder="Judul tugas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text placeholder:text-fsd-muted focus:border-fsd-accent focus:ring-1 focus:ring-fsd-accent/20 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">DESKRIPSI</label>
            <textarea
              placeholder="Deskripsi tugas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text placeholder:text-fsd-muted focus:border-fsd-accent focus:ring-1 focus:ring-fsd-accent/20 outline-none transition-all h-24 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">PENANGGUNG JAWAB</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none">
                <option value="">Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">TENGAT WAKTU</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-fsd-surface border border-fsd-border-light/30 rounded-md px-3 py-2.5 text-sm text-fsd-text focus:border-fsd-accent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="fsd-meta text-[10px] text-fsd-text-secondary mb-1.5 block">STATUS AWAL</label>
            <div className="flex gap-2">
              {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-[10px] fsd-meta rounded-md border transition-all ${status === s ? "bg-fsd-accent text-fsd-bg border-fsd-accent" : "bg-fsd-surface text-fsd-text-secondary border-fsd-border-light/30 hover:border-fsd-accent/40"}`}
                >
                  {s === "TODO" ? "BELUM" : s === "IN_PROGRESS" ? "PROSES" : s === "REVIEW" ? "REVIEW" : "SELESAI"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-medium text-fsd-text-secondary hover:text-fsd-text transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-fsd-accent text-fsd-bg rounded-md hover:bg-fsd-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Buat Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

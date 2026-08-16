"use client";

import { useState } from "react";
import type { Course, Role } from "@/types";

interface TaskCreateModalProps {
  open: boolean;
  guildId: string;
  courses: Course[];
  roles: Role[];
  onClose: () => void;
  onCreated: () => void;
}

export function TaskCreateModal({ open, guildId, courses, roles, onClose, onCreated }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreateClass = roles.some((role) =>
    ["ADMIN", "PJ_KELAS", "PJ_MATKUL"].includes(role),
  );

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }
    if (scope === "CLASS" && !canCreateClass) {
      setError("Kamu tidak memiliki izin membuat tugas kelas.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          title: title.trim(),
          description: description.trim() || null,
          courseId: courseId || null,
          dueDate: dueDate || null,
          scope,
          status: "TODO",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal membuat tugas.");

      setTitle("");
      setDescription("");
      setCourseId("");
      setDueDate("");
      setScope("PERSONAL");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tugas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-liquid-text">Tugas Baru</h2>
            <p className="mt-1 text-xs text-liquid-text-secondary">Tambahkan tugas ke workspace aktif.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-700">Tutup</button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            {(["PERSONAL", "CLASS"] as const).map((value) => {
              const disabled = value === "CLASS" && !canCreateClass;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setScope(value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${scope === value ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent" : "border-slate-200 text-slate-500 hover:bg-slate-50"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {value === "PERSONAL" ? "Personal" : "Kelas"}
                </button>
              );
            })}
          </div>

          <div>
            <label className="label mb-2 block">Judul</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" placeholder="Contoh: Laporan Praktikum" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-2 block">Mata Kuliah</label>
              <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent">
                <option value="">Tanpa mata kuliah</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-2 block">Deadline</label>
              <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" />
            </div>
          </div>

          <div>
            <label className="label mb-2 block">Deskripsi</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" placeholder="Detail tugas..." />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Batal</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-liquid-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Tugas"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

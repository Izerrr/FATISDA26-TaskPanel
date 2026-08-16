"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Course, Role } from "@/types";

interface Props {
  open: boolean;
  guildId: string;
  courses: Course[];
  roles: Role[];
  userId: string;
  onClose: () => void;
  onCreated: () => Promise<unknown>;
}

export function NewTaskModal({ open, guildId, courses, roles, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const canCreateClass = roles.some((role) => ["ADMIN", "PJ_KELAS", "PJ_MATKUL"].includes(role));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return setError("Judul tugas wajib diisi.");
    if (scope === "CLASS" && !canCreateClass) return setError("Kamu tidak memiliki izin membuat tugas kelas.");

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, title, description, courseId: courseId || null, dueDate: dueDate || null, scope, status: "TODO" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat tugas.");
      await onCreated();
      setTitle(""); setDescription(""); setCourseId(""); setDueDate(""); setScope("PERSONAL");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tugas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-bold text-liquid-text">Tugas Baru</h2>
            <p className="mt-1 text-xs text-liquid-text-secondary">Tambahkan tugas ke workspace saat ini.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            {(["PERSONAL", "CLASS"] as const).map((value) => {
              const disabled = value === "CLASS" && !canCreateClass;
              return (
                <button key={value} type="button" disabled={disabled} onClick={() => setScope(value)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${scope === value ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent" : "border-slate-200 text-slate-500"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
                  {value === "PERSONAL" ? "Personal" : "Kelas"}
                </button>
              );
            })}
          </div>

          <div>
            <label className="label mb-2 block">Judul</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Contoh: Laporan Praktikum" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" />
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
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Detail tugas..." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Batal</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-liquid-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Tugas"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

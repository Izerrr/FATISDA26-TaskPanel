"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, User, Users, X } from "lucide-react";
import type { Course, Role, Task, TaskStatus } from "@/types";

interface Props {
  open: boolean;
  task: Task | null;
  courses: Course[];
  roles: Role[] | string[];
  onClose: () => void;
  onUpdated: () => Promise<unknown> | void;
}

export function EditTaskModal({ open, task, courses, roles, onClose, onUpdated }: Props) {
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");
  const [targetKelas, setTargetKelas] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setCourseId(task.course?.id || task.courseId || "");
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate("");
      }
      setStatus(task.status);
      setScope(task.scope);
      setTargetKelas(task.kelas || "ALL");
      setError("");
    }
  }, [task]);

  if (!open || !mounted || !task) return null;

  const canCreateClass = roles.some((role) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(String(role)));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!task) return;

    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          courseId: courseId || null,
          dueDate: dueDate || null,
          status,
          scope,
          kelas: scope === "CLASS" ? (targetKelas === "ALL" ? null : targetKelas) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui tugas.");
      }

      await onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui tugas.");
    } finally {
      setLoading(false);
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative flex w-full max-w-[460px] flex-col rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] my-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Edit Tugas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Perbarui rincian, status, dan tenggat waktu tugas.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form id="edit-task-form" onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-3.5 flex-1">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-600 dark:text-red-400">{error}</div>}

          {/* Scope & Status */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Lingkup</label>
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => setScope("PERSONAL")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    scope === "PERSONAL" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Personal</span>
                </button>

                <button
                  type="button"
                  disabled={!canCreateClass}
                  onClick={() => setScope("CLASS")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    scope === "CLASS" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  } ${!canCreateClass ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Kelas</span>
                </button>
              </div>
            </div>

            <div>
              <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 text-xs outline-none transition focus:border-sky-500 mt-0.5"
              >
                <option value="TODO" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Todo
                </option>
                <option value="IN_PROGRESS" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  In Progress
                </option>
                <option value="NEED_REVIEW" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Need Review
                </option>
                <option value="DONE" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Done
                </option>
              </select>
            </div>
          </div>

          {scope === "CLASS" && (
            <div className="rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">Target Kelas:</span>
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">{targetKelas === "ALL" ? "Semua Kelas di Prodi" : `Khusus Kelas ${targetKelas}`}</span>
              </div>
              <div className="grid grid-cols-6 gap-1 p-1 rounded-xl bg-white/80 dark:bg-slate-800 border border-blue-100 dark:border-blue-900/40">
                {["ALL", "A", "B", "C", "D", "E"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTargetKelas(k)}
                    className={`py-1 rounded-lg text-xs font-bold transition ${targetKelas === k ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >
                    {k === "ALL" ? "Semua" : `Kls ${k}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Judul Tugas *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Judul tugas..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 text-xs outline-none transition focus:border-sky-500"
            />
          </div>

          {/* Course & Due Date */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Mata Kuliah</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 text-xs outline-none transition focus:border-sky-500"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Tanpa mata kuliah
                </option>
                {task?.course && !courses.some((c) => c.id === task.course?.id) && (
                  <option value={task.course.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {task.course.code} — {task.course.name}
                  </option>
                )}
                {courseId && (!task?.course || task.course.id !== courseId) && !courses.some((c) => c.id === courseId) && (
                  <option value={courseId} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {courseId.startsWith("sched-") ? decodeURIComponent(courseId.replace(/^sched-/, "")) : courseId}
                  </option>
                )}
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {course.code} — {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Deadline</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 text-xs outline-none transition focus:border-sky-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi / Detail</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2.5}
              placeholder="Instruksi tugas..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 text-xs outline-none transition focus:border-sky-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition">
            Batal
          </button>

          <button
            type="submit"
            form="edit-task-form"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-liquid-accent px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50 active:scale-95"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

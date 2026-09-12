"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { useGuild } from "@/components/providers/GuildProvider";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import { useCourses } from "@/hooks/useCourses";
import { useSchedule } from "@/hooks/useSchedule";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { Overview } from "@/components/dashboard/Overview";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

import type { Course } from "@/types";

interface CreateTaskModalProps {
  open: boolean;
  guildId: string | null;
  courses: Course[];
  roles: string[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateTaskModal({ open, guildId, courses, roles, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCreateClass = roles.some((role) => ["ADMIN", "PJ_KELAS", "PJ_MATKUL"].includes(role));

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guildId) {
      setError("Pilih server Discord terlebih dahulu.");
      return;
    }

    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }

    if (scope === "CLASS" && !canCreateClass) {
      setError("Kamu tidak memiliki izin membuat tugas kelas.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat tugas.");
      }

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
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-liquid-text">Tugas Baru</h2>

            <p className="mt-1 text-xs text-liquid-text-secondary">Tambahkan tugas ke workspace yang sedang dipilih.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope("PERSONAL")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${scope === "PERSONAL" ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent" : "border-slate-200 text-slate-500"}`}
            >
              Personal
            </button>

            <button
              type="button"
              disabled={!canCreateClass}
              onClick={() => setScope("CLASS")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${scope === "CLASS" ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent" : "border-slate-200 text-slate-500"} ${
                !canCreateClass ? "cursor-not-allowed opacity-40" : ""
              }`}
            >
              Kelas
            </button>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="label mb-2 block font-semibold text-liquid-text">Judul Tugas</label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="Contoh: Laporan Praktikum Modul 2"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-liquid-text outline-none transition focus:border-liquid-accent focus:bg-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-2 block font-semibold text-liquid-text">Mata Kuliah</label>

              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-liquid-text outline-none transition focus:border-liquid-accent focus:bg-white"
              >
                <option value="">Tanpa mata kuliah</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} ({course.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-2 block font-semibold text-liquid-text">Deadline Pengumpulan</label>

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-liquid-text outline-none transition focus:border-liquid-accent focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="label mb-2 block">Deskripsi</label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Detail tugas..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Batal
            </button>

            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-liquid-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Plus className="h-4 w-4" />

              {loading ? "Menyimpan..." : "Simpan Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DashboardShell() {
  const { selectedGuild } = useGuild();

  const { roles, user } = useRole();

  const { courses, isLoading: coursesLoading } = useCourses();

  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(selectedGuild);

  const { schedules, isLoading: schedulesLoading, isError: schedulesError } = useSchedule();

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => [task.title, task.description ?? "", task.course?.name ?? ""].join(" ").toLowerCase().includes(query));
  }, [tasks, search]);

  return (
    <DashboardFrame onNewTask={() => setCreateOpen(true)}>
      <section>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-liquid-text">Halo, {user?.username ?? "Mahasiswa"}!</h1>
          <p className="text-xs font-medium text-liquid-text-tertiary">Semester Aktif: {user?.semester ?? 2}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-liquid-text-secondary">
            {user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Prodi belum tersinkron"}
          </span>

          {user?.kelas && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-medium text-liquid-text-secondary">Kelas {user.kelas}</span>
            </>
          )}

          {roles.map((role) => {
            const roleText = role === "ADMIN" ? "Administrator" : role === "PJ_KELAS" ? "PJ Kelas" : role === "PJ_MATKUL" ? "PJ Mata Kuliah" : null;

            if (!roleText) {
              return null;
            }

            return (
              <span key={String(role)} className="rounded-full bg-liquid-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-liquid-accent">
                {roleText}
              </span>
            );
          })}
        </div>
      </section>

      {tasksLoading || coursesLoading || schedulesLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" />
          </div>
        </div>
      ) : tasksError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text">Gagal memuat tugas</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary">Periksa koneksi dan endpoint task.</p>
        </div>
      ) : schedulesError ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text">Jadwal belum tersedia</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary">Data tugas tetap tersedia, tetapi jadwal belum dapat dimuat.</p>

          <Overview tasks={tasks} schedules={[]} />
        </div>
      ) : (
        <>
          <Overview tasks={tasks} schedules={schedules} />

          <section id="tasks" className="rounded-2xl border border-liquid-border bg-white/70 p-4 shadow-glass md:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-bold text-liquid-text">Papan Tugas</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary">Seret tugas untuk memperbarui status pengerjaan.</p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{visibleTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={visibleTasks} onMutated={() => void mutate()} />
          </section>
        </>
      )}

      <CreateTaskModal open={createOpen} guildId={selectedGuild} courses={courses} roles={roles.map((role) => String(role))} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} />
    </DashboardFrame>
  );
}

export default DashboardShell;

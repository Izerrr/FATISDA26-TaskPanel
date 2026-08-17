"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { useGuild } from "@/components/providers/GuildProvider";
import { useGuilds } from "@/hooks/useGuilds";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopNav } from "@/components/layout/TopNav";
import { Overview } from "@/components/dashboard/Overview";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useSchedule } from "@/hooks/useSchedule";
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

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setCourseId("");
      setDueDate("");
      setScope("PERSONAL");
      setLoading(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

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

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat tugas.");
      }

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
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                scope === "CLASS" ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent" : "border-slate-200 text-slate-500"
              } ${!canCreateClass ? "cursor-not-allowed opacity-40" : ""}`}
            >
              Kelas
            </button>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="label mb-2 block">Judul</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="Contoh: Laporan Praktikum"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-2 block">Mata Kuliah</label>
              <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent">
                <option value="">Tanpa mata kuliah</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-2 block">Deadline</label>
              <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-liquid-accent" />
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
  const { guilds, isLoading: guildsLoading, isError: guildsError } = useGuilds();
  const { selectedGuild, setSelectedGuild } = useGuild();
  const { roles, user } = useRole();
  const { schedules, isLoading: schedulesLoading, isError: schedulesError } = useSchedule();

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const effectiveGuild = selectedGuild ?? guilds[0]?.id ?? null;
  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(effectiveGuild);

  useEffect(() => {
    if (!selectedGuild && guilds[0]?.id) {
      setSelectedGuild(guilds[0].id);
    }
  }, [guilds, selectedGuild, setSelectedGuild]);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      if (!effectiveGuild) {
        setCourses([]);
        return;
      }

      setCoursesLoading(true);

      try {
        const response = await fetch("/api/courses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal memuat mata kuliah.");
        }

        const data = await response.json();
        if (!cancelled) {
          setCourses(Array.isArray(data.courses) ? data.courses : []);
        }
      } catch (error) {
        console.error("[DashboardShell] Courses:", error);
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [effectiveGuild]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) => [task.title, task.description ?? "", task.course?.name ?? ""].join(" ").toLowerCase().includes(query));
  }, [tasks, search]);

  if (guildsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg">
        <Loader2 className="h-6 w-6 animate-spin text-liquid-accent" />
      </div>
    );
  }

  if (guildsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-glass">
          <h1 className="text-lg font-bold text-liquid-text">Gagal memuat workspace</h1>
          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">TaskPanel tidak dapat memverifikasi koneksi workspace FATISDA 2026.</p>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white">
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  if (!effectiveGuild) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6">
        <div className="max-w-md rounded-2xl border border-liquid-border bg-white p-6 text-center shadow-glass">
          <h1 className="text-lg font-bold text-liquid-text">Workspace belum terhubung</h1>
          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">Akun Discord ini belum terhubung ke workspace FATISDA 2026 yang dapat dikelola TaskPanel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-liquid-bg">
      <Sidebar user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onNewTask={() => setCreateOpen(true)} search={search} onSearchChange={setSearch} />

        <main className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <section>
              <p className="text-xs font-medium uppercase tracking-wider text-liquid-text-secondary">Konteks</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-liquid-text">FATISDA 2026</h1>
              <p className="mt-1 text-sm text-liquid-text-secondary">
                {user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Prodi belum tersinkron"}
                {user?.kelas ? ` · Kelas ${user.kelas}` : ""}
              </p>
            </section>

            {tasksLoading || coursesLoading || schedulesLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-liquid-border bg-white shadow-glass">
                <div className="flex items-center gap-2 text-sm text-liquid-text-secondary">
                  <Loader2 className="h-5 w-5 animate-spin text-liquid-accent" />
                  Memuat dashboard...
                </div>
              </div>
            ) : tasksError || schedulesError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-glass">
                <h2 className="font-bold text-liquid-text">Gagal memuat dashboard</h2>
                <p className="mt-1 text-sm text-liquid-text-secondary">Periksa koneksi dan coba muat ulang halaman.</p>
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
          </div>
        </main>
        <MobileNav />
      </div>

      <CreateTaskModal open={createOpen} guildId={effectiveGuild} courses={courses} roles={roles.map((role) => String(role))} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} />
    </div>
  );
}

export default DashboardShell;

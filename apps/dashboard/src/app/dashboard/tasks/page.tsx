"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ClipboardList, FlaskConical, Plus, RotateCcw, Search, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useGuild } from "@/components/providers/GuildProvider";
import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskScope, TaskStatus } from "@/types";

const TaskNotificationTestModal = dynamic(
  () => import("@/components/dashboard/TaskNotificationTestModal").then((m) => m.TaskNotificationTestModal),
  { ssr: false }
);
const NewTaskModal = dynamic(
  () => import("@/components/kanban/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);

type ScopeFilter = "ALL" | TaskScope;
type StatusFilter = "ALL" | TaskStatus;

const VALID_SCOPES: ScopeFilter[] = ["ALL", "PERSONAL", "GROUP", "CLASS"];
const VALID_STATUSES: StatusFilter[] = ["ALL", "TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

function TasksPageContent() {
  const { selectedGuild } = useGuild();
  const { user, roles } = useRole();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(selectedGuild);

  const searchParams = useSearchParams();
  const router = useRouter();

  const paramCourseId = searchParams.get("courseId");
  const paramScope = searchParams.get("scope");
  const paramStatus = searchParams.get("status");
  const paramMine = searchParams.get("mine");

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(
    paramScope && VALID_SCOPES.includes(paramScope as ScopeFilter) ? (paramScope as ScopeFilter) : "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    paramStatus && VALID_STATUSES.includes(paramStatus as StatusFilter) ? (paramStatus as StatusFilter) : "ALL"
  );
  const [courseFilter, setCourseFilter] = useState(paramCourseId || "ALL");
  const [onlyMyTasks, setOnlyMyTasks] = useState(paramMine === "1");
  const [createOpen, setCreateOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  useEffect(() => {
    if (paramCourseId) setCourseFilter(paramCourseId);
    if (paramScope && VALID_SCOPES.includes(paramScope as ScopeFilter)) {
      setScopeFilter(paramScope as ScopeFilter);
    }
    if (paramStatus && VALID_STATUSES.includes(paramStatus as StatusFilter)) {
      setStatusFilter(paramStatus as StatusFilter);
    }
    if (paramMine === "1") setOnlyMyTasks(true);
  }, [paramCourseId, paramScope, paramStatus, paramMine]);

  const canTestNotify = roles.some((role) =>
    ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(role)
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    scopeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    courseFilter !== "ALL" ||
    onlyMyTasks;

  function handleResetFilters() {
    setSearch("");
    setScopeFilter("ALL");
    setStatusFilter("ALL");
    setCourseFilter("ALL");
    setOnlyMyTasks(false);
    if (paramCourseId || paramScope || paramStatus || paramMine) {
      router.replace("/dashboard/tasks", { scroll: false });
    }
  }

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task: Task) => {
      if (onlyMyTasks) {
        const isGroupMember =
          task.scope === "GROUP" &&
          user?.id &&
          (task.createdById === user.id || task.members?.some((m) => m.userId === user.id));
        const isMine =
          task.scope === "PERSONAL" ||
          Boolean(isGroupMember) ||
          (user?.id && (task.createdById === user.id || task.assignedTo === user.id));
        if (!isMine) return false;
      }

      const matchesSearch =
        !query ||
        [task.title, task.description ?? "", task.course?.name ?? "", task.course?.code ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesScope = scopeFilter === "ALL" || task.scope === scopeFilter;
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesCourse = courseFilter === "ALL" || task.course?.id === courseFilter || task.courseId === courseFilter;

      return matchesSearch && matchesScope && matchesStatus && matchesCourse;
    });
  }, [tasks, search, scopeFilter, statusFilter, courseFilter, onlyMyTasks, user?.id]);

  const activeCount = tasks.filter((task) => task.status !== "DONE").length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;

  const prodiLabel =
    user?.prodi === "INFORMATIKA"
      ? "Informatika"
      : user?.prodi === "SAINS_DATA"
        ? "Sains Data"
        : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN"
          ? "Informatika PSDKU Kebumen"
          : null;

  async function handleCreated() {
    await mutate();
  }

  return (
    <DashboardFrame onNewTask={() => setCreateOpen(true)}>
      <div className="space-y-6">
        {/* Header */}
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-liquid-accent" />
                <h1 className="text-xl font-bold text-liquid-text dark:text-slate-100">Tugas</h1>
              </div>

              <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">
                Kelola tugas personal, kelompok, dan tugas kelas dalam satu tempat.
              </p>

              {(prodiLabel || user?.kelas) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {prodiLabel && (
                    <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{prodiLabel}</span>
                  )}
                  {prodiLabel && user?.kelas && <span className="text-slate-300 dark:text-slate-600">·</span>}
                  {user?.kelas && (
                    <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Kelas {user.kelas}</span>
                  )}

                  {roles
                    .filter((role) => role !== "STUDENT")
                    .map((role) => {
                      const label =
                        role === "ADMIN"
                          ? "Administrator"
                          : role === "OWNER"
                            ? "Owner"
                            : role === "KETUA_ANGKATAN"
                              ? "Ketua Angkatan"
                              : role === "PJ_KELAS"
                                ? "PJ Kelas"
                                : role === "PJ_MATKUL"
                                  ? "PJ Mata Kuliah"
                                  : null;

                      if (!label) return null;

                      return (
                        <span
                          key={role}
                          className="rounded-full bg-liquid-accent/10 px-3 py-1 text-xs font-semibold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300"
                        >
                          {label}
                        </span>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {canTestNotify && (
                <button
                  type="button"
                  onClick={() => setTestOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3.5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100/80 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/60"
                  title="Admin Testing Environment: Uji Notifikasi Discord"
                >
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline">Uji Notifikasi</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={!selectedGuild}
                className="flex items-center justify-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-liquid-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Tugas Baru
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-2xl border border-liquid-border bg-white p-3.5 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <p className="text-[11px] font-medium text-liquid-text-secondary dark:text-slate-400 sm:text-xs">Total Tugas</p>
            <p className="mt-1.5 text-xl font-bold text-liquid-text dark:text-slate-100 sm:mt-2 sm:text-2xl">{tasks.length}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-3.5 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <p className="text-[11px] font-medium text-liquid-text-secondary dark:text-slate-400 sm:text-xs">Belum Selesai</p>
            <p className="mt-1.5 text-xl font-bold text-liquid-text dark:text-slate-100 sm:mt-2 sm:text-2xl">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-3.5 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <p className="text-[11px] font-medium text-liquid-text-secondary dark:text-slate-400 sm:text-xs">Selesai</p>
            <p className="mt-1.5 text-xl font-bold text-liquid-text dark:text-slate-100 sm:mt-2 sm:text-2xl">{doneCount}</p>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari tugas..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-liquid-accent focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800/90"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:items-center">
              <select
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-liquid-accent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:w-auto"
              >
                <option value="ALL">Semua Scope</option>
                <option value="PERSONAL">Personal</option>
                <option value="GROUP">Kelompok</option>
                <option value="CLASS">Kelas</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-liquid-accent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:w-auto"
              >
                <option value="ALL">Semua Status</option>
                <option value="TODO">Todo</option>
                <option value="WAITING">Waiting List</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NEED_REVIEW">Need Review</option>
                <option value="DONE">Done</option>
              </select>

              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                disabled={coursesLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-liquid-accent disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:w-auto"
              >
                <option value="ALL">Semua Mata Kuliah</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                className={`inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition lg:w-auto ${
                  onlyMyTasks
                    ? "bg-blue-600 text-white shadow-xs dark:bg-sky-600"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <UserRound className="h-3.5 w-3.5" />
                <span>Hanya Tugas Saya</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
              Menampilkan <span className="font-semibold text-liquid-text dark:text-slate-200">{filteredTasks.length}</span> dari{" "}
              <span className="font-semibold text-liquid-text dark:text-slate-200">{tasks.length}</span> tugas.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-liquid-accent transition hover:bg-liquid-accent/10 dark:text-sky-400 dark:hover:bg-sky-500/15"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </section>

        {/* Kanban / List / Calendar */}
        {tasksError ? (
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-glass dark:border-red-900/50 dark:bg-slate-900">
            <h2 className="font-bold text-liquid-text dark:text-slate-100">Gagal memuat tugas</h2>
            <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Terjadi masalah saat mengambil data tugas.</p>
            <button type="button" onClick={() => void mutate()} className="mt-4 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white">
              Coba Lagi
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-liquid-border bg-white/80 p-4 shadow-glass backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-liquid-text dark:text-slate-100">Papan Tugas</h2>
                <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
                  Drag &amp; drop tugas atau ubah tampilan sesuai kebutuhan.
                </p>
              </div>
              <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{filteredTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={filteredTasks} isLoading={tasksLoading} onMutated={() => void mutate()} />
          </section>
        )}
      </div>

      {createOpen && (
        <NewTaskModal
          open={createOpen}
          guildId={selectedGuild || ""}
          courses={courses}
          roles={roles}
          user={user}
          userId={user?.id}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {canTestNotify && testOpen && (
        <TaskNotificationTestModal open={testOpen} onClose={() => setTestOpen(false)} currentUser={user} />
      )}
    </DashboardFrame>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <DashboardFrame>
          <div className="space-y-4 py-4">
            <div className="h-8 w-44 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </DashboardFrame>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}

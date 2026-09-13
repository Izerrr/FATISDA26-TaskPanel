"use client";

import { AlertCircle, BarChart3, CheckCircle2, Clock3, Flame, ListTodo, TrendingUp } from "lucide-react";
import type { Schedule, Task } from "@/types";
import { OverviewSchedule } from "./OverviewSchedule";

interface OverviewProps {
  tasks: Task[];
  schedules: Schedule[];
}

export function Overview({ tasks, schedules }: OverviewProps) {
  const now = new Date();

  const done = tasks.filter((task) => task.status === "DONE").length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const overdue = tasks.filter((task) => task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < now).length;
  const personal = tasks.filter((task) => task.scope === "PERSONAL").length;
  const classTasks = tasks.filter((task) => task.scope === "CLASS").length;

  const completionRate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  // Beban tugas per mata kuliah
  const courseWorkloadMap = new Map<string, { code: string; name: string; count: number }>();
  tasks
    .filter((t) => t.status !== "DONE" && t.course)
    .forEach((t) => {
      const course = t.course!;
      const curr = courseWorkloadMap.get(course.id) || { code: course.code, name: course.name, count: 0 };
      curr.count += 1;
      courseWorkloadMap.set(course.id, curr);
    });

  const topCourseWorkloads = Array.from(courseWorkloadMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const upcoming = [...tasks]
    .filter((task) => task.dueDate && new Date(task.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const closestTask = upcoming[0];
  const closestHours = closestTask ? Math.max(0, Math.round((new Date(closestTask.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60))) : null;

  const stats = [
    {
      label: "Total Tugas",
      value: tasks.length,
      icon: ListTodo,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      label: "Selesai",
      value: done,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      label: "Berjalan",
      value: inProgress,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      label: "Terlambat",
      value: overdue,
      icon: AlertCircle,
      tone: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-liquid-text dark:text-slate-100">{stat.value}</p>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Productivity Progress & Countdown Bar */}
      <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-glass">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-liquid-text dark:text-slate-100">Tingkat Penyelesaian Tugas</h3>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{completionRate}% Selesai</span>
              </div>
              <p className="text-xs text-liquid-text-secondary dark:text-slate-400 mt-0.5">
                {done} dari {tasks.length} tugas telah diselesaikan
              </p>
            </div>
          </div>

          {closestTask && closestHours !== null && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-300">
              <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>
                Deadline Terdekat: <strong>{closestTask.title}</strong> ({closestHours >= 24 ? `${Math.floor(closestHours / 24)} hari lagi` : closestHours > 0 ? `${closestHours} jam lagi` : "Segera berakhir!"})
              </span>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }} />
        </div>
      </section>

      {/* Main Grid: Deadlines & Today's Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-liquid-text dark:text-slate-100">Deadline Terdekat</h2>
              <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">Berdasarkan tugas yang memiliki deadline.</p>
            </div>

            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300">{upcoming.length} tugas</span>
          </div>

          <div className="mt-5 space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-5 text-sm text-liquid-text-secondary dark:text-slate-400">🎉 Belum ada deadline yang mendekat. Waktunya santai!</div>
            ) : (
              upcoming.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-liquid-text dark:text-slate-100">{task.title}</p>
                    <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">{task.course ? `${task.course.code} · ${task.course.name}` : "Tanpa mata kuliah"}</p>
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-xs font-semibold text-liquid-text dark:text-slate-100">
                      {new Date(task.dueDate!).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">
                      {new Date(task.dueDate!).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <OverviewSchedule schedules={schedules} />
      </div>

      {/* Course Workload & Task Composition */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribusi Beban per Matkul */}
        <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-liquid-accent" />
              <h2 className="font-bold text-liquid-text dark:text-slate-100 text-sm">Beban Tugas per Mata Kuliah</h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">Tugas Aktif</span>
          </div>

          <div className="mt-4 space-y-3">
            {topCourseWorkloads.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Semua tugas mata kuliah sudah selesai.</p>
            ) : (
              topCourseWorkloads.map((cw) => {
                const percentage = Math.min(100, Math.round((cw.count / Math.max(1, inProgress + overdue)) * 100));
                return (
                  <div key={cw.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-liquid-text dark:text-slate-200 truncate max-w-[200px]">
                        [{cw.code}] {cw.name}
                      </span>
                      <span className="font-semibold text-liquid-accent dark:text-sky-400 shrink-0">{cw.count} tugas</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-liquid-accent" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Komposisi Tugas (Personal vs Kelas) */}
        <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text dark:text-slate-100 text-sm pb-3 border-b border-slate-100 dark:border-slate-800">Komposisi & Cakupan Tugas</h2>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-liquid-text-secondary dark:text-slate-400 font-medium">Tugas Kelas</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{classTasks} Tugas</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${tasks.length > 0 ? (classTasks / tasks.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-liquid-text-secondary dark:text-slate-400 font-medium">Tugas Personal (Privat)</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">{personal} Tugas</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${tasks.length > 0 ? (personal / tasks.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

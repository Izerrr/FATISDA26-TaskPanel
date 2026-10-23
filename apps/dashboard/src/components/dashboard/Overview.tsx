"use client";

import { AlertCircle, BarChart3, CheckCircle2, Clock3, Flame, ListTodo, TrendingUp } from "lucide-react";
import type { Schedule, Task } from "@/types";
import { formatWib } from "@/lib/datetime";
import { OverviewSchedule } from "./OverviewSchedule";
import { OverviewExam } from "./OverviewExam";
import { OverviewClassGroups } from "./OverviewClassGroups";

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
    .filter((task) => task.status !== "DONE" && task.dueDate && new Date(task.dueDate) >= now)
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
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="min-w-0 rounded-2xl border border-liquid-border bg-white p-3.5 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-liquid-text dark:text-slate-100 sm:text-3xl">{stat.value}</p>
                </div>

                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${stat.tone}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Productivity Progress & Countdown Bar */}
      <section className="w-full max-w-full min-w-0 rounded-3xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-liquid-text dark:text-slate-100">Tingkat Penyelesaian Tugas</h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">{completionRate}% Selesai</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-liquid-text-secondary dark:text-slate-400">
                {done} dari {tasks.length} tugas telah diselesaikan
              </p>
            </div>
          </div>

          {closestTask && closestHours !== null && (
            <div className="flex w-full max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300 sm:w-auto sm:max-w-md">
              <Flame className="h-4 w-4 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 truncate">
                <span>Deadline Terdekat: </span>
                <strong className="inline-block max-w-[130px] truncate align-bottom font-bold text-slate-800 dark:text-slate-100 sm:max-w-[200px]" title={closestTask.title}>
                  {closestTask.title}
                </strong>{" "}
                <span className="shrink-0 whitespace-nowrap">({closestHours >= 24 ? `${Math.floor(closestHours / 24)} hari lagi` : closestHours > 0 ? `${closestHours} jam lagi` : "Segera berakhir!"})</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }} />
        </div>
      </section>

      {/* Jadwal UTS / UAS Terdekat & Agenda Ujian */}
      <OverviewExam />

      {/* Ruang Kelas & Pembagian Kelompok */}
      <OverviewClassGroups />

      {/* Main Grid: Deadlines & Today's Schedule */}
      <div className="grid w-full max-w-full min-w-0 gap-5 sm:gap-6 lg:grid-cols-3">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-bold text-liquid-text dark:text-slate-100">Deadline Terdekat</h2>
              <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">Berdasarkan tugas aktif yang memiliki deadline.</p>
            </div>

            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">{upcoming.length} tugas</span>
          </div>

          <div className="mt-4 space-y-3 sm:mt-5">
            {upcoming.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-liquid-text-secondary dark:bg-slate-800/50 dark:text-slate-400">🎉 Belum ada deadline yang mendekat. Waktunya santai!</div>
            ) : (
              upcoming.map((task) => (
                <div key={task.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-liquid-text dark:text-slate-100">{task.title}</p>
                    <p className="mt-1 truncate text-xs text-liquid-text-secondary dark:text-slate-400">{task.course ? `${task.course.code} · ${task.course.name}` : "Tanpa mata kuliah"}</p>
                  </div>

                  <div className="ml-2 shrink-0 text-right">
                    <p className="text-xs font-semibold text-liquid-text dark:text-slate-100">
                      {formatWib(task.dueDate!, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">
                      {formatWib(task.dueDate!, {
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
      <div className="grid w-full max-w-full min-w-0 gap-5 sm:gap-6 md:grid-cols-2">
        {/* Distribusi Beban per Matkul */}
        <section className="min-w-0 rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-liquid-accent" />
              <h2 className="truncate text-sm font-bold text-liquid-text dark:text-slate-100">Beban Tugas per Mata Kuliah</h2>
            </div>
            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">Tugas Aktif</span>
          </div>

          <div className="mt-4 space-y-3">
            {topCourseWorkloads.length === 0 ? (
              <p className="py-2 text-xs text-slate-400 dark:text-slate-500">Semua tugas mata kuliah sudah selesai.</p>
            ) : (
              topCourseWorkloads.map((cw) => {
                const percentage = Math.min(100, Math.round((cw.count / Math.max(1, inProgress + overdue)) * 100));
                return (
                  <div key={cw.code} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate font-medium text-liquid-text dark:text-slate-200">
                        [{cw.code}] {cw.name}
                      </span>
                      <span className="shrink-0 font-semibold text-liquid-accent dark:text-sky-400">{cw.count} tugas</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-liquid-accent" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Komposisi Tugas (Personal vs Kelas) */}
        <section className="min-w-0 rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-liquid-text dark:border-slate-800 dark:text-slate-100">Komposisi &amp; Cakupan Tugas</h2>

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

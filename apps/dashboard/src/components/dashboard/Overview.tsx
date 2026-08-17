"use client";

import { AlertCircle, CheckCircle2, Clock3, ListTodo } from "lucide-react";
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

  const stats = [
    {
      label: "Total Tugas",
      value: tasks.length,
      icon: ListTodo,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Selesai",
      value: done,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Berjalan",
      value: inProgress,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Terlambat",
      value: overdue,
      icon: AlertCircle,
      tone: "bg-red-50 text-red-600",
    },
  ];

  const upcoming = [...tasks]
    .filter((task) => task.dueDate && new Date(task.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-liquid-border bg-white p-5 shadow-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-liquid-text-secondary">{stat.label}</p>

                  <p className="mt-1 text-3xl font-bold text-liquid-text">{stat.value}</p>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-liquid-text">Deadline Terdekat</h2>
              <p className="mt-1 text-xs text-liquid-text-secondary">Berdasarkan tugas yang memiliki deadline.</p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">{upcoming.length} tugas</span>
          </div>

          <div className="mt-5 space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-liquid-text-secondary">Belum ada deadline yang tersedia.</div>
            ) : (
              upcoming.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-liquid-text">{task.title}</p>

                    <p className="mt-1 text-xs text-liquid-text-secondary">{task.course?.name ?? "Tanpa mata kuliah"}</p>
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-xs font-semibold text-liquid-text">
                      {new Date(task.dueDate!).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>

                    <p className="text-[11px] text-liquid-text-secondary">
                      {new Date(task.dueDate!).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <OverviewSchedule schedules={schedules} />
      </div>

      <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
        <h2 className="font-bold text-liquid-text">Ringkasan</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-liquid-text-secondary">Personal</span>
            <span className="font-semibold text-liquid-text">{personal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-liquid-text-secondary">Kelas</span>
            <span className="font-semibold text-liquid-text">{tasks.filter((task) => task.scope === "CLASS").length}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

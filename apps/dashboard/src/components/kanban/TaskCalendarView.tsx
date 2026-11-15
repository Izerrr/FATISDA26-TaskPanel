"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
} from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { formatWib, getWibParts, wibDate } from "@/lib/datetime";
import { getUrgency } from "@/lib/due-date";

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onMoveStatus: (task: Task, newStatus: TaskStatus) => Promise<void> | void;
}

const WEEKDAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function toWibDateKey(date: Date | string): string {
  const p = getWibParts(typeof date === "string" ? new Date(date) : date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function TaskCalendarView({ tasks, onSelect, onMoveStatus }: TaskCalendarViewProps) {
  const initialWib = getWibParts(new Date());
  const [viewYear, setViewYear] = useState(initialWib.year);
  const [viewMonth, setViewMonth] = useState(initialWib.month);
  const [selectedKey, setSelectedKey] = useState<string>(() => toWibDateKey(new Date()));

  const todayKey = toWibDateKey(new Date());

  const { tasksByDate, undatedCount } = useMemo(() => {
    const map = new Map<string, Task[]>();
    let undated = 0;

    for (const task of tasks) {
      if (!task.dueDate) {
        undated += 1;
        continue;
      }
      const d = new Date(task.dueDate);
      if (Number.isNaN(d.getTime())) {
        undated += 1;
        continue;
      }
      const key = toWibDateKey(d);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }

    map.forEach((list) => {
      list.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    });

    return { tasksByDate: map, undatedCount: undated };
  }, [tasks]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = wibDate(viewYear, viewMonth, 1, 12, 0);
    const firstParts = getWibParts(firstOfMonth);
    const leadingEmpty = firstParts.weekday - 1; // 1=Mon -> 0 empty

    const nextMonthFirst = wibDate(viewYear, viewMonth + 1, 1, 12, 0);
    const lastOfMonth = new Date(nextMonthFirst.getTime() - 24 * 60 * 60 * 1000);
    const daysInMonth = getWibParts(lastOfMonth).day;

    const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7;
    const cells: Array<{ key: string; dayNum: number; inMonth: boolean }> = [];

    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - leadingEmpty + 1;
      const cellDate = wibDate(viewYear, viewMonth, dayOffset, 12, 0);
      const cellParts = getWibParts(cellDate);
      cells.push({
        key: `${cellParts.year}-${String(cellParts.month).padStart(2, "0")}-${String(cellParts.day).padStart(2, "0")}`,
        dayNum: cellParts.day,
        inMonth: cellParts.month === viewMonth && cellParts.year === viewYear,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const monthTitle = formatWib(wibDate(viewYear, viewMonth, 15, 12, 0), {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    const shifted = getWibParts(wibDate(viewYear, viewMonth + delta, 1, 12, 0));
    setViewYear(shifted.year);
    setViewMonth(shifted.month);
  }

  function jumpToToday() {
    const nowParts = getWibParts(new Date());
    setViewYear(nowParts.year);
    setViewMonth(nowParts.month);
    setSelectedKey(todayKey);
  }

  const selectedDayTasks = tasksByDate.get(selectedKey) ?? [];
  const selectedDayDate = (() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    return wibDate(y, m, d, 12, 0);
  })();

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="min-w-[140px] text-center text-sm font-bold capitalize text-slate-900 dark:text-slate-100">
            {monthTitle}
          </h3>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Hari Ini
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Terlewat
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            H-48 Jam
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Aktif
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Selesai
          </span>
          {undatedCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {undatedCount} tanpa deadline
            </span>
          )}
        </div>
      </div>

      {/* Responsive Layout: Grid + Selected Day Panel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarCells.map((cell) => {
              const dayTasks = tasksByDate.get(cell.key) ?? [];
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedKey;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedKey(cell.key)}
                  className={`flex min-h-[58px] sm:min-h-[88px] flex-col items-stretch justify-between p-1.5 text-left transition ${
                    !cell.inMonth ? "bg-slate-50/60 text-slate-300 dark:bg-slate-950/40 dark:text-slate-600" : "bg-white dark:bg-slate-900"
                  } ${
                    isSelected
                      ? "ring-2 ring-inset ring-liquid-accent bg-sky-50/40 dark:bg-sky-950/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        isToday
                          ? "bg-liquid-accent text-white"
                          : cell.inMonth
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:hidden">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Mobile dots */}
                  {dayTasks.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {dayTasks.slice(0, 4).map((t) => {
                        const urg = getUrgency(t.dueDate, t.status);
                        const dotCls =
                          t.status === "DONE"
                            ? "bg-emerald-500"
                            : urg === "overdue"
                              ? "bg-rose-500"
                              : urg === "dueSoon"
                                ? "bg-amber-500"
                                : "bg-sky-500";
                        return <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />;
                      })}
                    </div>
                  )}

                  {/* Desktop pills */}
                  {dayTasks.length > 0 && (
                    <div className="mt-1 hidden w-full space-y-0.5 sm:block">
                      {dayTasks.slice(0, 2).map((t) => {
                        const urg = getUrgency(t.dueDate, t.status);
                        const pillCls =
                          t.status === "DONE"
                            ? "bg-emerald-50 text-emerald-700 line-through dark:bg-emerald-950/60 dark:text-emerald-300"
                            : urg === "overdue"
                              ? "bg-rose-50 text-rose-700 font-bold dark:bg-rose-950/60 dark:text-rose-300"
                              : urg === "dueSoon"
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300";

                        return (
                          <div
                            key={t.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${pillCls}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="px-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                          +{dayTasks.length - 2} lainnya
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda Drawer / Side Card */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 shrink-0 text-liquid-accent" />
              <div className="min-w-0">
                <h4 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {formatWib(selectedDayDate, { weekday: "long", day: "numeric", month: "long" })}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {selectedDayTasks.length} tugas pada tanggal ini
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
            {selectedDayTasks.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-400 dark:bg-slate-800/50">
                <ListTodo className="mx-auto mb-1.5 h-6 w-6 text-slate-300 dark:text-slate-600" />
                Tidak ada deadline tugas di tanggal ini.
              </div>
            ) : (
              selectedDayTasks.map((task) => {
                const isDone = task.status === "DONE";
                const urgency = getUrgency(task.dueDate, task.status);
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelect(task)}
                    className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-100 p-3 transition hover:border-liquid-accent/40 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:border-sky-500/40 dark:hover:bg-slate-800/60"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onMoveStatus(task, isDone ? "TODO" : "DONE");
                      }}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isDone
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600 dark:bg-slate-800"
                      }`}
                      title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold transition group-hover:text-liquid-accent dark:group-hover:text-sky-400 ${
                          isDone ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            {urgency === "overdue" ? (
                              <AlertCircle className="h-3 w-3 text-rose-500" />
                            ) : (
                              <Clock3 className="h-3 w-3" />
                            )}
                            {formatWib(task.dueDate, { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                        )}
                        {task.course?.code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold dark:bg-slate-800">
                            {task.course.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

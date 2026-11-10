import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { Schedule } from "@/types";

interface ScheduleInteractiveCalendarProps {
  schedules: Schedule[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onResetToday: () => void;
  isCustomDateSelected: boolean;
  showCompactList?: boolean;
}

const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function toMondayDayNum(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ScheduleInteractiveCalendar({
  schedules,
  selectedDate,
  onSelectDate,
  onResetToday,
  isCustomDateSelected,
  showCompactList = false,
}: ScheduleInteractiveCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());

  // Count how many classes exist for each weekday (1 = Monday .. 7 = Sunday)
  const countByWeekday = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    for (const s of schedules) {
      if (s.day >= 1 && s.day <= 7) {
        map[s.day] = (map[s.day] || 0) + 1;
      }
    }
    return map;
  }, [schedules]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = toMondayDayNum(firstDayOfMonth) - 1; // 0 for Monday .. 6 for Sunday

    const cells: Array<{ date: Date | null; dayNum: number; classCount: number }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, dayNum: 0, classCount: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const weekday = toMondayDayNum(dateObj);
      cells.push({
        date: dateObj,
        dayNum: d,
        classCount: countByWeekday[weekday] || 0,
      });
    }

    return cells;
  }, [viewYear, viewMonth, countByWeekday]);

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleJumpToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onResetToday();
  }

  const selectedDayNum = toMondayDayNum(selectedDate);
  const selectedDaySchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => s.day === selectedDayNum)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, selectedDayNum],
  );

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 sm:p-3.5 space-y-3">
      {/* Month Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[110px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {(isCustomDateSelected || viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
          <button
            type="button"
            onClick={handleJumpToday}
            className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-liquid-accent dark:text-sky-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>Hari Ini</span>
          </button>
        )}
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_HEADERS.map((label, idx) => (
          <span
            key={label}
            className={`text-[10px] font-bold uppercase tracking-wider py-0.5 ${
              idx >= 5 ? "text-rose-400 dark:text-rose-500/80" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, index) => {
          if (!cell.date) {
            return <div key={`empty-${index}`} className="h-9 sm:h-10" />;
          }

          const isSelected = isSameCalendarDay(cell.date, selectedDate);
          const isToday = isSameCalendarDay(cell.date, today);
          const hasClasses = cell.classCount > 0;

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onSelectDate(cell.date!)}
              className={`relative flex h-9 sm:h-10 flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-liquid-accent text-white font-bold shadow-xs scale-[1.03]"
                  : isToday
                    ? "bg-sky-50 dark:bg-sky-950/60 text-liquid-accent dark:text-sky-300 ring-1 ring-liquid-accent/40 dark:ring-sky-500/40 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              <span className="leading-none">{cell.dayNum}</span>

              {/* Class Indicator Dots */}
              {hasClasses && (
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: Math.min(3, cell.classCount) }).map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-liquid-accent dark:bg-sky-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Schedule Summary when in Calendar-only mode */}
      {showCompactList && (
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {selectedDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {selectedDaySchedules.length} mata kuliah
            </span>
          </div>

          {selectedDaySchedules.length === 0 ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 py-1.5 text-center">
              Tidak ada jadwal kuliah pada hari ini.
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedDaySchedules.map((s) => {
                const cName = s.courseName ?? s.course?.name ?? "Mata kuliah";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2.5 py-1.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{cName}</p>
                      {s.room && <p className="truncate text-[10px] text-slate-400">{s.room}</p>}
                    </div>
                    <span className="shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

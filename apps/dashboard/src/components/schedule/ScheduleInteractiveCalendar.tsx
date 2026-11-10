import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Clock,
  MapPin,
  UserRound,
  Sparkles,
} from "lucide-react";
import type { Schedule } from "@/types";

interface ScheduleInteractiveCalendarProps {
  schedules: Schedule[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onResetToday: () => void;
  isCustomDateSelected: boolean;
  showCompactList?: boolean;
}

interface ActivePopupInfo {
  date: Date;
  colIndex: number;
  rowIndex: number;
  isClick: boolean;
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
}: ScheduleInteractiveCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());

  // Interactive Popup state (for hover on desktop, tap on mobile)
  const [activePopup, setActivePopup] = useState<ActivePopupInfo | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  // Close popup on unmount or when navigating months/today
  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  // Keyboard navigation: Escape key closes active popup
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActivePopup(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to dismiss popup on mobile/desktop
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActivePopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
    clearHideTimer();
    setActivePopup(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    clearHideTimer();
    setActivePopup(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleJumpToday() {
    clearHideTimer();
    setActivePopup(null);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onResetToday();
  }

  // Hover handlers for Desktop
  function handleMouseEnterCell(date: Date, colIndex: number, rowIndex: number) {
    clearHideTimer();
    setActivePopup({
      date,
      colIndex,
      rowIndex,
      isClick: false,
    });
  }

  function handleMouseLeaveCell() {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setActivePopup((prev) => (prev?.isClick ? prev : null));
    }, 200);
  }

  function handlePopupMouseEnter() {
    clearHideTimer();
  }

  function handlePopupMouseLeave() {
    handleMouseLeaveCell();
  }

  // Click handler for Mobile tap and Desktop click
  function handleCellClick(date: Date, colIndex: number, rowIndex: number) {
    clearHideTimer();
    onSelectDate(date);

    setActivePopup((prev) => {
      // Toggle off if tapping the same date that was clicked
      if (prev && isSameCalendarDay(prev.date, date) && prev.isClick) {
        return null;
      }
      return {
        date,
        colIndex,
        rowIndex,
        isClick: true,
      };
    });
  }

  function handleClosePopup() {
    clearHideTimer();
    setActivePopup(null);
  }

  // Schedules for the active popup date
  const popupSchedules = useMemo(() => {
    if (!activePopup) return [];
    const day = toMondayDayNum(activePopup.date);
    return [...schedules]
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, activePopup]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 sm:p-3.5 space-y-3"
    >
      {/* Mobile Backdrop for light dismiss */}
      {activePopup?.isClick && (
        <div
          className="fixed inset-0 z-30 sm:hidden bg-black/10 dark:bg-black/25"
          onClick={handleClosePopup}
          aria-hidden="true"
        />
      )}

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
          const colIndex = index % 7;
          const rowIndex = Math.floor(index / 7);

          const isCellActive =
            activePopup !== null && isSameCalendarDay(cell.date, activePopup.date);

          // Position logic:
          // Rows 0 & 1 open downwards (top-full) to stay cleanly inside the grid without header clipping.
          // Rows >= 2 open upwards (bottom-full).
          const opensDownwards = rowIndex <= 1;
          const verticalPositionClass = opensDownwards ? "top-full mt-2" : "bottom-full mb-2";
          const arrowVerticalClass = opensDownwards
            ? "-top-1.5 border-t border-l"
            : "-bottom-1.5 border-b border-r";

          // Horizontal alignment based on column:
          // Left columns (0, 1) align leftwards to avoid overflowing the right viewport edge
          // Right columns (5, 6) align rightwards
          // Middle columns (2, 3, 4) center
          let horizontalPositionClass = "left-1/2 -translate-x-1/2";
          let arrowHorizontalClass = "left-1/2 -translate-x-1/2";

          if (colIndex <= 1) {
            horizontalPositionClass = "left-0 sm:left-1/2 sm:-translate-x-1/2";
            arrowHorizontalClass = "left-4 sm:left-1/2 sm:-translate-x-1/2";
          } else if (colIndex >= 5) {
            horizontalPositionClass = "right-0 sm:left-1/2 sm:-translate-x-1/2";
            arrowHorizontalClass = "right-4 sm:left-1/2 sm:-translate-x-1/2";
          }

          return (
            <div
              key={cell.date.toISOString()}
              className="relative flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => handleCellClick(cell.date!, colIndex, rowIndex)}
                onMouseEnter={() => handleMouseEnterCell(cell.date!, colIndex, rowIndex)}
                onMouseLeave={handleMouseLeaveCell}
                aria-label={`${cell.dayNum} ${MONTH_NAMES[viewMonth]} ${viewYear}, ${cell.classCount} mata kuliah`}
                className={`relative flex h-9 sm:h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all ${
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

              {/* Interactive Preview Popover */}
              {isCellActive && (
                <div
                  onMouseEnter={handlePopupMouseEnter}
                  onMouseLeave={handlePopupMouseLeave}
                  className={`absolute z-40 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 ${verticalPositionClass} ${horizontalPositionClass}`}
                  role="tooltip"
                >
                  {/* Arrow Indicator */}
                  <div
                    className={`absolute h-2.5 w-2.5 rotate-45 border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 ${arrowVerticalClass} ${arrowHorizontalClass}`}
                    aria-hidden="true"
                  />

                  {/* Popover Header */}
                  <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        {cell.date.toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {popupSchedules.length > 0
                          ? `${popupSchedules.length} mata kuliah`
                          : "Tidak ada kuliah"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {popupSchedules.length > 0 ? (
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                          Kuliah
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                          Libur
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleClosePopup}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Tutup"
                        aria-label="Tutup preview"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Popover Content */}
                  <div className="relative z-10 mt-2">
                    {popupSchedules.length === 0 ? (
                      <div className="py-2 text-center text-slate-400 dark:text-slate-500">
                        <Sparkles className="mx-auto h-4 w-4 text-amber-500/80 mb-1" />
                        <p className="text-[11px] font-medium">Bebas jadwal kuliah</p>
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto overscroll-contain space-y-1.5 pr-0.5">
                        {popupSchedules.map((s) => {
                          const cName = s.courseName ?? s.course?.name ?? "Mata kuliah";
                          return (
                            <div
                              key={s.id}
                              className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-left transition hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 flex-1">
                                  {cName}
                                </p>
                                <span className="shrink-0 rounded-md bg-white dark:bg-slate-700/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60">
                                  {s.startTime}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Clock className="h-2.5 w-2.5 text-slate-400" />
                                  {s.startTime} - {s.endTime}
                                </span>
                                {s.room && (
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <MapPin className="h-2.5 w-2.5 text-slate-400" />
                                    {s.room}
                                  </span>
                                )}
                                {s.lecturer && (
                                  <span className="inline-flex items-center gap-1 truncate max-w-[120px]">
                                    <UserRound className="h-2.5 w-2.5 text-slate-400" />
                                    {s.lecturer}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Calendar, CalendarDays, Clock3, Columns2, LayoutList, MapPin, MessageSquareShare, UserRound } from "lucide-react";
import Link from "next/link";

import type { Schedule } from "@/types";
import { getDayLabel, getNextSchedules, getCurrentLiveClassStatus, sortSchedules } from "@/lib/schedule-utils";
import { ScheduleInteractiveCalendar } from "@/components/schedule/ScheduleInteractiveCalendar";
import {
  WhatsAppBroadcastModal,
  type BroadcastModalTarget,
} from "@/components/schedule/WhatsAppBroadcastModal";

type ScheduleViewMode = "card" | "calendar" | "both";

interface OverviewScheduleProps {
  schedules: Schedule[];
}

export function OverviewSchedule({ schedules }: OverviewScheduleProps) {
  const [, setTick] = useState(0);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("both");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isCustomDateSelected, setIsCustomDateSelected] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastModalTarget | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fatisda_schedule_view_mode");
      if (saved === "card" || saved === "calendar" || saved === "both") {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  function handleChangeViewMode(mode: ScheduleViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem("fatisda_schedule_view_mode", mode);
    } catch {}
  }

  // Update timer setiap 30 detik agar kalkulasi jam kuliah tetap presisi secara real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const result = getNextSchedules(schedules);
  const liveStatus = getCurrentLiveClassStatus(schedules);

  const selectedWeekday = useMemo(() => {
    const jsDay = selectedDate.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, [selectedDate]);

  const activeDayNum = isCustomDateSelected ? selectedWeekday : result.day;

  const visibleSchedules = useMemo(() => {
    if (isCustomDateSelected) {
      return sortSchedules(schedules.filter((s) => s.day === selectedWeekday));
    }
    return result.schedules.slice(0, 4);
  }, [isCustomDateSelected, schedules, selectedWeekday, result.schedules]);

  const dayLabel = isCustomDateSelected
    ? selectedDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : getDayLabel(result.day);

  return (
    <>
      <section className="w-full max-w-full min-w-0 rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <h2 className="truncate font-bold text-liquid-text dark:text-slate-100">
                {isCustomDateSelected ? "Jadwal Tanggal Pilihan" : result.isToday ? "Jadwal Hari Ini" : "Jadwal Berikutnya"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">{dayLabel}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher: Card | Calendar | Both */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 p-0.5"
              role="group"
              aria-label="Mode tampilan jadwal"
            >
              <button
                type="button"
                onClick={() => handleChangeViewMode("card")}
                title="Hanya Card Jadwal"
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                  viewMode === "card"
                    ? "bg-white dark:bg-slate-700 text-liquid-accent dark:text-sky-300 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <LayoutList className="h-3 w-3" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeViewMode("calendar")}
                title="Hanya Kalender Interaktif"
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                  viewMode === "calendar"
                    ? "bg-white dark:bg-slate-700 text-liquid-accent dark:text-sky-300 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeViewMode("both")}
                title="Tampilkan Kalender & Card"
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                  viewMode === "both"
                    ? "bg-white dark:bg-slate-700 text-liquid-accent dark:text-sky-300 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Columns2 className="h-3 w-3" />
                <span>Keduanya</span>
              </button>
            </div>

            <Link
              href="/dashboard/schedule"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span className="hidden sm:inline">Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 space-y-4">
          {/* Interactive Calendar Widget */}
          {(viewMode === "calendar" || viewMode === "both") && (
            <ScheduleInteractiveCalendar
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setIsCustomDateSelected(true);
              }}
              onResetToday={() => {
                setSelectedDate(new Date());
                setIsCustomDateSelected(false);
              }}
              isCustomDateSelected={isCustomDateSelected}
            />
          )}

          {/* Card List Section */}
          {(viewMode === "card" || viewMode === "both") && (
            <div>
              {/* Banner Status Kuliah Real-Time */}
              {liveStatus.state === "ONGOING" && (
                <div className="mb-4 flex flex-col gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                    <span className="truncate font-semibold">
                      Sedang Berlangsung:{" "}
                      {liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name}
                    </span>
                  </div>
                  <span className="shrink-0 pl-4 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 sm:pl-2">
                    Sisa {liveStatus.minutesRemaining} menit
                  </span>
                </div>
              )}

              {liveStatus.state === "UPCOMING_SOON" && (
                <div className="mb-4 flex flex-col gap-1.5 rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                    <span className="truncate font-semibold">
                      Kuliah Berikutnya:{" "}
                      {liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name}
                    </span>
                  </div>
                  <span className="shrink-0 pl-5 text-[11px] font-medium text-sky-700 dark:text-sky-400 sm:pl-2">
                    {liveStatus.minutesUntilStart < 60
                      ? `Dalam ${liveStatus.minutesUntilStart} menit`
                      : `Pukul ${liveStatus.schedule.startTime}`}
                  </span>
                </div>
              )}

              {visibleSchedules.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />

                  <p className="mt-3 text-sm font-semibold text-liquid-text dark:text-slate-100">
                    {isCustomDateSelected ? "Tidak ada kuliah pada tanggal ini" : "Belum ada jadwal"}
                  </p>

                  <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
                    {isCustomDateSelected
                      ? "Pilih tanggal lain di kalender yang memiliki titik biru untuk melihat jadwal."
                      : "Jadwal kuliah belum tersedia untuk profil kamu."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleSchedules.map((schedule) => {
                    const isCurrentClass =
                      !isCustomDateSelected &&
                      liveStatus.state === "ONGOING" &&
                      schedule.id === liveStatus.schedule.id;
                    const cName =
                      schedule.courseName ?? schedule.course?.name ?? "Mata kuliah";

                    return (
                      <div
                        key={schedule.id}
                        className={`flex gap-3.5 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4 ${
                          isCurrentClass
                            ? "border-emerald-300 bg-emerald-50/20 shadow-2xs dark:border-emerald-700/80 dark:bg-emerald-950/20"
                            : "border-slate-100 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="w-14 shrink-0 sm:w-16">
                          <p
                            className={`text-sm font-bold ${
                              isCurrentClass
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-liquid-text dark:text-slate-100"
                            }`}
                          >
                            {schedule.startTime}
                          </p>
                          <p className="mt-0.5 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                            {schedule.endTime}
                          </p>
                        </div>

                        <div className="min-w-0 flex-1 border-l border-slate-100 pl-3.5 dark:border-slate-800 sm:pl-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-liquid-text dark:text-slate-100">
                              {cName}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {isCurrentClass && (
                                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                  Berlangsung
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setBroadcastTarget({
                                    kind: "single",
                                    mode: "course",
                                    kelas: schedule.kelas || "A",
                                    courseName: cName,
                                    startTime: schedule.startTime,
                                    endTime: schedule.endTime,
                                    room: schedule.room,
                                    lecturer: schedule.lecturer,
                                    dayName: getDayLabel(activeDayNum),
                                    dayNum: schedule.day,
                                  })
                                }
                                title="Salin Reminder WhatsApp"
                                aria-label={`Broadcast WhatsApp ${cName}`}
                                className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              >
                                <MessageSquareShare className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {(schedule.course?.code || schedule.rawClassCode) && (
                            <p className="mt-0.5 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                              {schedule.course?.code ?? schedule.rawClassCode}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {schedule.room && (
                              <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {schedule.room}
                              </span>
                            )}

                            {schedule.lecturer && (
                              <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                                <UserRound className="h-3 w-3 shrink-0" />
                                {schedule.lecturer}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <WhatsAppBroadcastModal
        target={broadcastTarget}
        onClose={() => setBroadcastTarget(null)}
      />
    </>
  );
}

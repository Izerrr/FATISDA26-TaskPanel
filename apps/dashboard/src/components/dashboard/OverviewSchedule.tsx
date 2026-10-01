import { useState, useEffect } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import type { Schedule } from "@/types";
import { getDayLabel, getNextSchedules, getCurrentLiveClassStatus } from "@/lib/schedule-utils";

interface OverviewScheduleProps {
  schedules: Schedule[];
}

export function OverviewSchedule({ schedules }: OverviewScheduleProps) {
  const [, setTick] = useState(0);

  // Update timer setiap 30 detik agar kalkulasi jam kuliah tetap presisi secara real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const result = getNextSchedules(schedules);
  const liveStatus = getCurrentLiveClassStatus(schedules);
  const visibleSchedules = result.schedules.slice(0, 4);

  return (
    <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-glass">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-liquid-text dark:text-slate-100">
              {result.isToday ? "Jadwal Hari Ini" : "Jadwal Berikutnya"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
            {getDayLabel(result.day)}
          </p>
        </div>

        <Link
          href="/dashboard/schedule"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 transition hover:text-blue-700 dark:hover:text-blue-300"
        >
          <span>Lihat semua</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5">
        {/* Banner Status Kuliah Real-Time */}
        {liveStatus.state === "ONGOING" && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold truncate">
                Sedang Berlangsung: {liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name}
              </span>
            </div>
            <span className="font-medium shrink-0 text-[11px] text-emerald-700 dark:text-emerald-400 pl-2">
              Sisa {liveStatus.minutesRemaining} menit
            </span>
          </div>
        )}

        {liveStatus.state === "UPCOMING_SOON" && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 px-3.5 py-2.5 text-xs text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2 min-w-0">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold truncate">
                Kuliah Berikutnya: {liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name}
              </span>
            </div>
            <span className="font-medium shrink-0 text-[11px] text-sky-700 dark:text-sky-400 pl-2">
              {liveStatus.minutesUntilStart < 60
                ? `Dalam ${liveStatus.minutesUntilStart} menit`
                : `Pukul ${liveStatus.schedule.startTime}`}
            </span>
          </div>
        )}
        {visibleSchedules.length === 0 ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />

            <p className="mt-3 text-sm font-semibold text-liquid-text dark:text-slate-100">Belum ada jadwal</p>

            <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">Jadwal kuliah belum tersedia untuk profil kamu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSchedules.map((schedule) => {
              const isCurrentClass = liveStatus.state === "ONGOING" && schedule.id === liveStatus.schedule.id;

              return (
                <div
                  key={schedule.id}
                  className={`flex gap-4 rounded-xl border p-4 transition-colors ${
                    isCurrentClass
                      ? "border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs"
                      : "border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-16 shrink-0">
                    <p className={`text-sm font-bold ${isCurrentClass ? "text-emerald-700 dark:text-emerald-400" : "text-liquid-text dark:text-slate-100"}`}>
                      {schedule.startTime}
                    </p>
                    <p className="mt-0.5 text-[11px] text-liquid-text-secondary dark:text-slate-400">{schedule.endTime}</p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="truncate text-sm font-semibold text-liquid-text dark:text-slate-100">
                        {schedule.courseName ?? schedule.course?.name ?? "Mata kuliah"}
                      </p>
                      {isCurrentClass && (
                        <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                          Berlangsung
                        </span>
                      )}
                    </div>

                    {(schedule.course?.code || schedule.rawClassCode) && (
                      <p className="mt-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                        {schedule.course?.code ?? schedule.rawClassCode}
                      </p>
                    )}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {schedule.room && (
                      <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {schedule.room}
                      </span>
                    )}

                    {schedule.lecturer && (
                      <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                        <Clock3 className="h-3 w-3" />
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
    </section>
  );
}

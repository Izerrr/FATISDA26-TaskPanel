"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function getCurrentDay() {
  const day = new Date().getDay();

  return day === 0 ? 7 : day;
}

function getNextSchedules(schedules: ReturnType<typeof useSchedule>["schedules"]) {
  const now = new Date();
  const currentDay = getCurrentDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const today = schedules
    .filter((schedule) => schedule.day === currentDay)
    .filter((schedule) => {
      const [hour, minute] = schedule.startTime.split(":").map(Number);

      return hour * 60 + minute >= currentTime;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (today.length > 0) {
    return today.slice(0, 3);
  }

  return schedules
    .filter((schedule) => {
      return schedule.day > currentDay;
    })
    .sort((a, b) => {
      if (a.day !== b.day) {
        return a.day - b.day;
      }

      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 3);
}

export function SchedulePreview() {
  const { schedules, isLoading, isError } = useSchedule();

  const upcoming = getNextSchedules(schedules);

  return (
    <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />

            <h2 className="font-bold text-liquid-text">Jadwal Berikutnya</h2>
          </div>

          <p className="mt-1 text-xs text-liquid-text-secondary">Kelas yang akan datang berdasarkan jadwal kamu.</p>
        </div>

        <Link href="/dashboard/schedule" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <>
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          </>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-600">Gagal memuat jadwal.</div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-5 text-sm text-liquid-text-secondary">Tidak ada jadwal kuliah berikutnya.</div>
        ) : (
          upcoming.map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <span className="text-[9px] font-semibold uppercase">{DAY_NAMES[schedule.day]?.slice(0, 3)}</span>

                <Clock3 className="mt-0.5 h-3.5 w-3.5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-liquid-text">{schedule.course?.name ?? "Mata kuliah"}</p>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-liquid-text-secondary">
                  <span>
                    {schedule.startTime}–{schedule.endTime}
                  </span>

                  {schedule.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {schedule.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

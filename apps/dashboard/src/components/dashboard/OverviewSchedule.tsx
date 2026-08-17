"use client";

import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import type { Schedule } from "@/types";
import { getDayLabel, getNextSchedules } from "@/lib/schedule-utils";

interface OverviewScheduleProps {
  schedules: Schedule[];
}

export function OverviewSchedule({ schedules }: OverviewScheduleProps) {
  const result = getNextSchedules(schedules);

  const visibleSchedules = result.schedules.slice(0, 4);

  return (
    <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />

            <h2 className="font-bold text-liquid-text">{result.isToday ? "Jadwal Hari Ini" : "Jadwal Berikutnya"}</h2>
          </div>

          <p className="mt-1 text-xs text-liquid-text-secondary">{getDayLabel(result.day)}</p>
        </div>

        <Link href="/dashboard/schedule" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700">
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5">
        {visibleSchedules.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-liquid-text">Belum ada jadwal</p>

            <p className="mt-1 text-xs text-liquid-text-secondary">Jadwal kuliah belum tersedia untuk profil kamu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSchedules.map((schedule) => (
              <div key={schedule.id} className="flex gap-4 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70">
                <div className="w-16 shrink-0">
                  <p className="text-sm font-bold text-liquid-text">{schedule.startTime}</p>

                  <p className="mt-0.5 text-[11px] text-liquid-text-secondary">{schedule.endTime}</p>
                </div>

                <div className="min-w-0 flex-1 border-l border-slate-100 pl-4">
                  <p className="truncate text-sm font-semibold text-liquid-text">{schedule.course?.name ?? "Mata kuliah"}</p>

                  {schedule.course?.code && <p className="mt-1 text-[11px] text-liquid-text-secondary">{schedule.course.code}</p>}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {schedule.room && (
                      <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary">
                        <MapPin className="h-3 w-3" />
                        {schedule.room}
                      </span>
                    )}

                    {schedule.lecturer && (
                      <span className="flex items-center gap-1 text-[11px] text-liquid-text-secondary">
                        <Clock3 className="h-3 w-3" />
                        {schedule.lecturer}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

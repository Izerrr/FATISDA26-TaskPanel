"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { useSchedule } from "@/hooks/useSchedule";
import { useRole } from "@/hooks/useRole";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ScheduleSyncPanel } from "@/components/schedule/ScheduleSyncPanel";

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

function getProdiLabel(prodi: string | null | undefined) {
  switch (prodi) {
    case "INFORMATIKA":
      return "Informatika";

    case "SAINS_DATA":
      return "Sains Data";

    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "Informatika PSDKU Kebumen";

    default:
      return null;
  }
}

export default function SchedulePage() {
  const { schedules, isLoading, isError } = useSchedule();

  const { user } = useRole();

  const today = new Date().getDay() || 7;

  const [selectedDay, setSelectedDay] = useState(today >= 1 && today <= 7 ? today : 1);

  const selectedSchedules = useMemo(() => {
    return schedules.filter((schedule) => schedule.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDay]);

  const prodiLabel = getProdiLabel(user?.prodi);

  const isAdmin = user?.roles?.includes("ADMIN");

  return (
    <DashboardFrame>
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />

            <h1 className="text-xl font-bold text-liquid-text">Jadwal</h1>
          </div>

          <p className="mt-1 text-sm text-liquid-text-secondary">Jadwal kuliah berdasarkan program studi dan kelas kamu.</p>

          {(prodiLabel || user?.kelas) && (
            <p className="mt-2 text-xs font-medium text-liquid-text-secondary">
              {prodiLabel}
              {user?.kelas ? ` · Kelas ${user.kelas}` : ""}
            </p>
          )}
        </section>

        {isAdmin && user?.prodi && user?.kelas && <ScheduleSyncPanel />}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setSelectedDay(day.value)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${selectedDay === day.value ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {day.label}
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-liquid-border bg-white p-5 shadow-glass">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : isError ? (
            <div className="rounded-xl bg-red-50 p-5 text-sm text-red-600">Gagal memuat jadwal.</div>
          ) : selectedSchedules.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-liquid-text">Tidak ada kelas</p>

              <p className="mt-1 text-xs text-liquid-text-secondary">Tidak ada jadwal kuliah untuk hari ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSchedules.map((schedule) => (
                <div key={schedule.id} className="flex gap-4 rounded-xl border border-slate-100 p-4">
                  <div className="w-20 shrink-0">
                    <p className="text-sm font-bold text-liquid-text">{schedule.startTime}</p>

                    <p className="mt-1 text-[11px] text-liquid-text-secondary">{schedule.endTime}</p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-slate-100 pl-4">
                    <p className="text-sm font-semibold text-liquid-text">{schedule.courseName ?? schedule.course?.name ?? "Mata kuliah"}</p>

                    {schedule.course?.code && <p className="mt-1 text-[11px] text-liquid-text-secondary">{schedule.course.code}</p>}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-liquid-text-secondary">
                      {schedule.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {schedule.room}
                        </span>
                      )}

                      {schedule.lecturer && (
                        <span className="flex items-center gap-1">
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
        </section>
      </div>
    </DashboardFrame>
  );
}

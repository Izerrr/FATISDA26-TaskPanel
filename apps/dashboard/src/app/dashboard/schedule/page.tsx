"use client";

import { useMemo, useState } from "react";
import { Calendar, CalendarDays, Clock3, MapPin } from "lucide-react";

import { useSchedule } from "@/hooks/useSchedule";
import { useRole } from "@/hooks/useRole";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ScheduleSyncPanel } from "@/components/schedule/ScheduleSyncPanel";
import { ScheduleExportModal } from "@/components/schedule/ScheduleExportModal";

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

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SchedulePage() {
  const { user } = useRole();

  const [selectedSemester, setSelectedSemester] = useState<number>(user?.semester ?? 2);

  const { schedules, isLoading, isError } = useSchedule({
    semester: selectedSemester,
  });

  const today = new Date().getDay() || 7;
  const [selectedDay, setSelectedDay] = useState(today >= 1 && today <= 7 ? today : 1);

  const selectedSchedules = useMemo(() => {
    return schedules.filter((schedule) => schedule.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDay]);

  const prodiLabel = getProdiLabel(user?.prodi);
  const isAdmin = user?.roles?.includes("ADMIN");

  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Header with Title & Actions */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-liquid-accent" />
              <h1 className="text-xl font-bold text-liquid-text">Jadwal Kuliah</h1>
            </div>
            <p className="mt-1 text-sm text-liquid-text-secondary">Jadwal perkuliahan mingguan per program studi, kelas, dan semester.</p>
            {(prodiLabel || user?.kelas) && (
              <p className="mt-1.5 text-xs font-medium text-liquid-text-secondary">
                {prodiLabel}
                {user?.kelas ? ` · Kelas ${user.kelas}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export Button */}
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-liquid-border bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Calendar className="h-4 w-4 text-liquid-accent" />
              <span>Ekspor Kalender</span>
            </button>

            {/* Semester Selector */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-liquid-border bg-white p-1.5 shadow-sm">
              <span className="px-2 text-xs font-semibold text-liquid-text-tertiary">Semester</span>
              <div className="flex gap-1 overflow-x-auto">
                {SEMESTERS.map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`h-7 w-7 rounded-xl text-xs font-bold transition ${selectedSemester === sem ? "bg-liquid-accent text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Export Modal */}
        <ScheduleExportModal open={exportModalOpen} schedules={schedules} semester={selectedSemester} kelas={user?.kelas} onClose={() => setExportModalOpen(false)} />

        {isAdmin && user?.prodi && user?.kelas && <ScheduleSyncPanel />}

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const isToday = day.value === today;
            const isSelected = selectedDay === day.value;

            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`relative shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${isSelected ? "bg-liquid-accent text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {day.label}
                {isToday && <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-liquid-accent"}`} />}
              </button>
            );
          })}
        </div>

        {/* Schedule List / Card */}
        <section className="rounded-2xl border border-liquid-border bg-white p-5 shadow-glass">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-slate-100 p-4">
                  <div className="w-20 shrink-0 space-y-2">
                    <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-10 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="min-w-0 flex-1 border-l border-slate-100 pl-4 space-y-2">
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="flex gap-3 pt-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">Gagal memuat jadwal untuk semester ini.</div>
          ) : selectedSchedules.length === 0 ? (
            <div className="rounded-xl bg-slate-50/80 p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-liquid-text">Tidak ada kelas</p>
              <p className="mt-1 text-xs text-liquid-text-secondary">
                Tidak ada jadwal kuliah untuk hari {DAYS.find((d) => d.value === selectedDay)?.label} di Semester {selectedSemester}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSchedules.map((schedule) => (
                <div key={schedule.id} className="group flex gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm">
                  <div className="w-20 shrink-0">
                    <p className="text-sm font-bold text-liquid-text">{schedule.startTime}</p>
                    <p className="mt-1 text-[11px] text-liquid-text-secondary">{schedule.endTime}</p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-slate-100 pl-4">
                    <p className="text-sm font-semibold text-liquid-text group-hover:text-liquid-accent transition-colors">{schedule.courseName ?? schedule.course?.name ?? "Mata kuliah"}</p>

                    {schedule.course?.code && <p className="mt-0.5 text-[11px] font-medium text-liquid-text-secondary">{schedule.course.code}</p>}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-liquid-text-secondary">
                      {schedule.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {schedule.room}
                        </span>
                      )}

                      {schedule.lecturer && (
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-slate-400" />
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

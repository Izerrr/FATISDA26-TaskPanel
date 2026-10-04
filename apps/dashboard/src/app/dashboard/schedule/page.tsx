"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CalendarDays, MapPin, Sparkles, Table, UserRound } from "lucide-react";

import { useSchedule } from "@/hooks/useSchedule";
import { useRole } from "@/hooks/useRole";
import { getTodayDay, sortSchedules } from "@/lib/schedule-utils";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ScheduleSyncPanel } from "@/components/schedule/ScheduleSyncPanel";
import { ScheduleExportModal } from "@/components/schedule/ScheduleExportModal";
import { ScheduleAiMatcher } from "@/components/schedule/ScheduleAiMatcher";

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

const AGAMA_OPTIONS = [
  { value: "islam", label: "Islam" },
  { value: "kristen", label: "Kristen" },
  { value: "katholik", label: "Katholik" },
  { value: "budha", label: "Budha" },
  { value: "semua", label: "Semua" },
];

export default function SchedulePage() {
  const { user } = useRole();

  const [selectedSemester, setSelectedSemester] = useState<number>(user?.semester ?? 1);
  const [selectedAgama, setSelectedAgama] = useState<string>("islam");

  useEffect(() => {
    if (user?.semester) {
      setSelectedSemester(user.semester);
    }
  }, [user?.semester]);

  const { schedules, isLoading, isError } = useSchedule({
    semester: selectedSemester,
    agama: selectedAgama,
  });

  const today = getTodayDay();
  const [selectedDay, setSelectedDay] = useState(today);

  const selectedSchedules = useMemo(() => {
    return sortSchedules(schedules.filter((schedule) => schedule.day === selectedDay));
  }, [schedules, selectedDay]);

  const prodiLabel = getProdiLabel(user?.prodi);
  const isAdmin = user?.roles?.includes("ADMIN");

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showAiMatcher, setShowAiMatcher] = useState(false);

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Navigation Bar between Personal, Grand, and AI */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-liquid-border dark:border-slate-800 pb-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-liquid-accent/10 px-3.5 py-2.5 sm:py-2 text-xs font-bold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>
                Jadwal Saya<span className="hidden sm:inline"> (Personal)</span>
              </span>
            </div>

            <Link
              href="/dashboard/schedule/grand"
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Table className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span>
                Grand<span className="hidden sm:inline"> Spreadsheet (Semua Prodi)</span>
              </span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setShowAiMatcher(!showAiMatcher)}
            className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 sm:py-2 text-xs font-bold transition shadow-sm ${
              showAiMatcher
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-500/20"
                : "border border-sky-300/80 bg-sky-50/80 text-sky-700 hover:bg-sky-100/80 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{showAiMatcher ? "Tutup AI Matcher" : "AI Matcher & Jam Kosong"}</span>
          </button>
        </div>

        {/* AI Matcher Panel (Expandable) */}
        {showAiMatcher && <ScheduleAiMatcher defaultProdi={user?.prodi || "INFORMATIKA"} defaultSemester={selectedSemester} onClose={() => setShowAiMatcher(false)} />}

        {/* Header with Title & Actions */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-liquid-accent" />
              <h1 className="text-xl font-bold text-liquid-text dark:text-slate-100">Jadwal Kuliah</h1>
            </div>
            <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Jadwal perkuliahan mingguan per program studi, kelas, dan semester.</p>
            {(prodiLabel || user?.kelas) && (
              <p className="mt-1.5 text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                {prodiLabel}
                {user?.kelas ? ` · Kelas ${user.kelas}` : ""}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {/* Export Button */}
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <Calendar className="h-4 w-4 text-liquid-accent" />
              <span>Ekspor Kalender</span>
            </button>

            {/* Agama Selector */}
            <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
              <span className="shrink-0 px-2 text-xs font-semibold text-liquid-text-tertiary dark:text-slate-400">Agama</span>
              <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto">
                {AGAMA_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedAgama(item.value)}
                    className={`h-8 shrink-0 whitespace-nowrap rounded-xl px-2.5 text-xs font-semibold transition ${selectedAgama === item.value ? "bg-liquid-accent text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester Selector */}
            <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
              <span className="shrink-0 px-2 text-xs font-semibold text-liquid-text-tertiary dark:text-slate-400">
                <span className="sm:hidden">Smt</span>
                <span className="hidden sm:inline">Semester</span>
              </span>
              <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto">
                {SEMESTERS.map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`h-8 w-8 shrink-0 rounded-xl text-xs font-bold transition ${selectedSemester === sem ? "bg-liquid-accent text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"}`}
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
                className={`relative shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  isSelected ? "bg-liquid-accent text-white shadow-sm" : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {day.label}
                {isToday && <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-liquid-accent"}`} />}
              </button>
            );
          })}
        </div>

        {/* Schedule List / Card */}
        <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-glass">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                  <div className="w-20 shrink-0 space-y-2">
                    <div className="h-4 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-10 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                  </div>
                  <div className="min-w-0 flex-1 border-l border-slate-100 dark:border-slate-800 pl-4 space-y-2">
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                    <div className="flex gap-3 pt-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-5 text-sm font-medium text-red-600 dark:text-red-400">Gagal memuat jadwal untuk semester ini.</div>
          ) : selectedSchedules.length === 0 ? (
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-liquid-text dark:text-slate-100">Tidak ada kelas</p>
              <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
                Tidak ada jadwal kuliah untuk hari {DAYS.find((d) => d.value === selectedDay)?.label} di Semester {selectedSemester}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSchedules.map((schedule) => (
                <div key={schedule.id} className="group flex gap-3 sm:gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 sm:p-4 transition hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm">
                  <div className="w-16 sm:w-20 shrink-0">
                    <p className="text-sm font-bold text-liquid-text dark:text-slate-100">{schedule.startTime}</p>
                    <p className="mt-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">{schedule.endTime}</p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-slate-100 dark:border-slate-800 pl-3 sm:pl-4">
                    <p className="text-sm font-semibold text-liquid-text dark:text-slate-100 group-hover:text-liquid-accent dark:group-hover:text-sky-400 transition-colors">{schedule.courseName ?? schedule.course?.name ?? "Mata kuliah"}</p>

                    {schedule.course?.code && <p className="mt-0.5 text-[11px] font-medium text-liquid-text-secondary dark:text-slate-400">{schedule.course.code}</p>}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                      {schedule.room && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{schedule.room}</span>
                        </span>
                      )}

                      {schedule.lecturer && (
                        <span className="flex min-w-0 items-center gap-1">
                          <UserRound className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{schedule.lecturer}</span>
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

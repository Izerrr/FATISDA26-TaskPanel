"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, GraduationCap, AlertCircle } from "lucide-react";
import type { ExamSchedule, Prodi } from "@/types";
import { formatExamDuration } from "@/lib/schedule/exam/constants";
import { useExamSchedule } from "@/hooks/useExamSchedule";
import { useRole } from "@/hooks/useRole";

interface OverviewExamProps {
  semester?: number | null;
  kelas?: string | null;
  prodi?: Prodi | null;
}

const AGAMA_OPTIONS = [
  { value: "islam", label: "Islam" },
  { value: "kristen", label: "Kristen" },
  { value: "katholik", label: "Katholik" },
  { value: "budha", label: "Budha" },
];

export function OverviewExam({ semester, kelas, prodi }: OverviewExamProps) {
  const { user } = useRole();
  const currentSemester = semester ?? user?.semester ?? 1;
  const currentKelas = kelas ?? user?.kelas ?? "A";
  const currentProdi: Prodi = prodi ?? user?.prodi ?? "INFORMATIKA";

  const [selectedAgama, setSelectedAgama] = useState<string>("islam");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fatisda_agama_preference");
      if (saved) setSelectedAgama(saved);

      const handleStorageUpdate = () => {
        const updated = localStorage.getItem("fatisda_agama_preference");
        if (updated) setSelectedAgama(updated);
      };
      window.addEventListener("fatisda_agama_change", handleStorageUpdate);
      return () => window.removeEventListener("fatisda_agama_change", handleStorageUpdate);
    }
  }, []);

  const handleAgamaChange = (val: string) => {
    setSelectedAgama(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("fatisda_agama_preference", val);
      window.dispatchEvent(new Event("fatisda_agama_change"));
    }
  };

  const { exams, isLoading, isError } = useExamSchedule({
    prodi: currentProdi,
    semester: currentSemester,
    kelas: currentKelas,
    type: "UTS",
    agama: selectedAgama,
  });

  const now = new Date();

  // Sort and find upcoming exams
  const upcomingExams = useMemo(() => {
    return [...exams].map((exam) => {
      // Calculate exam datetime
      const examDate = new Date(exam.date);
      const [h, m] = exam.startTime.split(/[:.]/).map(Number);
      const startDateTime = new Date(examDate);
      startDateTime.setHours(h || 0, m || 0, 0, 0);

      const [endH, endM] = exam.endTime.split(/[:.]/).map(Number);
      const endDateTime = new Date(examDate);
      endDateTime.setHours(endH || 0, endM || 0, 0, 0);

      const diffMs = startDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

      const isToday = now.toDateString() === examDate.toDateString();
      const isPast = endDateTime.getTime() < now.getTime();
      const isOngoing = now >= startDateTime && now <= endDateTime;

      return {
        ...exam,
        startDateTime,
        endDateTime,
        diffDays,
        diffHours,
        isToday,
        isPast,
        isOngoing,
      };
    });
  }, [exams, now]);

  // Sort list chronologically by weekday starting from Senin (1 = Senin .. 7 = Minggu)
  const sortedExams = useMemo(() => {
    return [...upcomingExams].sort((a, b) => {
      const dayDiff = a.dayNum - b.dayNum;
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [upcomingExams]);

  // Find nearest upcoming exam in chronological real-time order for the countdown hero
  const nextExam = useMemo(() => {
    return [...upcomingExams]
      .filter((e) => !e.isPast)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())[0];
  }, [upcomingExams]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-glass animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          <div className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || exams.length === 0) {
    return null; // If no exams or error, silently hide or display minimal banner
  }

  return (
    <section className="rounded-2xl border border-liquid-border/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-glass">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-liquid-text dark:text-slate-100">
                Jadwal Ujian Tengah Semester (UTS)
              </h2>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Gasal 2026
              </span>
            </div>
            <p className="text-xs text-liquid-text-secondary dark:text-slate-400 mt-0.5">
              Semester {currentSemester} · Kelas {currentKelas} · Agama {AGAMA_OPTIONS.find((a) => a.value === selectedAgama)?.label ?? selectedAgama} ({exams.length} mata kuliah)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {/* Compact Agama Selector Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            {AGAMA_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleAgamaChange(item.value)}
                className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold transition ${
                  selectedAgama === item.value
                    ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard/schedule/exam"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition"
          >
            <span>Buka Jadwal Lengkap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero: Next Exam Countdown Banner */}
      {nextExam ? (
        <div className="mt-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:from-amber-950/40 dark:via-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  {nextExam.isOngoing
                    ? "SEDANG BERLANGSUNG SEKARANG"
                    : nextExam.isToday
                    ? "UJIAN HARI INI"
                    : nextExam.diffDays === 1
                    ? "UJIAN BESOK"
                    : `UJIAN BERIKUTNYA (${nextExam.diffDays} HARI LAGI)`}
                </span>
              </div>
              <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {nextExam.courseName}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  {nextExam.dayName}, {nextExam.dateStr}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  {nextExam.startTime} - {nextExam.endTime} WIB
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Ruang: {nextExam.room}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <Link
                href="/dashboard/schedule/exam"
                className="w-full sm:w-auto text-center rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
              >
                Lihat Ruangan &amp; Sesi
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <span>🎉 Semua sesi ujian UTS semester ini telah selesai! Selamat beristirahat.</span>
        </div>
      )}

      {/* Compact List of Upcoming Exams */}
      <div className="mt-4 space-y-2.5">
        <div className="text-xs font-semibold text-liquid-text-secondary dark:text-slate-400">
          Agenda Sesi UTS Kelas {currentKelas}:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sortedExams.slice(0, 6).map((exam) => (
            <div
              key={exam.id}
              className={`rounded-xl border p-3 transition-colors ${
                exam.isOngoing
                  ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/40 ring-1 ring-amber-400"
                  : exam.isPast
                  ? "border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-800/30 opacity-60"
                  : "border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-liquid-text dark:text-slate-100 truncate">
                    {exam.courseName}
                  </p>
                  <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400 mt-0.5">
                    {exam.dayName}, {exam.dateStr}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {formatExamDuration(exam.startTime, exam.endTime)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/70 dark:border-slate-800/70">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                  <MapPin className="h-3 w-3 text-amber-500" />
                  {exam.room}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {exam.startTime} - {exam.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

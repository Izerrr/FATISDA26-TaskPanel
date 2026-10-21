"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  GraduationCap,
  MapPin,
  MessageSquareShare,
} from "lucide-react";
import type { Prodi } from "@/types";
import { formatExamDuration } from "@/lib/schedule/exam/constants";
import { useExamSchedule } from "@/hooks/useExamSchedule";
import { useExamMode } from "@/hooks/useExamMode";
import { useRole } from "@/hooks/useRole";
import { RoomLocationBadge } from "@/components/schedule/RoomLocationBadge";
import {
  WhatsAppBroadcastModal,
  type BroadcastModalTarget,
} from "@/components/schedule/WhatsAppBroadcastModal";

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
  const { examMode, isLoading: modeLoading } = useExamMode();

  const currentSemester = semester ?? user?.semester ?? 1;
  const currentKelas = kelas ?? user?.kelas ?? "A";
  const currentProdi: Prodi = prodi ?? user?.prodi ?? "INFORMATIKA";

  const [selectedAgama, setSelectedAgama] = useState<string>("islam");
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastModalTarget | null>(null);

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

  const activeExamType = examMode.activeType ?? "UTS";

  const { exams, isLoading, isError } = useExamSchedule({
    prodi: currentProdi,
    semester: currentSemester,
    kelas: currentKelas,
    type: activeExamType,
    agama: selectedAgama,
  });

  const now = new Date();

  const upcomingExams = useMemo(() => {
    return [...exams].map((exam) => {
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

  const sortedExams = useMemo(() => {
    return [...upcomingExams].sort((a, b) => {
      const dateDiff = a.startDateTime.getTime() - b.startDateTime.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [upcomingExams]);

  const nextExam = useMemo(() => {
    return [...upcomingExams]
      .filter((e) => !e.isPast)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())[0];
  }, [upcomingExams]);

  // If Admin disabled Exam Mode, hide completely
  if (!modeLoading && !examMode.enabled) {
    return null;
  }

  if (isLoading || modeLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-liquid-border bg-white p-5 shadow-glass dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mb-3 h-16 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        <div className="space-y-2">
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
        </div>
      </div>
    );
  }

  if (isError || exams.length === 0) {
    return null;
  }

  const fullExamTitle =
    activeExamType === "UAS"
      ? "Jadwal Ujian Akhir Semester (UAS)"
      : "Jadwal Ujian Tengah Semester (UTS)";

  return (
    <>
      <section className="w-full max-w-full min-w-0 rounded-2xl border border-liquid-border/80 bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {/* Header */}
        <div className="flex w-full max-w-full min-w-0 flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-liquid-text dark:text-slate-100 sm:text-base">
                  {fullExamTitle}
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  {examMode.semesterLabel || "Semester Genap 2025/2026"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-liquid-text-secondary dark:text-slate-400">
                Semester {currentSemester} · Kelas {currentKelas} · Agama{" "}
                {AGAMA_OPTIONS.find((a) => a.value === selectedAgama)?.label ?? selectedAgama} (
                {exams.length} mata kuliah)
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-full min-w-0 flex-wrap items-center justify-between gap-2.5 sm:w-auto sm:justify-end">
            {/* Compact Scrollable Agama Selector Pills */}
            <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/60 bg-slate-100 p-0.5 dark:border-slate-700/60 dark:bg-slate-800">
              {AGAMA_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleAgamaChange(item.value)}
                  className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold transition sm:text-[11px] ${
                    selectedAgama === item.value
                      ? "bg-white font-bold text-amber-700 shadow-2xs dark:bg-slate-900 dark:text-amber-300"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Link
              href="/dashboard/schedule/exam"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600 transition hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <span>Jadwal Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Hero: Next Exam Countdown Banner */}
        {nextExam ? (
          <div className="mt-4 w-full max-w-full min-w-0 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-amber-950/20 sm:p-4">
            <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
                  <span className="truncate">
                    {nextExam.isOngoing
                      ? "SEDANG BERLANGSUNG SEKARANG"
                      : nextExam.isToday
                        ? "UJIAN HARI INI"
                        : nextExam.diffDays === 1
                          ? "UJIAN BESOK"
                          : `UJIAN BERIKUTNYA (${nextExam.diffDays} HARI LAGI)`}
                  </span>
                </div>
                <h3 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                  {nextExam.courseName}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    {nextExam.dayName}, {nextExam.dateStr}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    {nextExam.startTime} - {nextExam.endTime} WIB
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    Ruang: {nextExam.room}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    setBroadcastTarget({
                      kind: "single",
                      mode: "exam",
                      examType: activeExamType,
                      kelas: currentKelas,
                      courseName: nextExam.courseName,
                      startTime: nextExam.startTime,
                      endTime: nextExam.endTime,
                      room: nextExam.room,
                      dayName: nextExam.dayName,
                      dayNum: nextExam.dayNum,
                      dateStr: nextExam.dateStr,
                      date: nextExam.date,
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                >
                  <MessageSquareShare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Broadcast WA</span>
                </button>

                <Link
                  href="/dashboard/schedule/exam"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-center text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
                >
                  <span className="truncate">Lihat Sesi</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <span>
              🎉 Semua sesi ujian {activeExamType} semester ini telah selesai! Selamat
              beristirahat.
            </span>
          </div>
        )}

        {/* Compact List of Upcoming Exams */}
        <div className="mt-4 space-y-2.5">
          <div className="text-xs font-semibold text-liquid-text-secondary dark:text-slate-400">
            Agenda Sesi {activeExamType} Kelas {currentKelas}:
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {sortedExams.slice(0, 6).map((exam) => (
              <div
                key={exam.id}
                className={`rounded-xl border p-3 transition-colors ${
                  exam.isOngoing
                    ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-400 dark:border-amber-800 dark:bg-amber-950/40"
                    : exam.isPast
                      ? "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-800/80 dark:bg-slate-800/30"
                      : "border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-liquid-text dark:text-slate-100">
                      {exam.courseName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-liquid-text-secondary dark:text-slate-400">
                      {exam.dayName}, {exam.dateStr}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {formatExamDuration(exam.startTime, exam.endTime)}
                  </span>
                </div>

                {/* Anti-collision room & time footer */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/70 pt-1.5 text-[11px] dark:border-slate-800/70">
                  <RoomLocationBadge room={exam.room} variant="amber" compact />
                  <span className="shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {exam.startTime} - {exam.endTime} WIB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppBroadcastModal
        target={broadcastTarget}
        onClose={() => setBroadcastTarget(null)}
      />
    </>
  );
}

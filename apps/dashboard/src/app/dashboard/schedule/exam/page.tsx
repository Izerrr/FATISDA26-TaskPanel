"use client";

import { AGAMA_OPTIONS } from "@/lib/schedule/constants";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownCircle,
  Calendar,
  CalendarDays,
  Clock,
  Download,
  GraduationCap,
  MessageSquareShare,
  RefreshCw,
  Search,
  Settings2,
  Table,
  UserCheck,
  WifiOff,
} from "lucide-react";

import { useRole } from "@/hooks/useRole";
import { useExamSchedule } from "@/hooks/useExamSchedule";
import { useExamMode } from "@/hooks/useExamMode";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ExamScheduleSyncPanel } from "@/components/schedule/ExamScheduleSyncPanel";
import { RoomLocationBadge } from "@/components/schedule/RoomLocationBadge";
import {
  WhatsAppBroadcastModal,
  type BroadcastModalTarget,
} from "@/components/schedule/WhatsAppBroadcastModal";
import { formatExamDuration } from "@/lib/schedule/exam/constants";
import type { ExamSchedule, ExamType, Kelas, Prodi } from "@/types";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const KELAS_OPTIONS: Kelas[] = ["A", "B", "C", "D"];


function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(/[:.]/).map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function ExamSchedulePage() {
  const { user } = useRole();
  const { examMode } = useExamMode();

  const [activeType, setActiveType] = useState<ExamType>("UTS");
  const [hasSyncedTypeFromSetting, setHasSyncedTypeFromSetting] = useState(false);
  const [viewScope, setViewScope] = useState<"personal" | "all">("personal");
  const [selectedSemester, setSelectedSemester] = useState<string>(
    user?.semester ? String(user.semester) : "1",
  );
  const [selectedKelas, setSelectedKelas] = useState<string>(user?.kelas ?? "A");
  const [selectedAgama, setSelectedAgama] = useState<string>("islam");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastModalTarget | null>(null);
  const [, setTick] = useState(0);

  // Sync initial activeType with Admin Exam Mode setting
  useEffect(() => {
    if (!hasSyncedTypeFromSetting && examMode?.activeType) {
      setActiveType(examMode.activeType);
      setHasSyncedTypeFromSetting(true);
    }
  }, [examMode?.activeType, hasSyncedTypeFromSetting]);

  // Refresh live countdown every 30s
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.semester) setSelectedSemester(String(user.semester));
    if (user?.kelas) setSelectedKelas(user.kelas);
  }, [user?.semester, user?.kelas]);

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

  const prodi: Prodi = user?.prodi ?? "INFORMATIKA";
  const isAdmin = user?.roles?.some((r) => ["ADMIN", "OWNER"].includes(r));

  const querySemester =
    viewScope === "personal"
      ? (user?.semester ?? 1)
      : selectedSemester === "all"
        ? null
        : parseInt(selectedSemester, 10);
  const queryKelas =
    viewScope === "personal"
      ? (user?.kelas ?? "A")
      : selectedKelas === "all"
        ? null
        : selectedKelas;

  const { exams, isLoading, isOfflineCache, mutate } = useExamSchedule({
    prodi,
    semester: querySemester,
    kelas: queryKelas,
    type: activeType,
    agama: selectedAgama,
  });

  const now = new Date();

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exams;

    return exams.filter(
      (e) =>
        e.courseName.toLowerCase().includes(q) ||
        e.room.toLowerCase().includes(q) ||
        e.dayName.toLowerCase().includes(q) ||
        e.dateStr.toLowerCase().includes(q),
    );
  }, [exams, searchQuery]);

  // Group filtered exams by calendar date chronologically
  const groupedByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        idSlug: string;
        date: Date;
        dateStr: string;
        dayName: string;
        dayNum: number;
        list: ExamSchedule[];
      }
    >();

    filteredExams.forEach((exam) => {
      const key = `${exam.dayName}-${exam.dateStr}`;
      if (!map.has(key)) {
        map.set(key, {
          idSlug: `exam-day-${exam.dateStr.replace(/\s+/g, "-").toLowerCase()}`,
          date: new Date(exam.date),
          dateStr: exam.dateStr,
          dayName: exam.dayName,
          dayNum: exam.dayNum,
          list: [],
        });
      }
      map.get(key)!.list.push(exam);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((g) => ({
        ...g,
        list: [...g.list].sort((a, b) => {
          const timeDiff = a.startTime.localeCompare(b.startTime);
          if (timeDiff !== 0) return timeDiff;
          return a.kelas.localeCompare(b.kelas);
        }),
      }));
  }, [filteredExams]);

  // Detect schedule clashes on the same day (when viewing a single class or personal schedule)
  const clashingExamIds = useMemo(() => {
    const clashes = new Set<string>();
    if (viewScope === "all" && selectedKelas === "all") return clashes;

    groupedByDate.forEach((group) => {
      for (let i = 0; i < group.list.length; i++) {
        for (let j = i + 1; j < group.list.length; j++) {
          const a = group.list[i];
          const b = group.list[j];
          if (a.kelas !== b.kelas) continue;
          const startA = parseMinutes(a.startTime);
          const endA = parseMinutes(a.endTime);
          const startB = parseMinutes(b.startTime);
          const endB = parseMinutes(b.endTime);
          if (startA < endB && startB < endA) {
            clashes.add(a.id);
            clashes.add(b.id);
          }
        }
      }
    });
    return clashes;
  }, [groupedByDate, viewScope, selectedKelas]);

  // Find target group for "Loncat ke Ujian Terdekat"
  const nearestDayGroup = useMemo(() => {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return (
      groupedByDate.find((g) => {
        const gMidnight = new Date(
          g.date.getFullYear(),
          g.date.getMonth(),
          g.date.getDate(),
        ).getTime();
        return gMidnight >= todayMidnight;
      }) ?? null
    );
  }, [groupedByDate, now]);

  const handleJumpToNearest = () => {
    if (!nearestDayGroup) return;
    const el = document.getElementById(nearestDayGroup.idSlug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExportIcs = () => {
    if (filteredExams.length === 0) return;

    let icsContent =
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FATISDA TaskPanel//Exam Schedule//ID\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

    filteredExams.forEach((e) => {
      const d = new Date(e.date);
      const [startH, startM] = e.startTime.split(/[:.]/).map(Number);
      const [endH, endM] = e.endTime.split(/[:.]/).map(Number);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      const dtStart = `${y}${m}${day}T${String(startH).padStart(2, "0")}${String(startM).padStart(2, "0")}00`;
      const dtEnd = `${y}${m}${day}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

      icsContent += `BEGIN:VEVENT\nSUMMARY:Ujian ${activeType}: ${e.courseName}\nDESCRIPTION:Ujian ${activeType} ${e.courseName} (Semester ${e.semester} Kelas ${e.kelas})\nLOCATION:Ruang ${e.room}\nDTSTART;TZID=Asia/Jakarta:${dtStart}\nDTEND;TZID=Asia/Jakarta:${dtEnd}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `Jadwal_${activeType}_${user?.username || "Mahasiswa"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardFrame>
      <div className="w-full max-w-full min-w-0 space-y-5 pb-16 sm:space-y-6">
        {/* Top Navigation Bar: Scrollable Pills on Mobile */}
        <div className="flex w-full max-w-full min-w-0 flex-col gap-3 border-b border-liquid-border pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex w-full max-w-full min-w-0 items-center gap-2 overflow-x-auto pb-0.5 sm:w-auto">
            <Link
              href="/dashboard/schedule"
              className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:py-2"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Jadwal Kuliah</span>
            </Link>

            <Link
              href="/dashboard/schedule/grand"
              className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:py-2"
            >
              <Table className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Grand Jadwal</span>
            </Link>

            <div className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-amber-500/30 bg-amber-500/15 px-3.5 py-2.5 text-xs font-bold text-amber-800 shadow-2xs dark:bg-amber-500/20 dark:text-amber-300 sm:py-2">
              <GraduationCap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Jadwal UTS / UAS</span>
            </div>
          </div>

          <div className="flex w-full max-w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSyncPanel(!showSyncPanel)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40 sm:flex-initial"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span>{showSyncPanel ? "Tutup Sinkron" : "Sync Cepat"}</span>
                </button>

                <Link
                  href="/dashboard/admin/settings"
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Atur Mode Ujian & Sumber Google Sheets"
                >
                  <Settings2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="hidden sm:inline">Pengaturan</span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={handleExportIcs}
              disabled={filteredExams.length === 0}
              className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:flex-initial"
              title="Simpan jadwal ujian ke Google Calendar / Apple Calendar"
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Export Kalender (.ics)</span>
            </button>
          </div>
        </div>

        {/* Admin Sync Panel Drawer */}
        {showSyncPanel && isAdmin && (
          <div className="w-full max-w-full min-w-0 transition-all duration-200">
            <ExamScheduleSyncPanel defaultProdi={prodi} onSynced={() => void mutate()} />
          </div>
        )}

        {/* Page Header + UTS/UAS Segmented Control */}
        <div className="flex w-full max-w-full min-w-0 flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-liquid-text dark:text-slate-100 sm:text-2xl">
                Jadwal Ujian {activeType}
              </h1>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {examMode.semesterLabel || "Semester Genap 2025/2026"}
              </span>
              {isOfflineCache && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <WifiOff className="h-3 w-3" />
                  Mode Offline
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400 sm:text-sm">
              Jadwal resmi pelaksanaan Ujian Tengah &amp; Akhir Semester Fakultas FATISDA UNS.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700/80 dark:bg-slate-800 sm:w-auto sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveType("UTS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition sm:py-1.5 ${
                activeType === "UTS"
                  ? "bg-white text-amber-700 shadow-xs dark:bg-slate-900 dark:text-amber-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              UTS (Tengah)
            </button>
            <button
              type="button"
              onClick={() => setActiveType("UAS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition sm:py-1.5 ${
                activeType === "UAS"
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              UAS (Akhir)
            </button>
          </div>
        </div>

        {/* Filter & View Mode Card (Mobile-Responsive, Zero Overflow) */}
        <div className="w-full max-w-full min-w-0 space-y-3.5 rounded-2xl border border-liquid-border bg-white p-3.5 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* View Scope Toggle */}
            <div className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700/60 dark:bg-slate-800 sm:w-auto sm:inline-flex">
              <button
                type="button"
                onClick={() => setViewScope("personal")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:py-1.5 ${
                  viewScope === "personal"
                    ? "bg-white text-liquid-accent shadow-xs dark:bg-slate-900 dark:text-sky-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Jadwal Saya</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:py-1.5 ${
                  viewScope === "all"
                    ? "bg-white text-liquid-accent shadow-xs dark:bg-slate-900 dark:text-sky-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Table className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Semua Ujian</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full min-w-0 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah, hari, atau ruang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Horizontal Scrollable Filter Pills */}
          <div className="w-full max-w-full min-w-0 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            {viewScope === "all" && (
              <div className="flex w-full max-w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex w-full max-w-full min-w-0 items-center gap-2 sm:w-auto">
                  <span className="w-14 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:w-auto">
                    Semester:
                  </span>
                  <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSemester("all")}
                      className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        selectedSemester === "all"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Semua
                    </button>
                    {SEMESTERS.map((sem) => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSemester(String(sem))}
                        className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          selectedSemester === String(sem)
                            ? "bg-amber-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        Sem {sem}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex w-full max-w-full min-w-0 items-center gap-2 sm:w-auto">
                  <span className="w-14 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:w-auto">
                    Kelas:
                  </span>
                  <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedKelas("all")}
                      className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        selectedKelas === "all"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Semua
                    </button>
                    {KELAS_OPTIONS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelectedKelas(k)}
                        className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          selectedKelas === k
                            ? "bg-amber-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        Kls {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Agama Filter Row + Jump to Nearest Button */}
            <div className="flex w-full max-w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full max-w-full min-w-0 items-center gap-2 sm:w-auto">
                <span className="w-14 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:w-auto">
                  Agama:
                </span>
                <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/90">
                  {AGAMA_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleAgamaChange(item.value)}
                      className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        selectedAgama === item.value
                          ? "bg-amber-600 font-bold text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {nearestDayGroup && (
                <button
                  type="button"
                  onClick={handleJumpToNearest}
                  className="inline-flex w-full max-w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 sm:w-auto sm:py-1.5"
                >
                  <ArrowDownCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    Loncat ke {nearestDayGroup.dayName}, {nearestDayGroup.dateStr}
                  </span>
                </button>
              )}
            </div>
          </div>

          {viewScope === "personal" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Filter aktif:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Semester {user?.semester ?? 1} · Kelas {user?.kelas ?? "A"} · Agama{" "}
                  {AGAMA_OPTIONS.find((a) => a.value === selectedAgama)?.label ?? selectedAgama}
                </strong>
              </div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {filteredExams.length} mata kuliah ujian
              </span>
            </div>
          )}
        </div>

        {/* Clash Warning Banner if overlapping exams exist */}
        {clashingExamIds.size > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-bold">Terdeteksi Jadwal Ujian Bentrok!</p>
              <p className="mt-0.5 text-red-700 dark:text-red-300">
                Terdapat {clashingExamIds.size} sesi ujian pada hari dan jam yang beririsan. Mohon
                periksa kelas atau konfirmasi ke akademik jika mengambil mata kuliah lintas
                semester.
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl border border-slate-100 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/70"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredExams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center dark:border-slate-800 dark:bg-slate-900/50 sm:p-12">
            <GraduationCap className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
              Tidak Ada Jadwal Ujian Ditemukan
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Tidak ada sesi ujian {activeType} yang cocok dengan filter atau kata kunci pencarian
              kamu.
            </p>
          </div>
        )}

        {/* Grouped Exam Schedule Timeline */}
        {!isLoading && groupedByDate.length > 0 && (
          <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6">
            {groupedByDate.map((group) => {
              const isToday = now.toDateString() === group.date.toDateString();
              const activeKelasLabel =
                viewScope === "personal"
                  ? (user?.kelas ?? "A")
                  : selectedKelas !== "all"
                    ? selectedKelas
                    : (group.list[0]?.kelas ?? "A");

              return (
                <section
                  key={group.dateStr}
                  id={group.idSlug}
                  className={`w-full max-w-full min-w-0 scroll-mt-20 rounded-2xl border bg-white p-3.5 shadow-glass transition-all dark:bg-slate-900 sm:p-6 ${
                    isToday
                      ? "border-amber-400/80 ring-1 ring-amber-400/30 dark:border-amber-700"
                      : "border-liquid-border/80 dark:border-slate-800"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex w-full max-w-full min-w-0 flex-col gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-extrabold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        {group.dayName.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold text-liquid-text dark:text-slate-100 sm:text-base">
                          <span>
                            {group.dayName}, {group.dateStr}
                          </span>
                          {isToday && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              HARI INI
                            </span>
                          )}
                        </h2>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {group.list.length} sesi ujian terjadwal
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBroadcastTarget({
                          kind: "day",
                          mode: "exam",
                          examType: activeType,
                          kelas: activeKelasLabel,
                          dayName: group.dayName,
                          dayNum: group.dayNum,
                          dateStr: group.dateStr,
                          date: group.date,
                          items: group.list.map((item) => ({
                            courseName: item.courseName,
                            startTime: item.startTime,
                            endTime: item.endTime,
                            room: item.room,
                          })),
                        })
                      }
                      className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:w-auto sm:py-1.5"
                    >
                      <MessageSquareShare className="h-3.5 w-3.5 shrink-0" />
                      <span>Broadcast Hari Ini</span>
                    </button>
                  </div>

                  {/* Sessions Grid */}
                  <div className="mt-4 grid w-full max-w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.list.map((exam) => {
                      const [startH, startM] = exam.startTime.split(/[:.]/).map(Number);
                      const [endH, endM] = exam.endTime.split(/[:.]/).map(Number);
                      const startDt = new Date(group.date);
                      startDt.setHours(startH || 0, startM || 0, 0, 0);
                      const endDt = new Date(group.date);
                      endDt.setHours(endH || 0, endM || 0, 0, 0);

                      const isOngoing = now >= startDt && now <= endDt;
                      const isPast = endDt.getTime() < now.getTime();
                      const isClash = clashingExamIds.has(exam.id);

                      const minsUntilStart = Math.max(
                        0,
                        Math.round((startDt.getTime() - now.getTime()) / 60000),
                      );
                      const minsRemaining = Math.max(
                        0,
                        Math.round((endDt.getTime() - now.getTime()) / 60000),
                      );

                      return (
                        <div
                          key={exam.id}
                          className={`flex min-w-0 flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 sm:p-4 ${
                            isClash
                              ? "border-red-300 bg-red-50/30 ring-1 ring-red-300 dark:border-red-800 dark:bg-red-950/20"
                              : isOngoing
                                ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/40 shadow-sm dark:border-amber-700 dark:bg-amber-950/30"
                                : isPast
                                  ? "border-slate-100 bg-slate-50/40 opacity-65 dark:border-slate-800/80 dark:bg-slate-800/20"
                                  : "border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold leading-snug text-liquid-text dark:text-slate-100">
                                  {exam.courseName}
                                </h3>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                    Sem {exam.semester}
                                  </span>
                                  <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                                    Kelas {exam.kelas}
                                  </span>
                                  {isOngoing && (
                                    <span className="animate-pulse rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                      Berlangsung • sisa {minsRemaining} mnt
                                    </span>
                                  )}
                                  {!isOngoing && !isPast && isToday && minsUntilStart <= 180 && (
                                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                      Mulai dlm {minsUntilStart} mnt
                                    </span>
                                  )}
                                  {isClash && (
                                    <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                                      Bentrok Jam
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {formatExamDuration(exam.startTime, exam.endTime)}
                              </span>
                            </div>
                          </div>

                          {/* Anti-Collision Footer: Stacks cleanly if room name is long */}
                          <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <RoomLocationBadge room={exam.room} variant="amber" compact />

                              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                <Clock className="h-3 w-3 text-amber-500" />
                                {exam.startTime} - {exam.endTime} WIB
                              </span>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setBroadcastTarget({
                                    kind: "single",
                                    mode: "exam",
                                    examType: activeType,
                                    kelas: exam.kelas,
                                    courseName: exam.courseName,
                                    startTime: exam.startTime,
                                    endTime: exam.endTime,
                                    room: exam.room,
                                    dayName: group.dayName,
                                    dayNum: group.dayNum,
                                    dateStr: group.dateStr,
                                    date: group.date,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              >
                                <MessageSquareShare className="h-3 w-3" />
                                <span>Salin Reminder WA</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <WhatsAppBroadcastModal
        target={broadcastTarget}
        onClose={() => setBroadcastTarget(null)}
      />
    </DashboardFrame>
  );
}

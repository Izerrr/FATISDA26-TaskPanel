"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Clock,
  Download,
  Filter,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Table,
  UserCheck,
} from "lucide-react";

import { useRole } from "@/hooks/useRole";
import { useExamSchedule } from "@/hooks/useExamSchedule";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ExamScheduleSyncPanel } from "@/components/schedule/ExamScheduleSyncPanel";
import type { ExamSchedule, ExamType, Kelas, Prodi } from "@/types";

const SEMESTERS = [1, 3, 5, 7];
const KELAS_OPTIONS: Kelas[] = ["A", "B", "C", "D"];

export default function ExamSchedulePage() {
  const { user } = useRole();

  const [activeType, setActiveType] = useState<ExamType>("UTS");
  const [viewScope, setViewScope] = useState<"personal" | "all">("personal");
  const [selectedSemester, setSelectedSemester] = useState<string>(
    user?.semester ? String(user.semester) : "1",
  );
  const [selectedKelas, setSelectedKelas] = useState<string>(user?.kelas ?? "A");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  const prodi: Prodi = user?.prodi ?? "INFORMATIKA";
  const isAdmin = user?.roles?.some((r) => ["ADMIN", "OWNER"].includes(r));

  // Determine query params based on scope
  const querySemester = viewScope === "personal" ? (user?.semester ?? 1) : selectedSemester === "all" ? null : parseInt(selectedSemester, 10);
  const queryKelas = viewScope === "personal" ? (user?.kelas ?? "A") : selectedKelas === "all" ? null : selectedKelas;

  const { exams, isLoading, isError, mutate } = useExamSchedule({
    prodi,
    semester: querySemester,
    kelas: queryKelas,
    type: activeType,
  });

  const now = new Date();

  // Filter exams by search query
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

  // Group filtered exams by day and sort chronologically from Senin (1 = Senin .. 7 = Minggu)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, { date: Date; dateStr: string; dayName: string; dayNum: number; list: ExamSchedule[] }>();

    filteredExams.forEach((exam) => {
      const key = `${exam.dayName}-${exam.dateStr}`;
      if (!map.has(key)) {
        map.set(key, {
          date: new Date(exam.date),
          dateStr: exam.dateStr,
          dayName: exam.dayName,
          dayNum: exam.dayNum,
          list: [],
        });
      }
      map.get(key)!.list.push(exam);
    });

    // Sort days chronologically starting from Monday (Senin)
    return Array.from(map.values())
      .sort((a, b) => a.dayNum - b.dayNum)
      .map((g) => ({
        ...g,
        list: [...g.list].sort((a, b) => {
          const timeDiff = a.startTime.localeCompare(b.startTime);
          if (timeDiff !== 0) return timeDiff;
          return a.kelas.localeCompare(b.kelas);
        }),
      }));
  }, [filteredExams]);

  // Generate iCal ICS file download for student's personal exam schedule
  const handleExportIcs = () => {
    if (filteredExams.length === 0) return;

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FATISDA TaskPanel//Exam Schedule//ID\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

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
      <div className="space-y-6">
        {/* Top Navigation Bar: Regular Schedule vs Grand vs Exam */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-liquid-border dark:border-slate-800 pb-4">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            <Link
              href="/dashboard/schedule"
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Jadwal Kuliah</span>
            </Link>

            <Link
              href="/dashboard/schedule/grand"
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Table className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Tabel Matkul</span>
            </Link>

            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 shadow-2xs">
              <GraduationCap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Jadwal UTS / UAS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSyncPanel(!showSyncPanel)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{showSyncPanel ? "Tutup Sinkron" : "Sinkronisasi Sheets"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportIcs}
              disabled={filteredExams.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              title="Simpan jadwal ujian ke Google Calendar / Apple Calendar"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Kalender (.ics)</span>
            </button>
          </div>
        </div>

        {/* Admin Sync Panel Drawer */}
        {showSyncPanel && isAdmin && (
          <div className="animate-in fade-in zoom-in-98 duration-150">
            <ExamScheduleSyncPanel defaultProdi={prodi} onSynced={() => void mutate()} />
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-liquid-text dark:text-slate-100 sm:text-3xl">
                Jadwal Ujian {activeType}
              </h1>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 uppercase">
                Gasal 2026/2027
              </span>
            </div>
            <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
              Jadwal pelaksanaan Ujian Tengah Semester &amp; Akhir Semester Fakultas FATISDA UNS.
            </p>
          </div>

          {/* UTS vs UAS Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveType("UTS")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeType === "UTS"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              UTS (Tengah)
            </button>
            <button
              type="button"
              onClick={() => setActiveType("UAS")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeType === "UAS"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              UAS (Akhir)
            </button>
          </div>
        </div>

        {/* Filter & View Mode Controls */}
        <div className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-glass space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* View Scope Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewScope("personal")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewScope === "personal"
                    ? "bg-white dark:bg-slate-900 text-liquid-accent dark:text-sky-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Jadwal Saya (Personal)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewScope === "all"
                    ? "bg-white dark:bg-slate-900 text-liquid-accent dark:text-sky-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Semua Ujian (Grand View)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah atau ruang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Granular Filters for Grand View */}
          {viewScope === "all" && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Semester:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSemester("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedSemester === "all"
                        ? "bg-amber-600 text-white"
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        selectedSemester === String(sem)
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kelas:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedKelas("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedKelas === "all"
                        ? "bg-amber-600 text-white"
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        selectedKelas === k
                          ? "bg-amber-600 text-white"
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

          {viewScope === "personal" && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Menampilkan jadwal khusus untuk:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                Semester {user?.semester ?? 1} · Kelas {user?.kelas ?? "A"}
              </strong>
              <span>({filteredExams.length} sesi ujian ditemukan)</span>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-5"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredExams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
              Tidak Ada Jadwal Ujian Ditemukan
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ada sesi ujian yang cocok dengan filter atau kata kunci pencarian kamu.
            </p>
          </div>
        )}

        {/* Grouped Exam Schedule Timeline */}
        {!isLoading && groupedByDate.length > 0 && (
          <div className="space-y-6">
            {groupedByDate.map((group) => {
              const isToday = now.toDateString() === group.date.toDateString();

              return (
                <section
                  key={group.dateStr}
                  className="rounded-2xl border border-liquid-border/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-glass"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-bold text-xs">
                        {group.dayName.slice(0, 3)}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-liquid-text dark:text-slate-100 flex items-center gap-2">
                          <span>{group.dayName}, {group.dateStr}</span>
                          {isToday && (
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              HARI INI
                            </span>
                          )}
                        </h2>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {group.list.length} sesi ujian
                    </span>
                  </div>

                  {/* Sessions in this day */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.list.map((exam) => {
                      const [startH, startM] = exam.startTime.split(/[:.]/).map(Number);
                      const [endH, endM] = exam.endTime.split(/[:.]/).map(Number);
                      const startDt = new Date(group.date);
                      startDt.setHours(startH || 0, startM || 0, 0, 0);
                      const endDt = new Date(group.date);
                      endDt.setHours(endH || 0, endM || 0, 0, 0);

                      const isOngoing = now >= startDt && now <= endDt;
                      const isPast = endDt.getTime() < now.getTime();

                      return (
                        <div
                          key={exam.id}
                          className={`rounded-xl border p-4 transition-all ${
                            isOngoing
                              ? "border-amber-400 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/30 ring-2 ring-amber-400/50 shadow-sm"
                              : isPast
                              ? "border-slate-100 bg-slate-50/40 dark:border-slate-800/80 dark:bg-slate-800/20 opacity-60"
                              : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm text-liquid-text dark:text-slate-100 leading-snug">
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
                                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 animate-pulse">
                                    Sedang Ujian
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="shrink-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                              {exam.startTime}
                            </span>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                              <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              {exam.room}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              <Clock className="h-3 w-3" />
                              {exam.startTime} - {exam.endTime} WIB
                            </span>
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
    </DashboardFrame>
  );
}


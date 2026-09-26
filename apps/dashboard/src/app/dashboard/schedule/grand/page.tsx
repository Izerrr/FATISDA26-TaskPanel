"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Download, Filter, Layers, MapPin, RefreshCw, Search, Sparkles, Table as TableIcon, UserRound } from "lucide-react";
import type { Prodi } from "@prisma/client";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ScheduleAiMatcher } from "@/components/schedule/ScheduleAiMatcher";
import { OFFICIAL_PRODI_ROOMS } from "@/lib/schedule/constants";

interface ScheduleItem {
  id: string;
  prodi: Prodi;
  kelas: string | null;
  semester: number;
  courseName: string;
  course?: { code?: string; name: string } | null;
  day: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  lecturer?: string | null;
  sourceSlots?: number[];
  markers?: string[];
}

const PRODI_OPTIONS: { id: Prodi; label: string; badge: string }[] = [
  { id: "INFORMATIKA", label: "Informatika (Solo)", badge: "IF" },
  { id: "SAINS_DATA", label: "Sains Data", badge: "SD" },
  { id: "INFORMATIKA_PSDKU_KEBUMEN", label: "Informatika PSDKU Kebumen", badge: "PSDKU" },
];

const DAYS = [
  { value: 0, label: "Semua Hari" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
];

const SESSIONS = [
  { num: 1, time: "07:30 - 08:20" },
  { num: 2, time: "08:25 - 09:15" },
  { num: 3, time: "09:20 - 10:10" },
  { num: 4, time: "10:15 - 11:05" },
  { num: 5, time: "11:10 - 12:00" },
  { num: 6, time: "13:00 - 13:50" },
  { num: 7, time: "13:55 - 14:45" },
  { num: 8, time: "15:30 - 16:20" },
  { num: 9, time: "16:25 - 17:15" },
  { num: 10, time: "18:00 - 18:50" },
  { num: 11, time: "18:55 - 19:45" },
  { num: 12, time: "19:50 - 20:40" },
];

const SEMESTER_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const KELAS_OPTIONS = ["ALL", "A", "B", "C", "D"];

function getSemesterColor(sem: number) {
  switch (sem) {
    case 1:
      return "border-emerald-200 bg-emerald-50/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
    case 2:
      return "border-teal-200 bg-teal-50/90 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200";
    case 3:
      return "border-sky-200 bg-sky-50/90 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200";
    case 4:
      return "border-cyan-200 bg-cyan-50/90 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200";
    case 5:
      return "border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
    case 6:
      return "border-orange-200 bg-orange-50/90 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200";
    case 7:
      return "border-purple-200 bg-purple-50/90 text-purple-950 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200";
    case 8:
      return "border-pink-200 bg-pink-50/90 text-pink-950 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

export default function GrandSchedulePage() {
  const [selectedProdi, setSelectedProdi] = useState<Prodi>("INFORMATIKA");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default Senin
  const [selectedSemester, setSelectedSemester] = useState<number>(0); // 0 = Semua
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [rooms, setRooms] = useState<string[]>(OFFICIAL_PRODI_ROOMS[selectedProdi] || []);
  const [loading, setLoading] = useState(true);
  const [showAiMatcher, setShowAiMatcher] = useState(false);
  const [selectedCellItem, setSelectedCellItem] = useState<ScheduleItem | null>(null);

  // Fetch jadwal grand matrix dari API
  async function fetchGrandSchedule(prodi: Prodi) {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedule?prodi=${prodi}&mode=grand`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.entries || []);
        if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
          setRooms(data.rooms);
        } else {
          setRooms(OFFICIAL_PRODI_ROOMS[prodi] || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRooms(OFFICIAL_PRODI_ROOMS[selectedProdi] || []);
    fetchGrandSchedule(selectedProdi);
  }, [selectedProdi]);

  // Filter jadwal sesuai kontrol
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedSemester > 0 && s.semester !== selectedSemester) return false;
      if (selectedKelas !== "ALL" && s.kelas !== selectedKelas) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = (s.courseName || "").toLowerCase().includes(query);
        const matchesLecturer = (s.lecturer || "").toLowerCase().includes(query);
        const matchesRoom = (s.room || "").toLowerCase().includes(query);
        const matchesCode = (s.course?.code || "").toLowerCase().includes(query);
        if (!matchesName && !matchesLecturer && !matchesRoom && !matchesCode) return false;
      }
      return true;
    });
  }, [schedules, selectedSemester, selectedKelas, search]);

  // Tentukan hari yang akan ditampilkan pada spreadsheet
  const activeDays = useMemo(() => {
    if (selectedDay === 0) return [1, 2, 3, 4, 5];
    return [selectedDay];
  }, [selectedDay]);

  // Ekspor CSV format spreadsheet
  function handleExportCsv() {
    if (filteredSchedules.length === 0) return;
    const headers = ["Hari", "Sesi", "Jam Mulai", "Jam Selesai", "Ruangan", "Mata Kuliah", "Semester", "Kelas", "Dosen"];
    const rows = filteredSchedules.map((s) => [
      DAYS.find((d) => d.value === s.day)?.label || s.day,
      s.sourceSlots?.join("-") || "-",
      s.startTime,
      s.endTime,
      `"${s.room || ""}"`,
      `"${s.courseName || ""}"`,
      s.semester,
      s.kelas || "-",
      `"${s.lecturer || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Grand_Jadwal_${selectedProdi}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Top Navigation Tabs: Personal vs Grand vs AI */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-liquid-border dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/schedule"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Jadwal Saya (Personal)</span>
            </Link>

            <div className="flex items-center gap-1.5 rounded-2xl bg-liquid-accent/10 px-3.5 py-2 text-xs font-bold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300">
              <TableIcon className="h-4 w-4" />
              <span>Grand Spreadsheet (Semua Prodi)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAiMatcher(!showAiMatcher)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition shadow-sm ${
              showAiMatcher
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-500/20"
                : "border border-sky-300/80 bg-sky-50/80 text-sky-700 hover:bg-sky-100/80 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50"
            }`}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>{showAiMatcher ? "Tutup AI Matcher" : "Buka AI Matcher & Jam Kosong"}</span>
          </button>
        </div>

        {/* AI Matcher Panel (Expandable) */}
        {showAiMatcher && <ScheduleAiMatcher defaultProdi={selectedProdi} defaultSemester={selectedSemester > 0 ? selectedSemester : 1} onClose={() => setShowAiMatcher(false)} />}

        {/* Prodi Selector Bar */}
        <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white p-4 shadow-glass dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Prodi Buttons */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Pilih Program Studi:</p>
              <div className="flex flex-wrap gap-2">
                {PRODI_OPTIONS.map((prodi) => {
                  const active = selectedProdi === prodi.id;
                  return (
                    <button
                      key={prodi.id}
                      type="button"
                      onClick={() => setSelectedProdi(prodi.id)}
                      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                        active
                          ? "bg-liquid-accent text-white shadow-md shadow-sky-500/20"
                          : "border border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>{prodi.badge}</span>
                      <span>{prodi.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions: Reload & Export */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              <button
                type="button"
                onClick={() => fetchGrandSchedule(selectedProdi)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredSchedules.length === 0}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-liquid-accent" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter Controls: Hari, Semester, Kelas, Search */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Day Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {DAYS.map((d) => {
              const active = selectedDay === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-semibold transition ${
                    active ? "bg-liquid-accent text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari matkul/ruang/dosen..."
                className="w-44 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-52"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              )}
            </div>

            {/* Semester Pill */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <span className="px-2 text-[11px] font-semibold text-slate-400">Smt</span>
              <div className="flex gap-1 overflow-x-auto">
                {SEMESTER_OPTIONS.map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`h-6 rounded-xl px-2 text-[11px] font-bold transition ${selectedSemester === sem ? "bg-liquid-accent text-white shadow-xs" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                  >
                    {sem === 0 ? "Semua" : sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Kelas Pill */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <span className="px-2 text-[11px] font-semibold text-slate-400">Kls</span>
              <div className="flex gap-1">
                {KELAS_OPTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelectedKelas(k)}
                    className={`h-6 rounded-xl px-2 text-[11px] font-bold transition ${selectedKelas === k ? "bg-liquid-accent text-white shadow-xs" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                  >
                    {k === "ALL" ? "Semua" : k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Spreadsheet Matrix Grid */}
        <section className="relative overflow-hidden rounded-3xl border border-liquid-border dark:border-slate-800 bg-white shadow-glass dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <RefreshCw className="h-8 w-8 animate-spin text-liquid-accent" />
              <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Memuat matriks spreadsheet perkuliahan...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">Tidak ada data ruangan atau jadwal ditemukan untuk prodi ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {/* Header Row: Ruangan */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 backdrop-blur sticky top-0 z-20 dark:border-slate-800 dark:bg-slate-950/90">
                    <th className="sticky left-0 z-30 min-w-32 border-r border-slate-200 bg-slate-100/95 p-3 text-center font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      Sesi & Waktu
                    </th>
                    {rooms.map((room) => (
                      <th key={room} className="min-w-44 max-w-60 border-r border-slate-200 p-3 text-center font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          <MapPin className="h-3 w-3 text-sky-500 shrink-0" />
                          <span className="truncate">{room}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {activeDays.map((dayNum) => {
                    const dayLabel = DAYS.find((d) => d.value === dayNum)?.label || `Hari ${dayNum}`;

                    return (
                      <tbody key={dayNum} className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {/* Day Banner (if viewing All Days) */}
                        {activeDays.length > 1 && (
                          <tr className="bg-sky-50/70 dark:bg-sky-950/30">
                            <td colSpan={rooms.length + 1} className="px-4 py-2 font-bold text-sky-800 dark:text-sky-300 text-xs uppercase tracking-wider">
                              📅 {dayLabel}
                            </td>
                          </tr>
                        )}

                        {/* Session Rows */}
                        {SESSIONS.map((sess) => {
                          return (
                            <tr key={`${dayNum}-${sess.num}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              {/* Sticky Time Header */}
                              <td className="sticky left-0 z-10 border-r border-slate-200 bg-white/95 p-2.5 text-center dark:border-slate-800 dark:bg-slate-900/95 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Sesi {sess.num}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{sess.time}</div>
                              </td>

                              {/* Ruangan Cells */}
                              {rooms.map((room) => {
                                // Cari jadwal yang cocok dengan hari, sesi, dan ruangan
                                const items = filteredSchedules.filter((s) => {
                                  if (s.day !== dayNum) return false;
                                  if (s.room?.trim() !== room.trim()) return false;

                                  // Cek apakah sesi ini masuk dalam sourceSlots atau rentang jam
                                  if (s.sourceSlots && s.sourceSlots.length > 0) {
                                    return s.sourceSlots.includes(sess.num);
                                  }

                                  // Fallback rentang jam
                                  const [startH, startM] = s.startTime.split(":").map(Number);
                                  const [endH, endM] = s.endTime.split(":").map(Number);
                                  const [sessStartH, sessStartM] = sess.time.split(" - ")[0].split(":").map(Number);
                                  const [sessEndH, sessEndM] = sess.time.split(" - ")[1].split(":").map(Number);

                                  const startMin = startH * 60 + startM;
                                  const endMin = endH * 60 + endM;
                                  const sStart = sessStartH * 60 + sessStartM;
                                  const sEnd = sessEndH * 60 + sessEndM;

                                  return Math.max(startMin, sStart) < Math.min(endMin, sEnd);
                                });

                                if (items.length === 0) {
                                  return (
                                    <td key={room} className="border-r border-slate-100 p-2 text-center text-slate-300 dark:border-slate-800/80 dark:text-slate-700 select-none">
                                      —
                                    </td>
                                  );
                                }

                                return (
                                  <td key={room} className="border-r border-slate-100 p-1.5 align-top dark:border-slate-800/80">
                                    <div className="space-y-1.5">
                                      {items.map((item) => {
                                        const colorClass = getSemesterColor(item.semester);
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => setSelectedCellItem(item)}
                                            className={`cursor-pointer rounded-xl border p-2 shadow-xs transition hover:scale-[1.01] hover:shadow-md ${colorClass}`}
                                            title="Klik untuk melihat detail lengkap"
                                          >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                              <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-bold dark:bg-white/20">Smt {item.semester}</span>
                                              {item.kelas && <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300">Kls {item.kelas}</span>}
                                            </div>

                                            <p className="font-bold leading-snug line-clamp-2 text-xs">{item.courseName}</p>

                                            {item.lecturer && (
                                              <p className="mt-1 truncate text-[10px] opacity-80 flex items-center gap-1">
                                                <UserRound className="h-2.5 w-2.5 shrink-0" />
                                                <span>{item.lecturer}</span>
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Detail Mata Kuliah Saat Sel Diklik */}
        {selectedCellItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setSelectedCellItem(null)}>
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-lg bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">Semester {selectedCellItem.semester}</span>
                    {selectedCellItem.kelas && <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">Kelas {selectedCellItem.kelas}</span>}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedCellItem.courseName}</h3>
                  {selectedCellItem.course?.code && <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedCellItem.course.code}</p>}
                </div>

                <button type="button" onClick={() => setSelectedCellItem(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <span>
                    {selectedCellItem.startTime} - {selectedCellItem.endTime} WIB
                    {selectedCellItem.sourceSlots ? ` (Sesi ${selectedCellItem.sourceSlots.join("-")})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span>Ruangan: {selectedCellItem.room || "Belum ditentukan"}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <UserRound className="h-4 w-4 text-indigo-500" />
                  <span>Pengampu: {selectedCellItem.lecturer || "Dosen pengampu"}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button type="button" onClick={() => setSelectedCellItem(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardFrame>
  );
}

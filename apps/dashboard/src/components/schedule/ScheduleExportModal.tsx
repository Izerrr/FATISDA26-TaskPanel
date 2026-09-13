"use client";

import { useState } from "react";
import { Calendar, Check, Download, ExternalLink, Info, X } from "lucide-react";
import type { Schedule } from "@/types";
import { downloadFile, generateICS, getGoogleCalendarUrl } from "@/lib/calendar-export";

interface ScheduleExportModalProps {
  open: boolean;
  schedules: Schedule[];
  semester: number;
  kelas?: string | null;
  onClose: () => void;
}

export function ScheduleExportModal({ open, schedules, semester, kelas, onClose }: ScheduleExportModalProps) {
  const [alarmMinutes, setAlarmMinutes] = useState(15);
  const [downloaded, setDownloaded] = useState(false);

  if (!open) return null;

  function handleDownloadICS() {
    const icsContent = generateICS(schedules, { alarmMinutes });
    const filename = `Jadwal_Kuliah_Semester_${semester}${kelas ? `_Kelas_${kelas}` : ""}.ics`;
    downloadFile(icsContent, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-liquid-text">Ekspor ke Kalender</h2>
              <p className="text-xs text-liquid-text-secondary">Sinkronkan {schedules.length} jadwal mata kuliah ke HP atau Laptop</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Setting Alarm Reminder */}
          <div>
            <label className="text-xs font-semibold text-liquid-text">Waktu Pengingat (Notifikasi Alarm):</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAlarmMinutes(mins)}
                  className={`rounded-xl border py-2 text-xs font-medium transition ${
                    alarmMinutes === mins ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent font-semibold shadow-xs" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {mins === 60 ? "1 Jam" : `${mins} Menit`} Sebelum
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action: Download .ics */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-liquid-text">Unduh Berkas iCalendar (.ics)</h3>
                <p className="mt-1 text-xs text-liquid-text-secondary leading-relaxed">
                  Format standar kalender untuk 1 semester penuh. Bisa langsung dibuka di <strong>Apple Calendar (iPhone/Mac)</strong>, <strong>Google Calendar</strong>, dan <strong>Microsoft Outlook</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadICS}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold shadow-sm transition-all ${
                downloaded ? "bg-emerald-600 text-white" : "bg-liquid-accent text-white hover:bg-liquid-accent/90"
              }`}
            >
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" />
                  Berkas .ics Berhasil Diunduh!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Unduh Berkas .ics ({schedules.length} Jadwal)
                </>
              )}
            </button>
          </div>

          {/* Google Calendar Direct Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-liquid-text">Atau Tambahkan ke Google Calendar:</span>
              <span className="text-[11px] text-slate-400">Buka per mata kuliah</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-slate-100 p-2 bg-slate-50/40">
              {schedules.map((schedule) => {
                const name = schedule.course?.name || schedule.courseName || "Kuliah";
                const url = getGoogleCalendarUrl(schedule);

                return (
                  <div key={schedule.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-slate-200/60 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1 truncate">
                      <p className="font-semibold text-liquid-text truncate">{name}</p>
                      <p className="text-[10px] text-slate-400">
                        {schedule.startTime} - {schedule.endTime} · {schedule.room || "FATISDA"}
                      </p>
                    </div>

                    <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 transition">
                      <span>Google</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Info */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3 text-[11px] text-amber-800 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Tips Pengguna iPhone:</strong> Buka file <code>.ics</code> yang diunduh langsung lewat Safari atau aplikasi Files, lalu pilih <em>"Add All"</em> untuk memasukkan seluruh jadwal ke Kalender iOS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

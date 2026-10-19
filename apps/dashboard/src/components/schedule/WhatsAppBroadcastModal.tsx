"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  MessageSquareShare,
  Sparkles,
  UserCheck,
  X,
  ClipboardList,
} from "lucide-react";
import {
  buildWhatsAppShareUrl,
  detectDefaultTiming,
  generateCourseBroadcast,
  generateDaySummaryBroadcast,
  type BroadcastTaskItem,
  type BroadcastTiming,
  type BroadcastTone,
} from "@/lib/whatsapp-broadcast";

export interface BroadcastTargetSingle {
  kind: "single";
  mode?: "course" | "exam";
  examType?: "UTS" | "UAS";
  kelas: string;
  courseName: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  lecturer?: string | null;
  dayName?: string;
  dayNum?: number;
  dateStr?: string;
  date?: string | Date | null;
  tasks?: BroadcastTaskItem[];
}

export interface BroadcastTargetDay {
  kind: "day";
  mode?: "course" | "exam";
  examType?: "UTS" | "UAS";
  kelas: string;
  dayName: string;
  dayNum?: number;
  dateStr?: string;
  date?: string | Date | null;
  items: Array<{
    courseName: string;
    startTime: string;
    endTime: string;
    room?: string | null;
    lecturer?: string | null;
  }>;
}

export type BroadcastModalTarget = BroadcastTargetSingle | BroadcastTargetDay;

interface WhatsAppBroadcastModalProps {
  target: BroadcastModalTarget | null;
  onClose: () => void;
}

export function WhatsAppBroadcastModal({ target, onClose }: WhatsAppBroadcastModalProps) {
  const [timing, setTiming] = useState<BroadcastTiming>("tomorrow");
  const [tone, setTone] = useState<BroadcastTone>("casual_en");
  const [includeLecturer, setIncludeLecturer] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!target) return;
    const detected = detectDefaultTiming({
      dayNum: target.dayNum,
      date: target.date,
    });
    setTiming(detected);
    setCopied(false);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [target, onClose]);

  const hasLecturerOption = useMemo(() => {
    if (!target) return false;
    if (target.kind === "single") return Boolean(target.lecturer?.trim());
    return target.items.some((i) => Boolean(i.lecturer?.trim()));
  }, [target]);

  const availableTasks = useMemo(() => {
    if (!target || target.kind !== "single") return [];
    return target.tasks ?? [];
  }, [target]);

  const messageText = useMemo(() => {
    if (!target) return "";
    if (target.kind === "single") {
      return generateCourseBroadcast({
        mode: target.mode ?? "course",
        examType: target.examType,
        kelas: target.kelas,
        courseName: target.courseName,
        startTime: target.startTime,
        endTime: target.endTime,
        room: target.room,
        lecturer: target.lecturer,
        dayName: target.dayName,
        dateStr: target.dateStr,
        timing,
        tone,
        includeLecturer,
        includeTasks,
        tasks: availableTasks,
      });
    }

    return generateDaySummaryBroadcast({
      mode: target.mode ?? "course",
      examType: target.examType,
      kelas: target.kelas,
      dayName: target.dayName,
      dateStr: target.dateStr,
      timing,
      tone,
      includeLecturer,
      items: target.items,
    });
  }, [target, timing, tone, includeLecturer, includeTasks, availableTasks]);

  if (!target) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppShareUrl(messageText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <MessageSquareShare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Smart Broadcast WhatsApp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {target.kind === "single"
                  ? `${target.courseName} • Kelas ${target.kelas}`
                  : `Rangkuman Hari ${target.dayName} • Kelas ${target.kelas}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal broadcast"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Timing Selector */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Waktu Pengiriman (Kondisional Otomatis)
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/90">
              <button
                type="button"
                onClick={() => setTiming("tomorrow")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  timing === "tomorrow"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                H-1 (Tomorrow)
              </button>
              <button
                type="button"
                onClick={() => setTiming("today")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  timing === "today"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Hari-H (Today)
              </button>
              <button
                type="button"
                onClick={() => setTiming("scheduled")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  timing === "scheduled"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Sebut Hari
              </button>
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              Gaya Bahasa Template
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/90">
              <button
                type="button"
                onClick={() => setTone("casual_en")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  tone === "casual_en"
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Casual EN (PJ)
              </button>
              <button
                type="button"
                onClick={() => setTone("formal_id")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  tone === "formal_id"
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Formal ID
              </button>
              <button
                type="button"
                onClick={() => setTone("concise")}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  tone === "concise"
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Super Ringkas
              </button>
            </div>
          </div>

          {/* Optional Toggles */}
          {(hasLecturerOption || availableTasks.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {hasLecturerOption && (
                <button
                  type="button"
                  onClick={() => setIncludeLecturer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    includeLecturer
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Cantumkan Dosen
                </button>
              )}

              {availableTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIncludeTasks((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    includeTasks
                      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Sisipkan {availableTasks.length} Tugas Aktif
                </button>
              )}
            </div>
          )}

          {/* WhatsApp Bubble Preview */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#efeae2] p-3.5 dark:border-emerald-900/40 dark:bg-[#0b141a]">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Preview Pesan WhatsApp</span>
              <span>Kelas {target.kelas}</span>
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-3.5 text-xs leading-relaxed text-slate-800 shadow-sm dark:bg-[#005c4b] dark:text-slate-100">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {messageText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800/80 dark:bg-slate-900/80 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
              copied
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Salin Teks
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <ExternalLink className="h-4 w-4" />
            Buka WhatsApp Langsung
          </button>
        </div>
      </div>
    </div>
  );
}


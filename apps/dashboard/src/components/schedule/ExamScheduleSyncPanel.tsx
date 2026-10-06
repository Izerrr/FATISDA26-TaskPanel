"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, XCircle, Link2, Sparkles } from "lucide-react";
import type { Prodi } from "@/types";

interface Props {
  defaultProdi?: Prodi | null;
  onSynced?: () => void;
}

export function ExamScheduleSyncPanel({ defaultProdi = "INFORMATIKA", onSynced }: Props) {
  const [prodi, setProdi] = useState<Prodi>(defaultProdi ?? "INFORMATIKA");
  const [examType, setExamType] = useState<"UTS" | "UAS">("UTS");
  const [spreadsheetId, setSpreadsheetId] = useState("1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc");
  const [gid, setGid] = useState("524464654");
  const [customSource, setCustomSource] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/schedule/exam/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodi,
          type: examType,
          spreadsheetId: spreadsheetId.trim(),
          gid: gid.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal melakukan sinkronisasi jadwal ujian.");
      }

      setMessage(
        `${data.totalCount} sesi ujian ${examType} berhasil disinkronkan untuk program studi ${prodi}.`,
      );

      onSynced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan sinkronisasi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
          <RefreshCw className={`h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-liquid-text dark:text-slate-100">
              Sinkronisasi Jadwal Ujian (UTS / UAS)
            </h2>
            <span className="rounded-full bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase">
              Admin
            </span>
          </div>
          <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">
            Perbarui data ujian secara otomatis dari Google Sheets master dan simpan ke database platform.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Program Studi
          </label>
          <select
            value={prodi}
            onChange={(e) => setProdi(e.target.value as Prodi)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="INFORMATIKA">S-1 Informatika</option>
            <option value="SAINS_DATA">S-1 Sains Data</option>
            <option value="INFORMATIKA_PSDKU_KEBUMEN">S-1 Informatika PSDKU</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Jenis Ujian
          </label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as "UTS" | "UAS")}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="UTS">Ujian Tengah Semester (UTS)</option>
            <option value="UAS">Ujian Akhir Semester (UAS)</option>
          </select>
        </div>
      </div>

      {customSource && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/50 dark:border-amber-900/40">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Spreadsheet ID
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Sheet GID
            </label>
            <input
              type="text"
              value={gid}
              onChange={(e) => setGid(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCustomSource(!customSource)}
          className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
        >
          {customSource ? "Gunakan Sumber Default" : "Ubah Spreadsheet ID / GID"}
        </button>

        <button
          type="button"
          onClick={handleSync}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
          <span>{isSubmitting ? "Menyinkronkan..." : `Sinkronkan Jadwal ${examType} Sekarang`}</span>
        </button>
      </div>

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs font-semibold text-red-800 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}


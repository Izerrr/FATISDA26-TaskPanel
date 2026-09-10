"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import type { Prodi } from "@/types";

const PRODI_OPTIONS = [
  {
    value: "INFORMATIKA",
    label: "Informatika",
  },
  {
    value: "SAINS_DATA",
    label: "Sains Data",
  },
  {
    value: "INFORMATIKA_PSDKU_KEBUMEN",
    label: "Informatika PSDKU Kebumen",
  },
] as const;

interface Props {
  defaultProdi?: Prodi | null;
}

export function ScheduleSyncPanel({ defaultProdi = "INFORMATIKA" }: Props) {
  const { mutate } = useSchedule();

  const [prodi, setProdi] = useState<Prodi>(defaultProdi ?? "INFORMATIKA");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/schedule/sync?prodi=${encodeURIComponent(prodi)}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal melakukan sinkronisasi.");
      }

      setMessage(`${data.insertedEntries} jadwal berhasil disinkronkan untuk ${prodi}.`);

      await mutate();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal melakukan sinkronisasi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <RefreshCw className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-liquid-text">Sinkronisasi Jadwal</h2>

          <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">Ambil jadwal terbaru dari sumber spreadsheet dan ganti data jadwal lama untuk program studi yang dipilih.</p>
        </div>
      </div>

      {/* Target */}
      <div className="mt-5">
        <label htmlFor="schedule-prodi" className="mb-1.5 block text-xs font-semibold text-liquid-text">
          Program Studi
        </label>

        <select
          id="schedule-prodi"
          value={prodi}
          onChange={(event) => setProdi(event.target.value as Prodi)}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        >
          {PRODI_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Warning */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        <strong>Perhatian:</strong> sinkronisasi akan mengganti seluruh jadwal lama untuk <strong>{prodi}</strong>.
      </div>

      {/* Feedback */}
      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action */}
      <div className="mt-4 flex justify-end">
        <button type="button" disabled={isSubmitting} onClick={handleSync} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? "Menyinkronkan..." : "Sync Jadwal"}
        </button>
      </div>
    </section>
  );
}

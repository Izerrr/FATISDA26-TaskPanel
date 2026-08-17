"use client";

import { CheckCircle2, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import type { Kelas, Prodi } from "@/types";

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

const KELAS_OPTIONS = ["A", "B", "C", "D", "E"] as const;

interface Props {
  defaultProdi?: Prodi | null;
  defaultKelas?: Kelas | null;
}

interface ImportSchedule {
  courseId: string | null;
  day: number;
  startTime: string;
  endTime: string;
  room: string | null;
  lecturer: string | null;
}

export function ScheduleSyncPanel({ defaultProdi = "INFORMATIKA", defaultKelas = "A" }: Props) {
  const { mutate } = useSchedule();

  const [prodi, setProdi] = useState<Prodi>(defaultProdi ?? "INFORMATIKA");

  const [kelas, setKelas] = useState<Kelas>(defaultKelas ?? "A");

  const [json, setJson] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setMessage(null);
    setError(null);

    let schedules: ImportSchedule[];

    try {
      const parsed: unknown = JSON.parse(json);

      if (!Array.isArray(parsed)) {
        throw new Error("Data harus berupa array JSON.");
      }

      schedules = parsed as ImportSchedule[];
    } catch (error) {
      setError(error instanceof Error ? error.message : "Format JSON tidak valid.");

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/schedule/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prodi,
          kelas,
          schedules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal melakukan sinkronisasi.");
      }

      setMessage(`${data.count} jadwal berhasil disinkronkan untuk ${prodi} kelas ${kelas}.`);

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
          <Upload className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-liquid-text">Sinkronisasi Jadwal</h2>

          <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">Import atau replace jadwal berdasarkan program studi dan kelas.</p>
        </div>
      </div>

      {/* Target */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
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

        <div>
          <label htmlFor="schedule-kelas" className="mb-1.5 block text-xs font-semibold text-liquid-text">
            Kelas
          </label>

          <select
            id="schedule-kelas"
            value={kelas}
            onChange={(event) => setKelas(event.target.value as Kelas)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          >
            {KELAS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Kelas {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        <strong>Perhatian:</strong> sinkronisasi akan mengganti seluruh jadwal lama untuk{" "}
        <strong>
          {prodi} — Kelas {kelas}
        </strong>
        .
      </div>

      {/* JSON */}
      <textarea
        value={json}
        onChange={(event) => setJson(event.target.value)}
        disabled={isSubmitting}
        placeholder={`[
  {
    "courseId": null,
    "day": 1,
    "startTime": "08:00",
    "endTime": "09:40",
    "room": "R.302",
    "lecturer": "Nama Dosen"
  }
]`}
        className="mt-4 min-h-56 w-full rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
      />

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
        <button
          type="button"
          disabled={isSubmitting || !json.trim()}
          onClick={handleSync}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Menyinkronkan..." : "Sync Jadwal"}
        </button>
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  GraduationCap,
  History,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { useRole } from "@/hooks/useRole";
import { formatWib } from "@/lib/datetime";
import {
  DEFAULT_EXAM_MODE,
  FULL_DEFAULT_EXAM_SOURCES,
  SCHEDULE_SOURCES,
  buildGoogleSheetsEditUrl,
  parseGoogleSheetsUrl,
  type ExamModeSetting,
  type ExamScheduleSource,
  type ScheduleSource,
  type SourcesHistorySetting,
} from "@/lib/settings-shared";
import type { Prodi } from "@/types";

interface ScheduleSyncRecord {
  prodi: Prodi;
  spreadsheetId: string;
  sheetGid: string;
  rawEntries: number;
  normalizedEntries: number;
  lastSyncedAt: string;
}

interface ExamStatRecord {
  prodi: Prodi;
  type: "UTS" | "UAS";
  count: number;
  lastSyncedAt: string | null;
}

function getProdiName(prodi: Prodi): string {
  switch (prodi) {
    case "INFORMATIKA":
      return "S-1 Informatika";
    case "SAINS_DATA":
      return "S-1 Sains Data";
    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "S-1 Informatika PSDKU Kebumen";
    default:
      return prodi;
  }
}

export default function AdminSettingsPage() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const { mutate: globalMutate } = useSWRConfig();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [examMode, setExamMode] = useState<ExamModeSetting>(DEFAULT_EXAM_MODE);
  const [initialExamEnabled, setInitialExamEnabled] = useState<boolean>(DEFAULT_EXAM_MODE.enabled);
  const [scheduleSources, setScheduleSources] = useState<ScheduleSource[]>(SCHEDULE_SOURCES);
  const [examSources, setExamSources] = useState<ExamScheduleSource[]>(FULL_DEFAULT_EXAM_SOURCES);
  const [history, setHistory] = useState<SourcesHistorySetting | null>(null);
  const [scheduleSyncs, setScheduleSyncs] = useState<ScheduleSyncRecord[]>([]);
  const [examStats, setExamStats] = useState<ExamStatRecord[]>([]);

  const [activeTab, setActiveTab] = useState<"exam" | "schedule">("exam");
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Per-row states for URL paste, testing, and syncing
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [rowFeedback, setRowFeedback] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setExamMode(data.examMode ?? DEFAULT_EXAM_MODE);
        setInitialExamEnabled(Boolean(data.examMode?.enabled));
        setScheduleSources(data.scheduleSources ?? SCHEDULE_SOURCES);
        setExamSources(data.examSources ?? FULL_DEFAULT_EXAM_SOURCES);
        setHistory(data.history ?? null);
        setScheduleSyncs(data.scheduleSyncs ?? []);
        setExamStats(data.examStats ?? []);
      }
    } catch (err) {
      console.error("[AdminSettings] Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      void loadSettings();
    }
  }, [roleLoading, isAdmin]);

  async function handleSaveAll(silent = false): Promise<boolean> {
    try {
      setSaving(true);
      if (!silent) setBannerMessage(null);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examMode,
          scheduleSources,
          examSources,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan pengaturan.");
      }

      setHistory(data.history ?? null);
      setInitialExamEnabled(examMode.enabled);
      void globalMutate("/api/settings/public");

      if (!silent) {
        setBannerMessage({
          type: "success",
          text: "Seluruh pengaturan sistem & tautan Google Sheets berhasil disimpan.",
        });
      }
      return true;
    } catch (err) {
      setBannerMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleRollback() {
    if (!history || rollingBack) return;
    try {
      setRollingBack(true);
      setBannerMessage(null);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengembalikan konfigurasi.");
      }
      setScheduleSources(data.scheduleSources ?? SCHEDULE_SOURCES);
      setExamSources(data.examSources ?? FULL_DEFAULT_EXAM_SOURCES);
      setUrlInputs({});
      setBannerMessage({
        type: "success",
        text: "Berhasil mengembalikan tautan Google Sheets ke versi sebelumnya.",
      });
    } catch (err) {
      setBannerMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal melakukan rollback.",
      });
    } finally {
      setRollingBack(false);
    }
  }

  function handlePasteScheduleUrl(prodi: Prodi, rawUrl: string) {
    const key = `sched_${prodi}`;
    setUrlInputs((prev) => ({ ...prev, [key]: rawUrl }));
    const parsed = parseGoogleSheetsUrl(rawUrl);
    if (parsed) {
      setScheduleSources((prev) =>
        prev.map((item) =>
          item.prodi === prodi
            ? {
                ...item,
                spreadsheetId: parsed.spreadsheetId,
                gid: parsed.hasExplicitGid ? parsed.gid : item.gid,
              }
            : item,
        ),
      );
      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: true,
          message: `Terekstrak otomatis: ID ${parsed.spreadsheetId.slice(0, 12)}... • GID ${
            parsed.hasExplicitGid ? parsed.gid : "tetap"
          }`,
        },
      }));
    }
  }

  function handlePasteExamUrl(prodi: Prodi, type: "UTS" | "UAS", rawUrl: string) {
    const key = `exam_${prodi}_${type}`;
    setUrlInputs((prev) => ({ ...prev, [key]: rawUrl }));
    const parsed = parseGoogleSheetsUrl(rawUrl);
    if (parsed) {
      setExamSources((prev) =>
        prev.map((item) =>
          item.prodi === prodi && item.type === type
            ? {
                ...item,
                spreadsheetId: parsed.spreadsheetId,
                gid: parsed.hasExplicitGid ? parsed.gid : item.gid,
              }
            : item,
        ),
      );
      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: true,
          message: `Terekstrak otomatis: ID ${parsed.spreadsheetId.slice(0, 12)}... • GID ${
            parsed.hasExplicitGid ? parsed.gid : "tetap"
          }`,
        },
      }));
    }
  }

  async function handleTestConnection(params: {
    key: string;
    mode: "schedule" | "exam";
    prodi: Prodi;
    examType?: "UTS" | "UAS";
    spreadsheetId: string;
    gid: string;
  }) {
    try {
      setTestingKey(params.key);
      setRowFeedback((prev) => {
        const copy = { ...prev };
        delete copy[params.key];
        return copy;
      });

      const res = await fetch("/api/admin/settings/test-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();

      setRowFeedback((prev) => ({
        ...prev,
        [params.key]: {
          ok: Boolean(res.ok && data.success && data.parsedCount > 0),
          message: data.message || data.error || "Gagal menguji koneksi.",
        },
      }));
    } catch (err) {
      setRowFeedback((prev) => ({
        ...prev,
        [params.key]: {
          ok: false,
          message: err instanceof Error ? err.message : "Gagal menghubungi server.",
        },
      }));
    } finally {
      setTestingKey(null);
    }
  }

  async function handleSaveAndSyncSchedule(source: ScheduleSource) {
    const key = `sched_${source.prodi}`;
    try {
      setSyncingKey(key);
      const saved = await handleSaveAll(true);
      if (!saved) return;

      const res = await fetch(`/api/schedule/sync?prodi=${source.prodi}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal sinkronisasi jadwal kuliah.");
      }

      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: true,
          message: `Tersimpan & tersinkron! ${data.insertedEntries ?? data.normalizedEntries ?? 0} sesi jadwal kuliah diperbarui.`,
        },
      }));
      await loadSettings();
    } catch (err) {
      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          message: err instanceof Error ? err.message : "Gagal sinkronisasi jadwal.",
        },
      }));
    } finally {
      setSyncingKey(null);
    }
  }

  async function handleSaveAndSyncExam(source: ExamScheduleSource) {
    const key = `exam_${source.prodi}_${source.type}`;
    try {
      setSyncingKey(key);
      const saved = await handleSaveAll(true);
      if (!saved) return;

      const res = await fetch("/api/schedule/exam/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodi: source.prodi,
          type: source.type,
          spreadsheetId: source.spreadsheetId,
          gid: source.gid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal sinkronisasi jadwal ujian.");
      }

      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: true,
          message: `Tersimpan & tersinkron! ${data.totalCount ?? 0} sesi ujian ${source.type} berhasil dimuat.`,
        },
      }));
      await loadSettings();
    } catch (err) {
      setRowFeedback((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          message: err instanceof Error ? err.message : "Gagal sinkronisasi ujian.",
        },
      }));
    } finally {
      setSyncingKey(null);
    }
  }

  if (!roleLoading && !isAdmin) {
    return (
      <DashboardFrame>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-liquid-text dark:text-slate-100">
            Akses Terbatas: Khusus Administrator
          </h1>
          <p className="mt-2.5 text-sm text-liquid-text-secondary dark:text-slate-400">
            Halaman pengaturan sistem dan konfigurasi sumber Google Sheets hanya dapat diakses oleh
            Administrator atau Owner TaskPanel FATISDA.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
            >
              Kembali ke Dashboard Utama
            </Link>
          </div>
        </div>
      </DashboardFrame>
    );
  }

  const justTurnedOnExam = examMode.enabled && !initialExamEnabled;

  return (
    <DashboardFrame>
      <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5 pb-16 sm:space-y-6">
        {/* Page Header */}
        <div className="flex w-full max-w-full min-w-0 flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 sm:h-12 sm:w-12">
              <Settings2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  Pengaturan Sistem &amp; Sumber Jadwal
                </h1>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                  Admin Control
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Kelola visibilitas widget Mode Ujian di Overview dan atur tautan Google Sheets tanpa
                perlu mengubah kode sumber.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSaveAll(false)}
            disabled={saving || loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400 sm:w-auto"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
          </button>
        </div>

        {/* Status Feedback Banner */}
        {bannerMessage && (
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium transition-all ${
              bannerMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                : bannerMessage.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-[11px] font-bold underline opacity-75 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        {/* SECTION 1: EXAM MODE TOGGLE */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800/80 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    examMode.enabled
                      ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Mode Ujian &amp; Reminder Overview Utama
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Saat aktif, kartu pengingat jadwal ujian akan tampil paling atas di halaman
                    Overview seluruh mahasiswa.
                  </p>
                </div>
              </div>

              {/* iOS-style Sliding Toggle Switch */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span
                  className={`text-xs font-bold ${
                    examMode.enabled
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {examMode.enabled ? "MODE UJIAN AKTIF" : "NONAKTIF"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={examMode.enabled}
                  onClick={() =>
                    setExamMode((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                    examMode.enabled
                      ? "bg-amber-500 shadow-inner"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      examMode.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
            {/* Left Controls */}
            <div className="space-y-4 lg:col-span-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Periode Ujian Aktif
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
                  {(["UTS", "UAS"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExamMode((prev) => ({ ...prev, activeType: t }))}
                      className={`rounded-xl py-2.5 text-xs font-bold transition ${
                        examMode.activeType === t
                          ? "bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {t === "UTS" ? "UTS (Tengah Semester)" : "UAS (Akhir Semester)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="semester-label-input"
                  className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Label Semester pada Kartu Ujian
                </label>
                <input
                  id="semester-label-input"
                  type="text"
                  value={examMode.semesterLabel}
                  onChange={(e) =>
                    setExamMode((prev) => ({ ...prev, semesterLabel: e.target.value }))
                  }
                  placeholder="Contoh: Semester Genap 2025/2026"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-amber-500"
                />
              </div>

              {justTurnedOnExam && (
                <div className="rounded-2xl border border-amber-300/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-2">
                      <p className="font-semibold">
                        Mode Ujian baru saja diaktifkan! Jangan lupa klik{" "}
                        <strong>Simpan Semua Pengaturan</strong> atau langsung sinkronkan jadwal{" "}
                        {examMode.activeType} terbaru.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const targetSource = examSources.find(
                            (s) => s.prodi === "INFORMATIKA" && s.type === examMode.activeType,
                          );
                          if (targetSource) {
                            void handleSaveAndSyncExam(targetSource);
                          } else {
                            void handleSaveAll(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-amber-500"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Simpan &amp; Sinkronkan {examMode.activeType} Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Live Mini-Preview */}
            <div className="lg:col-span-6">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Live Preview di Overview Utama</span>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  {examMode.enabled ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-emerald-500" />
                      Tampil ke Mahasiswa
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                      Disembunyikan
                    </>
                  )}
                </span>
              </div>

              {examMode.enabled ? (
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 p-4 shadow-xs transition-all dark:border-amber-900/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Jadwal {examMode.activeType} Terdekat
                        </span>
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                          Kelas A • Sem 2
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {examMode.semesterLabel || "Semester Genap 2025/2026"} • Sesuai kalender
                        ujian resmi
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-amber-200/50 bg-white/80 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span>Contoh: Struktur Data</span>
                      <span className="text-amber-600 dark:text-amber-400">07:30 - 09:15 WIB</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Ruang Pasca 1312 (Lt.3) • Durasi 105 menit
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-[132px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                  <EyeOff className="h-6 w-6 text-slate-400" />
                  <p className="mt-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Kartu Ujian Disembunyikan dari Overview
                  </p>
                  <p className="mt-0.5 max-w-xs text-[11px] text-slate-400 dark:text-slate-500">
                    Mahasiswa hanya melihat ringkasan jadwal kuliah reguler dan daftar tugas aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: DYNAMIC GOOGLE SHEETS SOURCES */}
        <section className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex w-full max-w-full min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                  Sumber Data Google Sheets (Jadwal &amp; Ujian)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tempel link Google Sheets lengkap untuk mengisi{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-800">
                    Spreadsheet ID
                  </code>{" "}
                  dan{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-800">
                    GID
                  </code>{" "}
                  secara otomatis.
                </p>
              </div>
            </div>

            {history && (
              <button
                type="button"
                onClick={() => void handleRollback()}
                disabled={rollingBack}
                title={`Disimpan pada ${formatWib(history.savedAt, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 sm:w-auto"
              >
                {rollingBack ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>Rollback Link Sebelumnya</span>
              </button>
            )}
          </div>

          {/* Sub-navigation Tabs */}
          <div className="w-full max-w-full min-w-0 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800/80 dark:bg-slate-800/40 sm:px-6">
            <div className="no-scrollbar flex w-full max-w-full min-w-0 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("exam")}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "exam"
                    ? "bg-white text-amber-600 shadow-xs dark:bg-slate-900 dark:text-amber-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Spreadsheet Jadwal Ujian (UTS / UAS)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "schedule"
                    ? "bg-white text-sky-600 shadow-xs dark:bg-slate-900 dark:text-sky-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span>Spreadsheet Jadwal Kuliah Reguler</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full max-w-full min-w-0 divide-y divide-slate-100 dark:divide-slate-800/80">
            {activeTab === "exam"
              ? examSources.map((source) => {
                  const key = `exam_${source.prodi}_${source.type}`;
                  const stat = examStats.find(
                    (s) => s.prodi === source.prodi && s.type === source.type,
                  );
                  const feedback = rowFeedback[key];
                  const sheetUrl = buildGoogleSheetsEditUrl(source.spreadsheetId, source.gid);

                  return (
                    <div key={key} className="w-full max-w-full min-w-0 space-y-4 p-4 sm:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                              source.type === "UTS"
                                ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                : "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                            }`}
                          >
                            {source.type}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {getProdiName(source.prodi)}
                          </h3>
                          {stat ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {stat.count} sesi di DB
                              {stat.lastSyncedAt
                                ? ` • Sync ${formatWib(stat.lastSyncedAt, {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              Belum disinkronkan
                            </span>
                          )}
                        </div>

                        {sheetUrl && (
                          <a
                            href={sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:self-auto"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Buka di Google Sheets
                          </a>
                        )}
                      </div>

                      {/* Smart Full URL Paste Input */}
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <Link2 className="h-3.5 w-3.5 text-amber-500" />
                          Tempel Link Google Sheets Lengkap (Otomatis Ekstrak ID &amp; GID)
                        </label>
                        <input
                          type="url"
                          value={urlInputs[key] ?? ""}
                          onChange={(e) =>
                            handlePasteExamUrl(source.prodi, source.type, e.target.value)
                          }
                          placeholder="https://docs.google.com/spreadsheets/d/1zLsq5rA_s5no2oMH.../edit?gid=524464654#gid=524464654"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                        />
                      </div>

                      {/* Manual ID & GID Fields + Action Buttons */}
                      <div className="grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-6">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Spreadsheet ID
                          </label>
                          <input
                            type="text"
                            value={source.spreadsheetId}
                            onChange={(e) =>
                              setExamSources((prev) =>
                                prev.map((item) =>
                                  item.prodi === source.prodi && item.type === source.type
                                    ? { ...item, spreadsheetId: e.target.value.trim() }
                                    : item,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Sheet GID (Tab)
                          </label>
                          <input
                            type="text"
                            value={source.gid}
                            onChange={(e) =>
                              setExamSources((prev) =>
                                prev.map((item) =>
                                  item.prodi === source.prodi && item.type === source.type
                                    ? { ...item, gid: e.target.value.trim() }
                                    : item,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-4">
                          <button
                            type="button"
                            onClick={() =>
                              void handleTestConnection({
                                key,
                                mode: "exam",
                                prodi: source.prodi,
                                examType: source.type,
                                spreadsheetId: source.spreadsheetId,
                                gid: source.gid,
                              })
                            }
                            disabled={testingKey === key || syncingKey === key}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {testingKey === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            <span>Test</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSaveAndSyncExam(source)}
                            disabled={syncingKey === key || testingKey === key}
                            className="inline-flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 disabled:opacity-50"
                          >
                            {syncingKey === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>Simpan &amp; Sync</span>
                          </button>
                        </div>
                      </div>

                      {feedback && (
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                            feedback.ok
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                          }`}
                        >
                          {feedback.ok ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          )}
                          <span>{feedback.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              : scheduleSources.map((source) => {
                  const key = `sched_${source.prodi}`;
                  const syncInfo = scheduleSyncs.find((s) => s.prodi === source.prodi);
                  const feedback = rowFeedback[key];
                  const sheetUrl = buildGoogleSheetsEditUrl(source.spreadsheetId, source.gid);

                  return (
                    <div key={key} className="w-full max-w-full min-w-0 space-y-4 p-4 sm:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-sky-500/15 px-2.5 py-1 text-xs font-extrabold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                            KULIAH REGULER
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {getProdiName(source.prodi)}
                          </h3>
                          {syncInfo ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {syncInfo.normalizedEntries} sesi • Sync{" "}
                              {formatWib(syncInfo.lastSyncedAt, {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              <History className="h-3 w-3" />
                              Menggunakan sumber bawaan
                            </span>
                          )}
                        </div>

                        {sheetUrl && (
                          <a
                            href={sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:self-auto"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Buka di Google Sheets
                          </a>
                        )}
                      </div>

                      {/* Smart Full URL Paste Input */}
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <Link2 className="h-3.5 w-3.5 text-sky-500" />
                          Tempel Link Google Sheets Lengkap (Otomatis Ekstrak ID &amp; GID)
                        </label>
                        <input
                          type="url"
                          value={urlInputs[key] ?? ""}
                          onChange={(e) => handlePasteScheduleUrl(source.prodi, e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1zLsq5rA_s5no2oMH.../edit?gid=418762168#gid=418762168"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                        />
                      </div>

                      {/* Manual ID & GID Fields + Action Buttons */}
                      <div className="grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-6">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Spreadsheet ID
                          </label>
                          <input
                            type="text"
                            value={source.spreadsheetId}
                            onChange={(e) =>
                              setScheduleSources((prev) =>
                                prev.map((item) =>
                                  item.prodi === source.prodi
                                    ? { ...item, spreadsheetId: e.target.value.trim() }
                                    : item,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Sheet GID (Tab)
                          </label>
                          <input
                            type="text"
                            value={source.gid}
                            onChange={(e) =>
                              setScheduleSources((prev) =>
                                prev.map((item) =>
                                  item.prodi === source.prodi
                                    ? { ...item, gid: e.target.value.trim() }
                                    : item,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-4">
                          <button
                            type="button"
                            onClick={() =>
                              void handleTestConnection({
                                key,
                                mode: "schedule",
                                prodi: source.prodi,
                                spreadsheetId: source.spreadsheetId,
                                gid: source.gid,
                              })
                            }
                            disabled={testingKey === key || syncingKey === key}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {testingKey === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            <span>Test</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSaveAndSyncSchedule(source)}
                            disabled={syncingKey === key || testingKey === key}
                            className="inline-flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-500 disabled:opacity-50"
                          >
                            {syncingKey === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>Simpan &amp; Sync</span>
                          </button>
                        </div>
                      </div>

                      {feedback && (
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                            feedback.ok
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                          }`}
                        >
                          {feedback.ok ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          )}
                          <span>{feedback.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </section>

        {/* Section 4: Ruang Kelas & Spreadsheet Kelompok */}
        <section className="rounded-3xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                  Sumber Google Sheets Kelompok per Kelas
                </h2>
                <p className="text-xs leading-relaxed text-liquid-text-secondary dark:text-slate-400">
                  Pembagian kelompok tugas dan direktori pengurus kelas diisolasi per Program Studi, Kelas, dan Semester. Admin, Ketua Angkatan, maupun PJ Kelas masing-masing dapat menautkan dan menyinkronkan link spreadsheet kelas secara langsung melalui Ruang Kelas.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/class"
              className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-500"
            >
              <Settings2 className="h-4 w-4" />
              <span>Kelola di Ruang Kelas</span>
            </Link>
          </div>
        </section>
      </div>
    </DashboardFrame>
  );
}


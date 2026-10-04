"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Hash,
  HelpCircle,
  Layers,
  Link2,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { useRole } from "@/hooks/useRole";
import { formatWib } from "@/lib/datetime";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import type { Prodi } from "@/types";

function formatProdiName(prodi: string | null) {
  switch (prodi) {
    case "INFORMATIKA":
      return "S-1 Informatika";
    case "SAINS_DATA":
      return "S-1 Sains Data";
    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "S-1 Informatika PSDKU Kebumen";
    default:
      return "Belum Memilih Prodi";
  }
}

function formatDate(dateString: string) {
  return formatWib(dateString, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFeedbackCategoryLabel(cat: string) {
  switch (cat) {
    case "BUG":
      return { label: "Bug / Error", color: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400" };
    case "JADWAL":
      return { label: "Jadwal", color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" };
    case "TUGAS":
      return { label: "Tugas", color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" };
    case "FEATURE":
      return { label: "Ide Fitur", color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" };
    default:
      return { label: "Masukan Umum", color: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400" };
  }
}

export default function AdminAnalyticsPage() {
  const { roles, canAccessAnalytics, isLoading: roleLoading } = useRole();
  const { analytics, isLoading, isValidating, mutate } = useAdminAnalytics();

  // Role Gate: Hanya ADMIN, OWNER, dan KETUA_ANGKATAN
  if (!roleLoading && !canAccessAnalytics) {
    return (
      <DashboardFrame>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-liquid-text dark:text-slate-100">
            Akses Terbatas: Hanya Pengurus &amp; Admin
          </h1>
          <p className="mt-2.5 text-sm text-liquid-text-secondary dark:text-slate-400">
            Halaman analitik dan pemantauan platform ini hanya dapat diakses oleh akun dengan hak istimewa
            Administrator, Owner, atau Ketua Angkatan FATISDA 2026.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition"
            >
              Kembali ke Dashboard Utama
            </Link>
          </div>
        </div>
      </DashboardFrame>
    );
  }

  const totalUsers = analytics?.users.total ?? 0;
  const totalDiscordMembers = analytics?.users.discordGuildMembersTotal ?? totalUsers;
  const googleOnly = analytics?.users.googleOnly ?? 0;
  const discordOnly = analytics?.users.discordOnly ?? 0;
  const linkedBoth = analytics?.users.linkedBoth ?? 0;

  // Persentase Provider di antara mahasiswa yang aktif mengakses TaskPanel
  const googleTotal = googleOnly + linkedBoth;
  const discordTotal = discordOnly + linkedBoth;
  const googlePct = totalUsers > 0 ? Math.round((googleTotal / totalUsers) * 100) : 0;
  const discordPct = totalUsers > 0 ? Math.round((discordTotal / totalUsers) * 100) : 0;
  const linkedPct = totalUsers > 0 ? Math.round((linkedBoth / totalUsers) * 100) : 0;

  // Persentase sebaran metode di web
  const googleOnlyPct = totalUsers > 0 ? Math.round((googleOnly / totalUsers) * 100) : 0;
  const discordOnlyPct = totalUsers > 0 ? Math.round((discordOnly / totalUsers) * 100) : 0;

  // Adopsi dari seluruh member server Discord
  const adoptionPct = totalDiscordMembers > 0 ? Math.round((totalUsers / totalDiscordMembers) * 100) : 100;

  return (
    <DashboardFrame>
      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 uppercase">
                Admin Console
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-liquid-text dark:text-slate-100 sm:text-3xl">
              Statistik Pengguna Aktif TaskPanel
            </h1>
            <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">
              Analitik murni mahasiswa yang telah login dan mengakses TaskPanel (bukan sekadar anggota Discord server).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void mutate()}
              disabled={isLoading || isValidating}
              className="inline-flex items-center gap-2 rounded-xl border border-liquid-border bg-white px-3.5 py-2 text-xs font-semibold text-liquid-text transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
              <span>{isValidating ? "Menyegarkan..." : "Segarkan Data"}</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && !analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70 p-5 dark:bg-slate-900/60" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-64 animate-pulse rounded-2xl bg-white/70 dark:bg-slate-900/60" />
              <div className="h-64 animate-pulse rounded-2xl bg-white/70 dark:bg-slate-900/60" />
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {analytics && (
          <>
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Users who accessed TaskPanel */}
              <div className="relative overflow-hidden rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                    Mahasiswa Aktif TaskPanel
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-liquid-text dark:text-slate-100">
                    {totalUsers}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">telah login web</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-liquid-text-secondary dark:text-slate-400">
                  <span>Dari <strong>{totalDiscordMembers}</strong> anggota Discord</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{adoptionPct}% adopsi</span>
                </div>
              </div>

              {/* Card 2: Google UNS Users */}
              <div className="relative overflow-hidden rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                    Akun Google UNS
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-liquid-text dark:text-slate-100">
                    {googleTotal}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ({googlePct}%)
                  </span>
                </div>
                <p className="mt-3 text-xs text-liquid-text-secondary dark:text-slate-400">
                  Terverifikasi email <code className="text-[11px] font-mono">@student.uns.ac.id</code>
                </p>
              </div>

              {/* Card 3: Discord Users */}
              <div className="relative overflow-hidden rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                    Login via Discord
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <Hash className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-liquid-text dark:text-slate-100">
                    {discordTotal}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    ({discordPct}%)
                  </span>
                </div>
                <p className="mt-3 text-xs text-liquid-text-secondary dark:text-slate-400">
                  Telah masuk &amp; sinkron ke TaskPanel
                </p>
              </div>

              {/* Card 4: Linked Both */}
              <div className="relative overflow-hidden rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                    Akun Tertaut Ganda
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    <Link2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-liquid-text dark:text-slate-100">
                    {linkedBoth}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    ({linkedPct}%)
                  </span>
                </div>
                <p className="mt-3 text-xs text-liquid-text-secondary dark:text-slate-400">
                  Google UNS &amp; Discord aktif
                </p>
              </div>
            </div>

            {/* Row 2: Adopsi Autentikasi & Progres Tugas */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Box 1: Status Adopsi Platform & Provider */}
              <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                      Distribusi Metode Autentikasi
                    </h2>
                    <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                      Rincian mahasiswa berdasarkan jalur masuk dan penautan akun
                    </p>
                  </div>
                  <UserCheck className="h-5 w-5 text-liquid-text-tertiary dark:text-slate-400" />
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="mt-6">
                  <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      style={{ width: `${linkedPct}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Tertaut Ganda: ${linkedBoth} (${linkedPct}%)`}
                    />
                    <div
                      style={{ width: `${googleOnlyPct}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Hanya Google UNS: ${googleOnly} (${googleOnlyPct}%)`}
                    />
                    <div
                      style={{ width: `${discordOnlyPct}%` }}
                      className="bg-indigo-500 transition-all duration-500"
                      title={`Hanya Discord: ${discordOnly} (${discordOnlyPct}%)`}
                    />
                  </div>

                  {/* Legend Grid */}
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                          Tertaut Ganda
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-amber-950 dark:text-amber-200">{linkedBoth}</p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400">{linkedPct}% pengguna</p>
                    </div>

                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                          Google UNS Saja
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-emerald-950 dark:text-emerald-200">{googleOnly}</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">{googleOnlyPct}% pengguna</p>
                    </div>

                    <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                          Discord Saja
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-indigo-950 dark:text-indigo-200">{discordOnly}</p>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400">{discordOnlyPct}% pengguna</p>
                    </div>
                  </div>

                  {/* Informational Callout */}
                  <div className="mt-5 rounded-xl border border-liquid-border/60 bg-slate-50/70 p-3 text-xs text-liquid-text-secondary dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <p className="font-semibold text-liquid-text dark:text-slate-200">
                      💡 Hanya Menghitung Mahasiswa yang Mengakses Web:
                    </p>
                    <p className="mt-1 leading-relaxed">
                      Metrik di atas murni mencatat mahasiswa yang telah login dan membuka aplikasi web TaskPanel.
                      Anggota server Discord yang belum pernah masuk ke aplikasi web tidak dimasukkan ke dalam analitik ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Statistik Manajemen Tugas */}
              <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                      Aktivitas &amp; Progres Tugas
                    </h2>
                    <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                      Ringkasan tugas kelas dan tugas pribadi di Kanban board
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-liquid-text-tertiary dark:text-slate-400" />
                </div>

                <div className="mt-6">
                  {/* Completion Rate Banner */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">
                        Tingkat Penyelesaian (Completion Rate)
                      </p>
                      <p className="text-2xl font-bold text-liquid-text dark:text-slate-100">
                        {analytics.tasks.completionRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Total Tugas</p>
                      <p className="text-2xl font-bold text-liquid-accent dark:text-sky-400">
                        {analytics.tasks.total}
                      </p>
                    </div>
                  </div>

                  {/* Status Breakdown Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
                      <div
                        style={{
                          width: `${analytics.tasks.total > 0 ? (analytics.tasks.byStatus.DONE / analytics.tasks.total) * 100 : 0}%`,
                        }}
                        className="bg-emerald-500"
                        title="Done"
                      />
                      <div
                        style={{
                          width: `${analytics.tasks.total > 0 ? (analytics.tasks.byStatus.IN_PROGRESS / analytics.tasks.total) * 100 : 0}%`,
                        }}
                        className="bg-sky-500"
                        title="In Progress"
                      />
                      <div
                        style={{
                          width: `${analytics.tasks.total > 0 ? (analytics.tasks.byStatus.NEED_REVIEW / analytics.tasks.total) * 100 : 0}%`,
                        }}
                        className="bg-amber-500"
                        title="Need Review"
                      />
                      <div
                        style={{
                          width: `${analytics.tasks.total > 0 ? (analytics.tasks.byStatus.TODO / analytics.tasks.total) * 100 : 0}%`,
                        }}
                        className="bg-slate-400"
                        title="Todo"
                      />
                    </div>
                  </div>

                  {/* 4 Status Chips */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-2.5 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                      <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">Selesai</p>
                      <p className="mt-1 text-lg font-bold text-emerald-900 dark:text-emerald-300">
                        {analytics.tasks.byStatus.DONE}
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-200/50 bg-sky-50/30 p-2.5 text-center dark:border-sky-900/30 dark:bg-sky-950/20">
                      <p className="text-[11px] font-medium text-sky-800 dark:text-sky-400">Dikerjakan</p>
                      <p className="mt-1 text-lg font-bold text-sky-900 dark:text-sky-300">
                        {analytics.tasks.byStatus.IN_PROGRESS}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-2.5 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
                      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">Review</p>
                      <p className="mt-1 text-lg font-bold text-amber-900 dark:text-amber-300">
                        {analytics.tasks.byStatus.NEED_REVIEW}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/50 bg-slate-50/40 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Belum Mulai</p>
                      <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
                        {analytics.tasks.byStatus.TODO}
                      </p>
                    </div>
                  </div>

                  {/* Scope & Collaboration Stats */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-liquid-text-secondary dark:border-slate-800 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>
                        Tugas Kelas: <strong className="text-liquid-text dark:text-slate-200">{analytics.tasks.byScope.CLASS}</strong>
                      </span>
                      <span>
                        Tugas Pribadi: <strong className="text-liquid-text dark:text-slate-200">{analytics.tasks.byScope.PERSONAL}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        Komentar: <strong className="text-liquid-text dark:text-slate-200">{analytics.tasks.totalComments}</strong>
                      </span>
                      <span>
                        Log Aktivitas: <strong className="text-liquid-text dark:text-slate-200">{analytics.tasks.totalActivities}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Sebaran Prodi & Sebaran Kelas */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sebaran Prodi */}
              <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                  Sebaran Program Studi (Prodi)
                </h2>
                <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                  Komposisi mahasiswa berdasarkan fakultas &amp; program studi
                </p>

                <div className="mt-5 space-y-4">
                  {(
                    [
                      { key: "INFORMATIKA", name: "S-1 Informatika", color: "bg-sky-500" },
                      { key: "SAINS_DATA", name: "S-1 Sains Data", color: "bg-indigo-500" },
                      {
                        key: "INFORMATIKA_PSDKU_KEBUMEN",
                        name: "S-1 Informatika PSDKU Kebumen",
                        color: "bg-teal-500",
                      },
                      { key: "UNASSIGNED", name: "Belum Mengisi Profil", color: "bg-slate-400" },
                    ] as const
                  ).map((prodiItem) => {
                    const count = analytics.users.byProdi[prodiItem.key] ?? 0;
                    const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                    return (
                      <div key={prodiItem.key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-liquid-text dark:text-slate-200">
                            {prodiItem.name}
                          </span>
                          <span className="text-liquid-text-secondary dark:text-slate-400">
                            <strong>{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${prodiItem.color} transition-all duration-500`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sebaran Kelas */}
              <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                  Sebaran Kelas Mahasiswa
                </h2>
                <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                  Jumlah mahasiswa terdaftar di tiap rombel kelas (A - E)
                </p>

                <div className="mt-5 space-y-3.5">
                  {(["A", "B", "C", "D", "E"] as const).map((k) => {
                    const count = analytics.users.byKelas[k] ?? 0;
                    const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                    return (
                      <div key={k} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 font-bold text-xs text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                          {k}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-liquid-text dark:text-slate-200">Kelas {k}</span>
                            <span className="text-liquid-text-secondary dark:text-slate-400">
                              {count} mhs ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-sky-500 transition-all duration-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Unassigned */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      -
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Belum Memilih Kelas</span>
                        <span className="text-liquid-text-secondary dark:text-slate-400">
                          {analytics.users.byKelas.UNASSIGNED ?? 0} mhs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Komunitas & Laporan Feedback */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Ekosistem Ringkas */}
              <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                  Ekosistem Akademik
                </h2>
                <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                  Modul, catatan materi, dan diskusi kelas
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                        <FolderGit2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-liquid-text dark:text-slate-200">Course Vault</p>
                        <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">Resource matkul tersimpan</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-liquid-text dark:text-slate-100">
                      {analytics.community.totalVaults}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-liquid-text dark:text-slate-200">Thread Diskusi</p>
                        <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">Topik tanya-jawab aktif</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-liquid-text dark:text-slate-100">
                      {analytics.community.totalDiscussions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-liquid-text dark:text-slate-200">Balasan Diskusi</p>
                        <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">Interaksi sesama mhs</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-liquid-text dark:text-slate-100">
                      {analytics.community.totalReplies}
                    </span>
                  </div>
                </div>
              </div>

              {/* Laporan Feedback & Bug Terbaru */}
              <div className="lg:col-span-2 rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                      Masukan &amp; Laporan Pengguna Terkini
                    </h2>
                    <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                      Total {analytics.community.feedback.total} masukan ({analytics.community.feedback.open} aktif,{" "}
                      {analytics.community.feedback.resolved} selesai)
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {analytics.community.feedback.recent.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 text-center text-xs text-liquid-text-secondary dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
                      Belum ada laporan atau masukan baru dari pengguna.
                    </div>
                  ) : (
                    analytics.community.feedback.recent.map((fb) => {
                      const badge = getFeedbackCategoryLabel(fb.category);
                      return (
                        <div
                          key={fb.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs font-semibold text-liquid-text dark:text-slate-200">
                                {fb.authorName || "Mahasiswa Anonim"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {formatDate(fb.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-liquid-text-secondary dark:text-slate-300">
                            {fb.message}
                          </p>
                          {fb.pageUrl && (
                            <p className="mt-1 text-[10px] text-slate-400 font-mono break-all">
                              Halaman: {fb.pageUrl}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Row 5: 12 Mahasiswa Terdaftar Terbaru */}
            <div className="rounded-2xl border border-liquid-border/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">
                    Pengguna Terdaftar Terbaru
                  </h2>
                  <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                    Daftar mahasiswa yang baru saja mengakses platform TaskPanel
                  </p>
                </div>
              </div>

              {/* Mobile View: Dedicated Card List (< sm) */}
              <div className="mt-4 space-y-3 sm:hidden">
                {analytics.users.recentUsers.map((u) => {
                  const isDualLinked = Boolean(u.googleId && u.discordId);
                  const isGoogleOnlyUser = Boolean(u.googleId && !u.discordId);
                  return (
                    <div
                      key={u.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      {/* Top: Avatar, Name, and Last Active */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.username}
                              className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-liquid-accent text-xs font-bold text-white shadow-2xs">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-liquid-text dark:text-slate-100 truncate">{u.username}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{u.nim || u.email || "No NIM"}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {u.lastActiveAt ? formatDate(u.lastActiveAt) : "Baru saja"}
                        </span>
                      </div>

                      {/* Middle: Method badge and Roles */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {isDualLinked ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 whitespace-nowrap">
                            <Link2 className="h-3 w-3 shrink-0" />
                            Dual-Auth (UNS + Discord)
                          </span>
                        ) : isGoogleOnlyUser ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 whitespace-nowrap">
                            <Mail className="h-3 w-3 shrink-0" />
                            Google UNS
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 whitespace-nowrap">
                            <Hash className="h-3 w-3 shrink-0" />
                            Discord
                          </span>
                        )}

                        {(u.roles && u.roles.length > 0 ? u.roles : ["STUDENT"]).map((r) => (
                          <span
                            key={r}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                              r === "ADMIN" || r === "OWNER"
                                ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20"
                                : r === "KETUA_ANGKATAN"
                                  ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20"
                                  : r === "PJ_KELAS" || r === "PJ_MATKUL"
                                    ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                            }`}
                          >
                            {r === "STUDENT" ? "Mahasiswa" : r.replace("_", " ")}
                          </span>
                        ))}
                      </div>

                      {/* Bottom: Academic Context */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                        <span className="truncate">{formatProdiName(u.prodi)}</span>
                        {u.kelas && (
                          <span className="shrink-0 ml-2 rounded-md border border-slate-200/60 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Kelas {u.kelas}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Data Table (>= sm) */}
              <div className="mt-5 hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-liquid-border text-[11px] font-semibold text-liquid-text-secondary dark:border-slate-800 dark:text-slate-400">
                      <th className="pb-3 pl-1 font-semibold whitespace-nowrap">Mahasiswa</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Metode Masuk</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Program Studi &amp; Kelas</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Peran</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Terakhir Aktif</th>
                      <th className="pb-3 pr-1 text-right font-semibold whitespace-nowrap">Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analytics.users.recentUsers.map((u) => {
                      const isDualLinked = Boolean(u.googleId && u.discordId);
                      const isGoogleOnlyUser = Boolean(u.googleId && !u.discordId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          {/* Nama & Avatar */}
                          <td className="py-3 pl-1">
                            <div className="flex items-center gap-2.5">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.username}
                                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-liquid-accent text-xs font-bold text-white shadow-2xs">
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-liquid-text dark:text-slate-200 whitespace-nowrap">{u.username}</p>
                                <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{u.nim || u.email || "No NIM"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Provider Badge */}
                          <td className="py-3">
                            {isDualLinked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 whitespace-nowrap">
                                <Link2 className="h-3 w-3 shrink-0" />
                                Dual-Auth (UNS + Discord)
                              </span>
                            ) : isGoogleOnlyUser ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 whitespace-nowrap">
                                <Mail className="h-3 w-3 shrink-0" />
                                Google UNS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 whitespace-nowrap">
                                <Hash className="h-3 w-3 shrink-0" />
                                Discord Server
                              </span>
                            )}
                          </td>

                          {/* Prodi & Kelas */}
                          <td className="py-3 whitespace-nowrap">
                            <span className="font-medium text-liquid-text dark:text-slate-300">
                              {formatProdiName(u.prodi)}
                            </span>
                            {u.kelas && (
                              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Kls {u.kelas}
                              </span>
                            )}
                          </td>

                          {/* Roles */}
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {(u.roles && u.roles.length > 0 ? u.roles : ["STUDENT"]).map((r) => (
                                <span
                                  key={r}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                    r === "ADMIN" || r === "OWNER"
                                      ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                      : r === "KETUA_ANGKATAN"
                                        ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                                        : r === "PJ_KELAS" || r === "PJ_MATKUL"
                                          ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
                                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {r === "STUDENT" ? "Mahasiswa" : r.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Terakhir Aktif */}
                          <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {u.lastActiveAt ? formatDate(u.lastActiveAt) : "Baru saja"}
                          </td>

                          {/* Waktu Bergabung */}
                          <td className="py-3 pr-1 text-right text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardFrame>
  );
}

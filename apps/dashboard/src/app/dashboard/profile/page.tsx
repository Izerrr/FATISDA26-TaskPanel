"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { 
  UserRound, 
  GraduationCap, 
  ShieldCheck, 
  Link2, 
  LogOut, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock, 
  Check, 
  BookOpen, 
  Mail, 
  RefreshCw,
  Sparkles,
  FileText,
  ExternalLink
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import { useGuild } from "@/components/providers/GuildProvider";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { ClassSelectorModal } from "@/components/dashboard/ClassSelectorModal";
import { AccountLinkingModal } from "@/components/dashboard/AccountLinkingModal";

export default function ProfilePage() {
  const { user, roles, isGoogle, mutate: mutateMe } = useRole();
  const { selectedGuild } = useGuild();
  const { tasks } = useTasks(selectedGuild);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [linkingModalOpen, setLinkingModalOpen] = useState(false);
  const [savingSemester, setSavingSemester] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats calculation
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "NEED_REVIEW").length;
  const personalTasks = tasks.filter((t) => t.scope === "PERSONAL").length;

  const isDiscordConnected = Boolean(user?.discordId || (!user?.id.startsWith("google_") && (user?.id.length ?? 0) > 5));
  const isGoogleConnected = Boolean(user?.googleId || user?.email?.endsWith("@student.uns.ac.id"));

  async function handleSemesterChange(sem: number) {
    if (savingSemester || user?.semester === sem) return;
    setSavingSemester(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: sem }),
      });
      if (res.ok) {
        await mutateMe?.();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Gagal menyimpan semester:", err);
    } finally {
      setSavingSemester(false);
    }
  }

  function getProdiTitle(prodi?: string | null) {
    switch (prodi) {
      case "INFORMATIKA":
        return "S1 Informatika";
      case "SAINS_DATA":
        return "S1 Sains Data";
      case "INFORMATIKA_PSDKU_KEBUMEN":
        return "S1 Informatika (PSDKU Kebumen)";
      default:
        return "Belum ditentukan";
    }
  }

  return (
    <DashboardFrame>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header / Identity Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-liquid-accent/15 dark:ring-sky-500/20 shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-2xl font-bold text-white shadow-sm">
                {(user?.username ?? "M").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {user?.username ?? "Mahasiswa FATISDA"}
                </h1>
                {roles.map((r) => (
                  <span
                    key={String(r)}
                    className="rounded-full bg-liquid-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300"
                  >
                    {r === "ADMIN" ? "Administrator" : r === "PJ_KELAS" ? "PJ Kelas" : r === "PJ_MATKUL" ? "PJ Matkul" : "Mahasiswa"}
                  </span>
                ))}
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {getProdiTitle(user?.prodi)} {user?.kelas ? `· Kelas ${user.kelas}` : ""}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Ubah Prodi / Kelas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLinkingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Penyambungan Akun</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-slate-400">Total Tugas</span>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTasks}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Dalam Proses</span>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{inProgressTasks}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Tugas Selesai</span>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{doneTasks}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400">Tugas Personal</span>
            <p className="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-300">{personalTasks}</p>
          </div>
        </section>

        {/* Academic Details Card */}
        <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <GraduationCap className="h-5 w-5 text-liquid-accent dark:text-sky-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Informasi Akademik</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Program Studi</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{getProdiTitle(user?.prodi)}</p>
            </div>

            <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kelas</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user?.kelas ? `Kelas ${user.kelas}` : "Belum ditentukan"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor Induk Mahasiswa (NIM)</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {user?.nim || "- (Tautkan Akun Google UNS)"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Student UNS</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.email || "- (Tautkan Akun Google UNS)"}
              </p>
            </div>
          </div>

          {/* Interactive Semester Selector */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Semester Perkuliahan Aktif
              </label>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <Check className="h-3.5 w-3.5" /> Tersimpan
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isActive = (user?.semester ?? 1) === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => handleSemesterChange(sem)}
                    disabled={savingSemester}
                    className={`flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-liquid-accent text-white shadow-sm ring-2 ring-liquid-accent/30 dark:ring-sky-500/30 scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-[10px] opacity-75 font-normal">Sem</span>
                    <span className="text-base">{sem}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Jadwal kuliah mingguan di dashboard akan otomatis disesuaikan dengan semester aktif yang kamu pilih.
            </p>
          </div>
        </section>

        {/* Connected Accounts Card */}
        <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Link2 className="h-5 w-5 text-liquid-accent dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Status Sambungan Akun</h2>
            </div>
            <button
              type="button"
              onClick={() => setLinkingModalOpen(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Kelola Tautan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Discord */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#5865F2] text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M20.3 4.7A19.7 19.7 0 0 0 15.6 3c-.2.4-.5.9-.7 1.3a18 18 0 0 0-5.8 0A9 9 0 0 0 8.4 3a19.6 19.6 0 0 0-4.7 1.7C1 9.4.3 14 .6 18.5a20 20 0 0 0 5.9 2.9c.5-.6.9-1.3 1.3-2a13 13 0 0 1-2-1c.2-.1.3-.3.5-.4 3.8 1.7 7.9 1.7 11.6 0l.5.4c-.6.4-1.3.7-2 1 .4.7.8 1.4 1.3 2a20 20 0 0 0 5.9-2.9c.4-5.2-.8-9.7-3.3-13.8ZM8.5 15.8c-1.1 0-2-1.1-2-2.3 0-1.3.9-2.3 2-2.3s2 1 2 2.3c0 1.2-.9 2.3-2 2.3Zm7 0c-1.1 0-2-1.1-2-2.3 0-1.3.9-2.3 2-2.3s2 1 2 2.3c0 1.2-.9 2.3-2 2.3Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Discord</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isDiscordConnected ? "Terhubung ke FATISDA 2026" : "Belum terhubung"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isDiscordConnected
                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isDiscordConnected ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Google UNS */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xs">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Google UNS</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user?.email || "Wajib @student.uns.ac.id"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isGoogleConnected
                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isGoogleConnected ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
        </section>

        {/* Ketentuan Layanan & Kebijakan Privasi */}
        <section className="rounded-3xl border border-liquid-border dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-liquid-accent dark:text-sky-400" />
              Syarat &amp; Ketentuan Layanan (T &amp; C)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pelajari hak akses mahasiswa, kode etik penggunaan, serta kebijakan privasi data FATISDA26-TaskPanel.
            </p>
          </div>
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shrink-0"
          >
            <span>Baca Dokumen T &amp; C</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </section>

        {/* Danger Zone: Logout */}
        <section className="rounded-3xl border border-red-200/80 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-900 dark:text-red-200">Sesi Akun</h3>
            <p className="text-xs text-red-700/80 dark:text-red-400">
              Keluar dari sesi TaskPanel pada perangkat ini. Kamu dapat masuk kembali kapan saja.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-95 transition shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar dari Akun</span>
          </button>
        </section>
      </div>

      <ClassSelectorModal
        open={classModalOpen}
        initialProdi={user?.prodi}
        initialKelas={user?.kelas}
        initialSemester={user?.semester}
        onClose={() => setClassModalOpen(false)}
        onSaved={() => {
          mutateMe?.();
          setClassModalOpen(false);
        }}
      />

      <AccountLinkingModal
        open={linkingModalOpen}
        user={user}
        onClose={() => {
          setLinkingModalOpen(false);
          mutateMe?.();
        }}
      />
    </DashboardFrame>
  );
}

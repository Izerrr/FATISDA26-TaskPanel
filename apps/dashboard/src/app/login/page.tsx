"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Kanban,
  Users,
  Bell,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { TaskPanelLogo } from "@/components/ui/TaskPanelLogo";

function LoginContent() {
  const [loadingProvider, setLoadingProvider] = useState<"discord" | "google" | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const searchParams = useSearchParams();

  const isExpired = searchParams.get("expired") === "inactivity" || searchParams.get("expired") === "1";
  const authError = searchParams.get("error");

  // Close comparison modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowComparison(false);
      }
    }
    if (showComparison) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showComparison]);

  const handleLogin = (provider: "discord" | "google") => {
    setLoadingProvider(provider);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative z-10 w-full max-w-sm px-6">
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <TaskPanelLogo className="h-16 w-16 drop-shadow-lg" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-liquid-text dark:text-slate-100">
            FATISDA 26
          </h1>
          <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">
            Panel tugas &amp; jadwal FATISDA UNS 2026
          </p>
        </div>

        {/* Error: Inactivity Expired */}
        {isExpired && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/50 p-3 text-left animate-in fade-in duration-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Sesi Berakhir</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Kamu keluar otomatis karena tidak ada aktivitas selama 24 jam. Silakan masuk kembali.
              </p>
            </div>
          </div>
        )}

        {/* Error: Invalid Domain for Google Login */}
        {authError === "invalid_domain" && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/50 p-3 text-left animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Domain Email Ditolak</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                Login Google hanya diizinkan untuk email resmi mahasiswa (berakhiran <strong>@student.uns.ac.id</strong>).
              </p>
            </div>
          </div>
        )}

        {/* Error: Generic OAuth or Access Denied */}
        {authError && authError !== "invalid_domain" && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/50 p-3 text-left animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-300">Gagal Masuk</p>
              <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed">
                Terjadi kendala saat proses autentikasi. Pastikan akun kamu sudah terdaftar atau tergabung di server.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <FeaturePill icon={<Kanban className="h-3.5 w-3.5" />} label="Task" />
          <FeaturePill icon={<Users className="h-3.5 w-3.5" />} label="Schedule" />
          <FeaturePill icon={<Bell className="h-3.5 w-3.5" />} label="Notification" />
        </div>

        {/* Action Buttons */}
        <div className="mt-7 space-y-3">
          {/* Discord Button */}
          <button
            type="button"
            onClick={() => handleLogin("discord")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#5865F2] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-[0.98] disabled:opacity-60"
          >
            {loadingProvider === "discord" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <DiscordIcon />
            )}
            <span>
              {loadingProvider === "discord" ? "Menghubungkan..." : "Lanjutkan dengan Discord"}
            </span>
            {loadingProvider === null && <ArrowRight className="h-4 w-4 opacity-70" />}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute bg-white/80 dark:bg-slate-900 px-3 text-[11px] font-medium text-liquid-text-tertiary dark:text-slate-500 backdrop-blur-sm">
              atau
            </span>
          </div>

          {/* Google Student Button */}
          <button
            type="button"
            onClick={() => handleLogin("google")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {loadingProvider === "google" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-slate-800 dark:border-t-white" />
            ) : (
              <GoogleIcon />
            )}
            <div className="flex flex-col text-left">
              <span className="leading-tight">
                {loadingProvider === "google" ? "Memproses..." : "Masuk dengan Akun UNS"}
              </span>
              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                @student.uns.ac.id
              </span>
            </div>
            {loadingProvider === null && <ArrowRight className="ml-auto h-4 w-4 opacity-50" />}
          </button>
        </div>

        {/* Comparison Trigger Pill */}
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowComparison(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
          >
            <HelpCircle className="h-3.5 w-3.5 text-liquid-accent dark:text-sky-400" />
            <span>Perbandingan Login Discord vs Google</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-liquid-text-secondary dark:text-slate-400">
          Akun Discord untuk akses pengurus, akun Google UNS untuk akses mahasiswa.
        </p>
      </div>

      <div className="mt-6 text-center text-[11px] text-liquid-text-tertiary dark:text-slate-500 space-y-1">
        <p>Dibangun untuk FATISDA UNS 2026</p>
        <p>
          Dengan masuk, Anda menyetujui{" "}
          <Link
            href="/terms"
            className="font-medium text-liquid-accent dark:text-sky-400 underline underline-offset-2 hover:opacity-80 transition"
          >
            Syarat &amp; Ketentuan
          </Link>
          {" "}serta{" "}
          <Link
            href="/privacy"
            className="font-medium text-liquid-accent dark:text-sky-400 underline underline-offset-2 hover:opacity-80 transition"
          >
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>

      {/* Comparison Modal Dialog */}
      {showComparison && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowComparison(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="comparison-title" className="text-lg font-bold text-liquid-text dark:text-slate-100">
                  Perbandingan Metode Masuk
                </h2>
                <p className="mt-0.5 text-xs text-liquid-text-secondary dark:text-slate-400">
                  Sesuaikan dengan kebutuhan dan status kamu di angkatan 2026.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Tutup perbandingan"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comparison Cards */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Option 1: Discord */}
              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5865F2] text-white">
                    <DiscordIcon />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Discord</h3>
                    <span className="rounded bg-[#5865F2]/10 dark:bg-[#5865F2]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#5865F2] dark:text-indigo-300">
                      Akses Lengkap
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Role sinkron otomatis (PJ Kelas, PJ Matkul, Admin).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Bisa membuat tugas kelas baru (jika PJ/Admin).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Notifikasi tugas via Discord Bot &amp; Webhook.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Kelola materi kuliah di vault.</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 text-[10px] text-slate-500 dark:text-slate-400">
                  Syarat: Terdaftar di server Discord FATISDA 2026.
                </div>
              </div>

              {/* Option 2: Google Student */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600">
                    <GoogleIcon />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Akun Google UNS</h3>
                    <span className="rounded bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:text-sky-300">
                      Akses Mahasiswa
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Lihat jadwal kuliah lengkap &amp; tugas kelas.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Buat &amp; kelola tugas personal (catatan pribadi).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>Pilih prodi dan kelas secara mandiri di dashboard.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400 dark:text-slate-500">
                    <X className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>Tidak bisa membuat tugas kelas / role pengurus.</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                  Syarat: Email resmi <strong>@student.uns.ac.id</strong>.
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 shadow transition-all hover:opacity-90 active:scale-95"
              >
                Sudah Paham
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-liquid-bg dark:bg-slate-950">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-liquid-accent/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-liquid-teal/10 blur-[100px]" />

      <Suspense fallback={<div className="h-96 w-full max-w-sm rounded-3xl bg-white/50 dark:bg-slate-900/50 animate-pulse" />}>
        <LoginContent />
      </Suspense>
    </main>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-black/[0.03] dark:bg-slate-800/80 px-3 py-1.5 text-[11px] font-medium text-liquid-text-secondary dark:text-slate-300">
      {icon}
      {label}
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M20.3 4.7A19.7 19.7 0 0 0 15.6 3c-.2.4-.5.9-.7 1.3a18 18 0 0 0-5.8 0A9 9 0 0 0 8.4 3a19.6 19.6 0 0 0-4.7 1.7C1 9.4.3 14 .6 18.5a20 20 0 0 0 5.9 2.9c.5-.6.9-1.3 1.3-2a13 13 0 0 1-2-1c.2-.1.3-.3.5-.4 3.8 1.7 7.9 1.7 11.6 0l.5.4c-.6.4-1.3.7-2 1 .4.7.8 1.4 1.3 2a20 20 0 0 0 5.9-2.9c.4-5.2-.8-9.7-3.3-13.8ZM8.5 15.8c-1.1 0-2-1.1-2-2.3 0-1.3.9-2.3 2-2.3s2 1 2 2.3c0 1.2-.9 2.3-2 2.3Zm7 0c-1.1 0-2-1.1-2-2.3 0-1.3.9-2.3 2-2.3s2 1 2 2.3c0 1.2-.9 2.3-2 2.3Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

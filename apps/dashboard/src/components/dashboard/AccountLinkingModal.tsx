import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { X, CheckCircle2, AlertCircle, Link2, ArrowRight } from "lucide-react";
import type { User } from "@/types";

interface AccountLinkingModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function AccountLinkingModal({ open, user, onClose }: AccountLinkingModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<"discord" | "google" | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !loadingProvider) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loadingProvider, onClose]);

  if (!open || !user) return null;

  const isDiscordConnected = Boolean(user.discordId || (!user.id.startsWith("google_") && user.id.length > 5));
  const isGoogleConnected = Boolean(user.googleId || user.email?.endsWith("@student.uns.ac.id"));

  async function handleLink(provider: "discord" | "google") {
    if (!user) return;
    setLoadingProvider(provider);

    try {
      // Buat signed session intent di server (httpOnly cookie)
      const res = await fetch("/api/auth/link-intent", { method: "POST" });
      if (!res.ok) {
        throw new Error("Gagal menginisialisasi penautan akun");
      }

      // Trigger OAuth NextAuth
      signIn(provider, { callbackUrl: `/dashboard?linked=${provider}` });
    } catch (err) {
      console.error("[AccountLinkingModal] Error starting link:", err);
      setLoadingProvider(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="linking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        if (!loadingProvider) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="linking-modal-title" className="text-base font-bold text-liquid-text dark:text-slate-100">
                Penyambungan Akun (Sync)
              </h2>
              <p className="text-xs text-liquid-text-secondary dark:text-slate-400">
                Hubungkan akun Discord dan Google UNS agar semua tugas terintegrasi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loadingProvider !== null}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:text-slate-300 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Card List */}
        <div className="mt-5 space-y-3.5">
          {/* 1. Discord Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2] text-white shrink-0">
                <DiscordIcon />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Akun Discord</h3>
                  {isDiscordConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Belum Ditautkan
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {isDiscordConnected
                    ? "Tersambung dengan server FATISDA 2026."
                    : "Tautkan untuk menyinkronkan tugas kelas & role pengurus."}
                </p>
              </div>
            </div>

            {!isDiscordConnected && (
              <button
                type="button"
                onClick={() => handleLink("discord")}
                disabled={loadingProvider !== null}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5865F2] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#4752C4] active:scale-95 disabled:opacity-60 shrink-0"
              >
                <span>{loadingProvider === "discord" ? "Menghubungkan..." : "Tautkan Discord"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. Google Student Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xs shrink-0">
                <GoogleIcon />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Akun Google UNS</h3>
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Belum Ditautkan
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {user.email ? user.email : "Wajib menggunakan email resmi @student.uns.ac.id."}
                </p>
              </div>
            </div>

            {!isGoogleConnected && (
              <button
                type="button"
                onClick={() => handleLink("google")}
                disabled={loadingProvider !== null}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-60 shrink-0"
              >
                <span>{loadingProvider === "google" ? "Memproses..." : "Tautkan Google UNS"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-sky-100 dark:border-sky-950 bg-sky-50/70 dark:bg-sky-950/30 p-3 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
          <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
            Setelah ditautkan, kamu dapat login dengan akun Google ataupun Discord. Seluruh catatan, tugas personal,
            jadwal, dan peran kamu akan otomatis termuat sama persis di kedua metode login.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingProvider !== null}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
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

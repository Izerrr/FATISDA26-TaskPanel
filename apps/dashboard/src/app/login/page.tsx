"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Kanban, Users, Bell, ArrowRight, AlertTriangle } from "lucide-react";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "inactivity" || searchParams.get("expired") === "1";

  return (
    <div className="relative z-10 w-full max-w-sm px-6">
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-liquid-accent text-white shadow-lg shadow-liquid-accent/20">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-liquid-text">FATISDA 26</h1>
          <p className="mt-1 text-sm text-liquid-text-secondary">Panel tugas FATISDA UNS 2026</p>
        </div>

        {isExpired && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/50 p-3 text-left animate-in fade-in duration-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Sesi Berakhir</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">Kamu keluar otomatis karena tidak ada aktivitas selama 24 jam. Silakan masuk kembali dengan akun Discord kamu.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          <FeaturePill icon={<Kanban className="h-3.5 w-3.5" />} label="Task" />
          <FeaturePill icon={<Users className="h-3.5 w-3.5" />} label="Schedule" />
          <FeaturePill icon={<Bell className="h-3.5 w-3.5" />} label="Notification" />
        </div>

        <button
          onClick={() => {
            setLoading(true);
            signIn("discord", { callbackUrl: "/dashboard" });
          }}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#5865F2] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <DiscordIcon />}
          {loading ? "Menghubungkan..." : "Lanjutkan dengan Discord"}
          {!loading && <ArrowRight className="h-4 w-4 opacity-70" />}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-liquid-text-secondary">Kamu perlu bergabung di server Discord yang terhubung dengan panel ini.</p>
      </div>

      <p className="mt-6 text-center text-[11px] text-liquid-text-tertiary">Dibangun untuk FATISDA 2026</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-liquid-bg">
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
    <div className="flex items-center gap-1.5 rounded-full bg-black/[0.03] px-3 py-1.5 text-[11px] font-medium text-liquid-text-secondary">
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

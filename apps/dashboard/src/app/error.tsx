"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-liquid-bg dark:bg-slate-950 px-4 text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-md text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs mb-6 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Kendala Sistem
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Terjadi Kesalahan Tak Terduga
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Sistem mendeteksi kendala saat memproses permintaan ini. Data sesi dan preferensi Anda tetap aman tersimpan.
        </p>

        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Kode Diagnostik: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-slate-900 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Coba Muat Ulang</span>
          </button>
          <Link
            href="/dashboard"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="mt-10 border-t border-slate-200 dark:border-slate-800/80 pt-6">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Jika kendala berlanjut, laporkan melalui tombol masukan di bilah samping dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

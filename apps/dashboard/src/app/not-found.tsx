import Link from "next/link";
import { Compass, LayoutDashboard, Calendar, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-liquid-bg dark:bg-slate-950 px-4 text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-md text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-liquid-border dark:border-slate-800 shadow-xs mb-6 text-slate-700 dark:text-slate-300">
          <Compass className="h-7 w-7 text-sky-600 dark:text-sky-400" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          Galat 404
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Tautan yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamat URL yang dimasukkan kurang tepat.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-slate-900 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/dashboard/schedule"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition active:scale-95"
          >
            <Calendar className="h-4 w-4" />
            <span>Lihat Jadwal Kuliah</span>
          </Link>
        </div>

        <div className="mt-10 border-t border-slate-200 dark:border-slate-800/80 pt-6">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            FATISDA TaskPanel • Fakultas Teknologi Informasi dan Sains Data UNS 2026
          </p>
        </div>
      </div>
    </div>
  );
}

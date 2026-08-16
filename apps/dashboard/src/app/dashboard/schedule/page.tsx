"use client";

import Link from "next/link";
import { CalendarDays, Clock3, Info } from "lucide-react";

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-liquid-bg p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-liquid-text-secondary">
                Akademik
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-liquid-text">
                Jadwal Kuliah
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-liquid-text-secondary">
                Halaman jadwal akan menjadi sumber utama jadwal perkuliahan FATISDA 2026. Data akan difilter otomatis berdasarkan prodi dan kelas pengguna.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-bold text-liquid-text">
              Minggu berjalan
            </h2>
            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">
              Tampilan jadwal mingguan akan ditambahkan setelah sumber data resmi terhubung.
            </p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-bold text-liquid-text">
              Hari ini
            </h2>
            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">
              Jadwal hari ini akan otomatis muncul di Overview setelah sinkronisasi aktif.
            </p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-bold text-liquid-text">
              Sumber data
            </h2>
            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">
              Sinkronisasi resmi akan menggunakan konfigurasi ScheduleSync pada database.
            </p>
          </div>
        </section>

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          Kembali ke Overview
        </Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { MessageSquare, Users, BookOpen, Sparkles, ArrowLeft, Bot } from "lucide-react";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";

export default function DiscussionsPage() {
  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-liquid-border bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-6 shadow-glass md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-liquid-accent/10 text-liquid-accent shadow-sm">
                <MessageSquare className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-liquid-text md:text-2xl">Forum Diskusi</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    <Sparkles className="h-3 w-3" />
                    Segera Hadir
                  </span>
                </div>

                <p className="mt-2 max-w-xl text-xs leading-relaxed text-liquid-text-secondary sm:text-sm">
                  Ruang diskusi terpadu yang terhubung langsung ke Discord server FATISDA 2026. Berbagi catatan, bertanya materi sulit, dan koordinasi tugas kelompok dalam satu tempat.
                </p>
              </div>
            </div>

            <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </Link>
          </div>
        </section>

        {/* Feature Teasers */}
        <section className="grid gap-5 md:grid-cols-3">
          <div className="group rounded-2xl border border-liquid-border bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-liquid-text">Thread Tugas Kelas</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-liquid-text-secondary">Setiap tugas kelas yang dibuat di TaskPanel otomatis membuka thread obrolan khusus untuk diskusi deadline dan pembagian kelompok.</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
              <span>Preview Fitur</span>
            </div>
          </div>

          <div className="group rounded-2xl border border-liquid-border bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-liquid-text">Tanya Jawab Per Matkul</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-liquid-text-secondary">Kanal tanya jawab materi kuliah yang dipantau oleh PJ Mata Kuliah. Solusi materi ujian dan kisi-kisi terarsip rapi.</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
              <span>Preview Fitur</span>
            </div>
          </div>

          <div className="group rounded-2xl border border-liquid-border bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-liquid-text">Sync 2-Arah Discord</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-liquid-text-secondary">Pesan yang kamu ketik di TaskPanel akan disinkronkan ke channel Discord kelas, dan balasan teman sekelas di Discord langsung muncul di web.</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <span>Preview Fitur</span>
            </div>
          </div>
        </section>
      </div>
    </DashboardFrame>
  );
}

"use client";

import Link from "next/link";
import { MessageSquare, Users, Clock3 } from "lucide-react";

export default function DiscussionsPage() {
  return (
    <main className="min-h-screen bg-liquid-bg p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <MessageSquare className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-liquid-text-secondary">
                Community
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-liquid-text">
                Diskusi
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-liquid-text-secondary">
                Ruang diskusi per mata kuliah dan kelas akan terhubung ke data akademik TaskPanel, sementara Discord tetap menjadi layer integrasi notifikasi.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
            <Users className="h-5 w-5 text-liquid-accent" />
            <h2 className="mt-4 font-bold text-liquid-text">
              Diskusi kelas
            </h2>
            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">
              Thread kelas akan tersedia setelah model diskusi dan permission-nya ditambahkan.
            </p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
            <Clock3 className="h-5 w-5 text-liquid-accent" />
            <h2 className="mt-4 font-bold text-liquid-text">
              Diskusi mata kuliah
            </h2>
            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">
              Pembahasan per mata kuliah akan mengikuti daftar Course yang sudah terhubung dengan profil mahasiswa.
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

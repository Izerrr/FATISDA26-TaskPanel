"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, FolderGit2, HardDrive, Search, Sparkles } from "lucide-react";

import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { Course } from "@/types";

export default function CoursesPage() {
  const { courses, isLoading, isError } = useCourses();
  const { user } = useRole();
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return courses;
    }

    return courses.filter((course: Course) => course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query));
  }, [courses, search]);

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Header */}
        <section>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-liquid-text">Mata Kuliah & Course Vault</h1>
              <p className="text-xs text-liquid-text-secondary">Pusat materi, modul praktikum lab, silabus RPS, dan tugas per mata kuliah.</p>
            </div>
          </div>

          {user?.prodi && (
            <p className="mt-2 text-xs font-medium text-liquid-text-secondary">
              {user.prodi === "INFORMATIKA" ? "Informatika" : user.prodi === "SAINS_DATA" ? "Sains Data" : "Informatika PSDKU Kebumen"}
              {user.kelas ? ` · Kelas ${user.kelas}` : ""}
            </p>
          )}
        </section>

        {/* Vault Feature Banner */}
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-indigo-50/50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Course Vault Terintegrasi</p>
              <p className="text-[11px] text-slate-600">Pilih mata kuliah di bawah untuk membuka tautan Google Drive, modul praktikum, dan silabus RPS.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-sky-700">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 shadow-xs border border-sky-100">
              <HardDrive className="h-3 w-3 text-blue-500" /> Drive
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 shadow-xs border border-sky-100">
              <FolderGit2 className="h-3 w-3 text-purple-500" /> Modul
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 shadow-xs border border-sky-100">
              <FileText className="h-3 w-3 text-emerald-500" /> RPS
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari mata kuliah atau kode matkul..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-liquid-accent shadow-xs"
          />
        </div>

        {/* Course Cards List */}
        <section className="rounded-2xl border border-liquid-border bg-white p-5 shadow-glass">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : isError ? (
            <div className="rounded-xl bg-red-50 p-5 text-sm text-red-600">Gagal memuat mata kuliah.</div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-liquid-text">Mata kuliah tidak ditemukan</p>
              <p className="mt-1 text-xs text-liquid-text-secondary">Belum ada data mata kuliah yang sesuai dengan profil kamu.</p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {filteredCourses.map((course: Course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-liquid-accent/40 hover:shadow-md hover:ring-2 hover:ring-liquid-accent/10"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent transition-transform duration-200 group-hover:scale-105 group-hover:bg-liquid-accent group-hover:text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-liquid-accent opacity-80 group-hover:opacity-100 transition-opacity">
                        <span>Buka Vault</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <div className="mt-3 min-w-0">
                      <p className="text-sm font-semibold text-liquid-text transition-colors group-hover:text-liquid-accent line-clamp-1">{course.name}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{course.code}</span>
                        {course.kelas && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">Kelas {course.kelas}</span>}
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">📁 Materi & RPS</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardFrame>
  );
}

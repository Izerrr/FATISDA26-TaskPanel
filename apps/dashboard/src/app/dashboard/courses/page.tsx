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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mata Kuliah & Course Vault</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pusat modul praktikum, materi Google Drive, dan silabus RPS per mata kuliah.</p>
            </div>
          </div>

          {user?.prodi && (
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {user.prodi === "INFORMATIKA" ? "Informatika" : user.prodi === "SAINS_DATA" ? "Sains Data" : "Informatika PSDKU Kebumen"}
              {user.kelas ? ` · Kelas ${user.kelas}` : ""}
            </p>
          )}
        </section>

        {/* Vault Feature Banner */}
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-indigo-50/50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-800 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Course Vault Terintegrasi</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Klik kartu mata kuliah untuk membuka folder Google Drive materi, modul praktikum lab, dan silabus RPS.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-slate-800 px-2 py-1 shadow-xs border border-sky-100 dark:border-slate-700 text-blue-600 dark:text-blue-400">
              <HardDrive className="h-3 w-3" /> Drive
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-slate-800 px-2 py-1 shadow-xs border border-sky-100 dark:border-slate-700 text-purple-600 dark:text-purple-400">
              <FolderGit2 className="h-3 w-3" /> Modul
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-slate-800 px-2 py-1 shadow-xs border border-sky-100 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-3 w-3" /> RPS
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
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 shadow-xs placeholder:text-slate-400"
          />
        </div>

        {/* Balanced Responsive Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
        <section>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-6 text-sm text-red-600 dark:text-red-400 text-center">Gagal memuat mata kuliah.</div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Mata kuliah tidak ditemukan</p>
              <p className="mt-1 text-xs text-slate-400">Belum ada data mata kuliah yang sesuai dengan kata kunci pencarian.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course: Course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:shadow-md hover:ring-2 hover:ring-sky-500/10"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                          <BookOpen className="h-4 w-4" />
                        </div>

                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">{course.code}</span>

                        {course.kelas && <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">Kelas {course.kelas}</span>}
                      </div>

                      <div className="flex items-center gap-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span>Buka</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mt-3.5 mb-4">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400 line-clamp-2 leading-snug">{course.name}</h3>
                    </div>
                  </div>

                  {/* Bottom Vault Resources Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[11px]">
                    <span className="text-[10px] font-medium text-slate-400">Vault Materi:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        <HardDrive className="h-2.5 w-2.5" /> Drive
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                        <FolderGit2 className="h-2.5 w-2.5" /> Modul
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <FileText className="h-2.5 w-2.5" /> RPS
                      </span>
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

"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";

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
        <section>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />

            <h1 className="text-xl font-bold text-liquid-text">Mata Kuliah</h1>
          </div>

          <p className="mt-1 text-sm text-liquid-text-secondary">Daftar mata kuliah berdasarkan program studi dan kelas kamu.</p>

          {user?.prodi && (
            <p className="mt-2 text-xs font-medium text-liquid-text-secondary">
              {user.prodi === "INFORMATIKA" ? "Informatika" : user.prodi === "SAINS_DATA" ? "Sains Data" : "Informatika PSDKU Kebumen"}

              {user.kelas ? ` · Kelas ${user.kelas}` : ""}
            </p>
          )}
        </section>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari mata kuliah..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-liquid-accent"
          />
        </div>

        <section className="rounded-2xl border border-liquid-border bg-white p-5 shadow-glass">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCourses.map((course: Course) => (
                <div key={course.id} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent transition-transform duration-200 group-hover:scale-105">
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-liquid-text transition-colors group-hover:text-liquid-accent">{course.name}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{course.code}</span>
                        {course.kelas && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">Kelas {course.kelas}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardFrame>
  );
}

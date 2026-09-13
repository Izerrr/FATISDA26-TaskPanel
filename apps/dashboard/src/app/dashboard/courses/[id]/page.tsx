"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardList } from "lucide-react";
import { useMemo } from "react";
import { useCourses } from "@/hooks/useCourses";
import { useMe } from "@/hooks/useMe";
import { CourseMaterialSection } from "@/components/courses/CourseMaterialSection";

export default function CourseDetailPage() {
  const params = useParams();
  const { user } = useMe();
  const { courses, isLoading, isError } = useCourses();

  const courseId = typeof params.id === "string" ? params.id : "";

  const course = useMemo(() => {
    return courses.find((item) => item.id === courseId) ?? null;
  }, [courses, courseId]);

  const prodiLabel = course?.prodi === "INFORMATIKA" ? "Informatika" : course?.prodi === "SAINS_DATA" ? "Sains Data" : course?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Program Studi";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />

        <div className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-medium text-liquid-text-secondary transition hover:text-liquid-accent">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Mata Kuliah
        </Link>

        <section className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Gagal memuat mata kuliah.</p>

          <p className="mt-1 text-xs text-red-500">Coba refresh halaman.</p>
        </section>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-medium text-liquid-text-secondary transition hover:text-liquid-accent">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Mata Kuliah
        </Link>

        <section className="rounded-2xl border border-liquid-border bg-white p-10 text-center shadow-glass">
          <BookOpen className="mx-auto h-9 w-9 text-slate-300" />

          <p className="mt-3 text-sm font-semibold text-liquid-text">Mata kuliah tidak ditemukan</p>

          <p className="mt-1 text-xs text-liquid-text-secondary">Mata kuliah mungkin sudah dihapus atau tidak tersedia untuk akun kamu.</p>
        </section>
      </div>
    );
  }

  const isOwnAcademicContext = user?.prodi === course.prodi && (!course.kelas || !user.kelas || course.kelas === user.kelas);
  const canEdit = user?.roles?.some((r) => ["ADMIN", "PJ_KELAS", "PJ_MATKUL"].includes(r)) || false;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-medium text-liquid-text-secondary transition hover:text-liquid-accent">
        <ArrowLeft className="h-4 w-4" />
        Mata Kuliah
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-liquid-border bg-white p-6 shadow-glass">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-liquid-accent/10 text-liquid-accent">
              <BookOpen className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-liquid-accent/10 px-2.5 py-1 text-[11px] font-bold text-liquid-accent">{course.code}</span>

                {course.kelas && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">Kelas {course.kelas}</span>}
              </div>

              <h1 className="mt-3 text-xl font-bold text-liquid-text sm:text-2xl">{course.name}</h1>

              <p className="mt-2 text-sm text-liquid-text-secondary">
                {prodiLabel}
                {course.kelas ? ` · Kelas ${course.kelas}` : ""}
              </p>
            </div>
          </div>
        </div>

        {!isOwnAcademicContext && <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">Mata kuliah ini berada di konteks akademik yang berbeda dari profil kamu.</div>}
      </section>

      {/* Course navigation */}
      <section>
        <p className="label px-1">Workspace Mata Kuliah</p>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Link href={`/dashboard#tasks?courseId=${course.id}`} className="group rounded-2xl border border-liquid-border bg-white p-5 shadow-glass transition hover:-translate-y-0.5 hover:border-liquid-accent/20 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent transition group-hover:bg-liquid-accent group-hover:text-white">
                <ClipboardList className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-liquid-accent">Buka →</span>
            </div>

            <h2 className="mt-5 text-sm font-bold text-liquid-text">Tugas</h2>

            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">Lihat dan kelola tugas yang berkaitan dengan mata kuliah ini.</p>
          </Link>

          <Link href={`/dashboard/schedule?courseId=${course.id}`} className="group rounded-2xl border border-liquid-border bg-white p-5 shadow-glass transition hover:-translate-y-0.5 hover:border-liquid-accent/20 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <CalendarDays className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-blue-600">Buka →</span>
            </div>

            <h2 className="mt-5 text-sm font-bold text-liquid-text">Jadwal</h2>

            <p className="mt-1 text-xs leading-5 text-liquid-text-secondary">Lihat jadwal perkuliahan untuk mata kuliah ini.</p>
          </Link>
        </div>
      </section>

      {/* Repository Materi & Modul Kuliah */}
      <CourseMaterialSection course={course} canEdit={canEdit} />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useMe } from "@/hooks/useMe";

type Prodi = "INFORMATIKA" | "SAINS_DATA" | "INFORMATIKA_PSDKU_KEBUMEN";

type Kelas = "A" | "B" | "C" | "D" | "E";

const PRODI_OPTIONS: Array<{
  value: Prodi;
  label: string;
}> = [
  {
    value: "INFORMATIKA",
    label: "Informatika",
  },
  {
    value: "SAINS_DATA",
    label: "Sains Data",
  },
  {
    value: "INFORMATIKA_PSDKU_KEBUMEN",
    label: "Informatika PSDKU Kebumen",
  },
];

const KELAS_OPTIONS: Array<{
  value: Kelas;
  label: string;
}> = [
  { value: "A", label: "Kelas A" },
  { value: "B", label: "Kelas B" },
  { value: "C", label: "Kelas C" },
  { value: "D", label: "Kelas D" },
  { value: "E", label: "Kelas E" },
];

interface CreateCourseForm {
  code: string;
  name: string;
  prodi: Prodi;
  kelas: Kelas | "";
}

const INITIAL_FORM: CreateCourseForm = {
  code: "",
  name: "",
  prodi: "INFORMATIKA",
  kelas: "",
};

export default function CoursesPage() {
  const { user } = useMe();
  const { courses, isLoading, isError, mutate } = useCourses();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateCourseForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return courses;
    }

    return courses.filter((course) => {
      return course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query);
    });
  }, [courses, search]);

  const prodiLabel = user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Program Studi";

  function openCreateModal() {
    setForm(INITIAL_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function closeCreateModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setFormError("");
  }

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError("");

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code) {
      setFormError("Kode mata kuliah wajib diisi.");
      return;
    }

    if (!name) {
      setFormError("Nama mata kuliah wajib diisi.");
      return;
    }

    if (!form.prodi) {
      setFormError("Program studi wajib dipilih.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          name,
          prodi: form.prodi,
          kelas: form.kelas || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menambahkan mata kuliah.");
      }

      await mutate();

      setModalOpen(false);
      setForm(INITIAL_FORM);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menambahkan mata kuliah.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-liquid-text">Mata Kuliah</h1>

              <p className="mt-1 text-sm text-liquid-text-secondary">
                {prodiLabel}
                {user?.kelas ? ` · Kelas ${user.kelas}` : ""}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Tambah Mata Kuliah
            </button>
          )}
        </div>
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari mata kuliah atau kode..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-liquid-text outline-none transition placeholder:text-slate-400 focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10"
          />
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-liquid-border bg-white" />
          ))}
        </section>
      ) : isError ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Gagal memuat mata kuliah.</p>

          <p className="mt-1 text-xs text-red-500">Coba refresh halaman.</p>
        </section>
      ) : filteredCourses.length === 0 ? (
        <section className="rounded-2xl border border-liquid-border bg-white p-10 text-center shadow-glass">
          <BookOpen className="mx-auto h-9 w-9 text-slate-300" />

          <p className="mt-3 text-sm font-semibold text-liquid-text">{search ? "Mata kuliah tidak ditemukan" : "Belum ada mata kuliah"}</p>

          <p className="mt-1 text-xs text-liquid-text-secondary">{search ? "Coba gunakan nama atau kode yang berbeda." : isAdmin ? "Tambahkan mata kuliah pertama untuk memulai." : "Belum ada data mata kuliah untuk profil kamu."}</p>

          {isAdmin && !search && (
            <button type="button" onClick={openCreateModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
              <Plus className="h-4 w-4" />
              Tambah Mata Kuliah
            </button>
          )}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="group rounded-2xl border border-liquid-border bg-white p-5 shadow-glass transition hover:-translate-y-0.5 hover:border-liquid-accent/20 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent transition group-hover:bg-liquid-accent group-hover:text-white">
                  <BookOpen className="h-5 w-5" />
                </div>

                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{course.code}</span>
              </div>

              <div className="mt-5">
                <h2 className="line-clamp-2 text-sm font-bold text-liquid-text">{course.name}</h2>

                <p className="mt-2 text-xs text-liquid-text-secondary">
                  {course.prodi}
                  {course.kelas ? ` · Kelas ${course.kelas}` : " · Semua kelas"}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Create Course Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-liquid-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-liquid-border px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-liquid-text">Tambah Mata Kuliah</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary">Tambahkan mata kuliah ke database akademik.</p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 p-5">
              <div>
                <label htmlFor="course-code" className="mb-1.5 block text-xs font-semibold text-liquid-text">
                  Kode Mata Kuliah
                </label>

                <input
                  id="course-code"
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder="Contoh: IF101"
                  autoComplete="off"
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm uppercase text-liquid-text outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="course-name" className="mb-1.5 block text-xs font-semibold text-liquid-text">
                  Nama Mata Kuliah
                </label>

                <input
                  id="course-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Algoritma dan Pemrograman"
                  autoComplete="off"
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-liquid-text outline-none transition placeholder:text-slate-400 focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10 disabled:opacity-60"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="course-prodi" className="mb-1.5 block text-xs font-semibold text-liquid-text">
                    Program Studi
                  </label>

                  <select
                    id="course-prodi"
                    value={form.prodi}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        prodi: event.target.value as Prodi,
                      }))
                    }
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-liquid-text outline-none transition focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10 disabled:opacity-60"
                  >
                    {PRODI_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="course-class" className="mb-1.5 block text-xs font-semibold text-liquid-text">
                    Kelas
                  </label>

                  <select
                    id="course-class"
                    value={form.kelas}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        kelas: event.target.value as Kelas | "",
                      }))
                    }
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-liquid-text outline-none transition focus:border-liquid-accent/40 focus:bg-white focus:ring-2 focus:ring-liquid-accent/10 disabled:opacity-60"
                  >
                    <option value="">Semua kelas</option>

                    {KELAS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-600">{formError}</div>}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeCreateModal} disabled={submitting} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                  Batal
                </button>

                <button type="submit" disabled={submitting} className="rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? "Menyimpan..." : "Simpan Mata Kuliah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

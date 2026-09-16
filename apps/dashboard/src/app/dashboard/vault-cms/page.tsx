"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen, CheckCircle2, ChevronRight, ExternalLink, FileText, FolderGit2, HardDrive, Info, Loader2, MessageCircle, Pencil, Plus, Search, ShieldAlert, Sparkles, Trash2, X } from "lucide-react";

import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { useVault, type VaultData, type VaultResourceLink } from "@/hooks/useVault";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { Course } from "@/types";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function VaultCmsPage() {
  const { user, roles, isLoading: roleLoading } = useRole();
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const { courses, isLoading: coursesLoading, isError: coursesError } = useCourses(selectedSemester === "ALL" ? undefined : selectedSemester);
  const { vaults, isLoading: vaultsLoading, mutate: mutateVaults } = useVault();

  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [driveUrl, setDriveUrl] = useState("");
  const [modulUrl, setModulUrl] = useState("");
  const [silabusUrl, setSilabusUrl] = useState("");
  const [communityUrl, setCommunityUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [extraLinks, setExtraLinks] = useState<VaultResourceLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const canManage = useMemo(() => {
    return roles.some((r) => ["ADMIN", "OWNER", "PJ_KELAS", "PJ_MATKUL", "KETUA_ANGKATAN"].includes(r));
  }, [roles]);

  // Map vaults by normalized course name
  const vaultMap = useMemo(() => {
    const map = new Map<string, VaultData>();
    for (const v of vaults) {
      map.set(v.courseName.toLowerCase().trim(), v);
    }
    return map;
  }, [vaults]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, search]);

  function openEditModal(course: Course) {
    setEditingCourse(course);
    setSaveMessage(null);

    const existing = vaultMap.get(course.name.toLowerCase().trim());
    setDriveUrl(existing?.driveUrl || "");
    setModulUrl(existing?.modulUrl || "");
    setSilabusUrl(existing?.silabusUrl || "");
    setCommunityUrl(existing?.communityUrl || "");
    setNotes(existing?.notes || "");
    setExtraLinks(existing?.extraLinks || []);
  }

  function closeEditModal() {
    setEditingCourse(null);
    setSaveMessage(null);
  }

  function handleAddExtraLink() {
    setExtraLinks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: "",
        url: "",
        type: "OTHER",
      },
    ]);
  }

  function handleUpdateExtraLink(id: string, field: keyof VaultResourceLink, value: string) {
    setExtraLinks((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function handleRemoveExtraLink(id: string) {
    setExtraLinks((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: editingCourse.id,
          courseName: editingCourse.name,
          prodi: editingCourse.prodi,
          kelas: editingCourse.kelas,
          semester: selectedSemester === "ALL" ? (user?.semester ?? 1) : selectedSemester,
          driveUrl: driveUrl.trim() || null,
          modulUrl: modulUrl.trim() || null,
          silabusUrl: silabusUrl.trim() || null,
          communityUrl: communityUrl.trim() || null,
          notes: notes.trim() || null,
          extraLinks: extraLinks.filter((l) => l.title.trim() && l.url.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan data vault");
      }

      setSaveMessage({ text: "Berhasil menyimpan tautan Course Vault!", type: "success" });
      await mutateVaults();
      setTimeout(() => {
        closeEditModal();
      }, 900);
    } catch (err: any) {
      setSaveMessage({ text: err.message || "Terjadi kesalahan", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  if (roleLoading) {
    return (
      <DashboardFrame>
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-pulse text-sky-500" />
        </div>
      </DashboardFrame>
    );
  }

  if (!canManage) {
    return (
      <DashboardFrame>
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-8 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-3 text-lg font-bold text-red-700 dark:text-red-400">Akses Ditolak</h2>
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">
              Halaman ini khusus untuk <strong>PJ Mata Kuliah</strong>, <strong>PJ Kelas</strong>, dan <strong>Administrator</strong> untuk mengelola link Google Drive dan materi Course Vault.
            </p>
            <div className="mt-5">
              <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-semibold hover:brightness-110 transition">
                Kembali ke Mata Kuliah
              </Link>
            </div>
          </div>
        </div>
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">CMS Course Vault</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola tautan Google Drive materi, modul praktikum, dan silabus RPS per mata kuliah.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <BookOpen className="h-4 w-4 text-sky-600" />
              <span>Lihat Tampilan Mahasiswa</span>
            </Link>
          </div>
        </section>

        {/* PJ Instructions Banner */}
        <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Panduan untuk Penanggung Jawab (PJ) Mata Kuliah & PJ Kelas</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                1. Buat folder Google Drive dari akun Google Anda sendiri untuk mata kuliah yang Anda pegang.
                <br />
                2. Pastikan akses sharing folder diatur ke: <strong>"Anyone with the link can view"</strong> (Siapa saja yang memiliki link dapat melihat).
                <br />
                3. Klik tombol <strong>"Edit Vault"</strong> pada mata kuliah di bawah, lalu tempelkan link Google Drive, modul praktikum, atau RPS.
                <br />
                4. Data yang disimpan akan langsung tampil secara otomatis pada Course Vault seluruh mahasiswa.
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah atau kode matkul..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 shadow-xs placeholder:text-slate-400"
            />
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xs overflow-x-auto">
            <span className="px-2 text-xs font-semibold text-slate-400">Semester:</span>
            <button
              type="button"
              onClick={() => setSelectedSemester("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${selectedSemester === "ALL" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              Semua
            </button>
            {SEMESTERS.map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSelectedSemester(sem)}
                className={`h-6 w-6 rounded-lg text-xs font-semibold transition ${selectedSemester === sem ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Table / Cards */}
        <section className="space-y-3">
          {coursesLoading || vaultsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : coursesError ? (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 p-6 text-center text-sm text-red-600 dark:text-red-400">Gagal memuat daftar mata kuliah.</div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tidak ada mata kuliah</p>
              <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter semester.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course: Course) => {
                const vault = vaultMap.get(course.name.toLowerCase().trim());
                const hasDrive = Boolean(vault?.driveUrl);
                const hasModul = Boolean(vault?.modulUrl);
                const hasSilabus = Boolean(vault?.silabusUrl);
                const hasCommunity = Boolean(vault?.communityUrl);

                return (
                  <div key={course.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-sky-400/50 hover:shadow-sm">
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">{course.code}</span>
                          {course.kelas && <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">Kelas {course.kelas}</span>}
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="inline-flex items-center gap-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300 transition"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Vault</span>
                        </button>
                      </div>

                      {/* Course Title */}
                      <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{course.name}</h3>

                      {/* Status Badges */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                            <span>Folder GDrive Materi:</span>
                          </span>
                          {hasDrive ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Ada
                            </span>
                          ) : (
                            <span className="font-medium text-amber-600 dark:text-amber-400">Belum diisi</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <FolderGit2 className="h-3.5 w-3.5 text-purple-500" />
                            <span>Modul Praktikum:</span>
                          </span>
                          {hasModul ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Ada
                            </span>
                          ) : (
                            <span className="font-medium text-slate-400">Belum diisi</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <FileText className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Silabus & RPS:</span>
                          </span>
                          {hasSilabus ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Ada
                            </span>
                          ) : (
                            <span className="font-medium text-slate-400">Belum diisi</span>
                          )}
                        </div>

                        {hasCommunity && (
                          <div className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <MessageCircle className="h-3.5 w-3.5 text-teal-500" />
                              <span>Grup / Komunitas:</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Ada
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer with quick action & update time */}
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-slate-400">{vault?.updatedAt ? `Update: ${new Date(vault.updatedAt).toLocaleDateString("id-ID")}` : "Belum pernah diset"}</span>

                      {hasDrive && vault?.driveUrl && (
                        <a href={vault.driveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                          <span>Buka Drive</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Edit Modal */}
        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-300">{editingCourse.code}</span>
                    {editingCourse.kelas && <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">Kelas {editingCourse.kelas}</span>}
                  </div>
                  <h2 className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100">Edit Vault: {editingCourse.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Masukkan link Google Drive, modul, dan silabus yang Anda kelola untuk kelas ini.</p>
                </div>

                <button type="button" onClick={closeEditModal} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="mt-5 space-y-4">
                {/* Google Drive Link */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                      <span>Link Google Drive Materi Kuliah</span>
                    </span>
                    {driveUrl && (
                      <a href={driveUrl.startsWith("http") ? driveUrl : `https://${driveUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline">
                        Tes Link <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">Folder slide materi, rangkuman tugas, dan rekaman perkuliahan dari dosen.</p>
                </div>

                {/* Modul Praktikum Link */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <FolderGit2 className="h-3.5 w-3.5 text-purple-500" />
                      <span>Link Modul Praktikum Lab</span>
                    </span>
                    {modulUrl && (
                      <a href={modulUrl.startsWith("http") ? modulUrl : `https://${modulUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-purple-500 hover:underline">
                        Tes Link <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={modulUrl}
                    onChange={(e) => setModulUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau GitHub repo lab"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">Folder panduan praktikum, template laporan lab, atau repository starter code.</p>
                </div>

                {/* Silabus & RPS */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Link Silabus & RPS</span>
                    </span>
                    {silabusUrl && (
                      <a href={silabusUrl.startsWith("http") ? silabusUrl : `https://${silabusUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 hover:underline">
                        Tes Link <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={silabusUrl}
                    onChange={(e) => setSilabusUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau file PDF RPS"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">Rencana Pembelajaran Semester, bobot penilaian, dan ketentuan kehadiran.</p>
                </div>

                {/* Komunitas / Grup Diskusi */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-teal-500" />
                      <span>Link Grup WA / Discord Mata Kuliah (Opsional)</span>
                    </span>
                    {communityUrl && (
                      <a href={communityUrl.startsWith("http") ? communityUrl : `https://${communityUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-teal-500 hover:underline">
                        Tes Link <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={communityUrl}
                    onChange={(e) => setCommunityUrl(e.target.value)}
                    placeholder="https://chat.whatsapp.com/... atau https://discord.gg/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* Catatan / Pengumuman PJ */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Catatan / Pengumuman dari PJ (Opsional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Link absen ada di deskripsi grup, tugas besar dikerjakan berkelompok 3 orang..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* Feedback Message */}
                {saveMessage && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold ${
                      saveMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                {/* Buttons */}
                <div className="mt-5 flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSaving}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>{isSaving ? "Menyimpan..." : "Simpan Course Vault"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardFrame>
  );
}

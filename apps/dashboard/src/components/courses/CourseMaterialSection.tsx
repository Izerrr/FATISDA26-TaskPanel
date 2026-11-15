"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, Clock3, ExternalLink, FileText, FolderGit2, HardDrive, Info, Loader2, MessageCircle, Pencil, Plus, Send, Settings, Sparkles, Trash2, X } from "lucide-react";

import { useVault, type VaultResourceLink } from "@/hooks/useVault";
import { useVaultSuggestions } from "@/hooks/useVaultSuggestions";
import type { Course } from "@/types";

interface Props {
  course: Course;
  canEdit?: boolean;
}

const typeIcon = {
  DRIVE: HardDrive,
  MODULE: FolderGit2,
  SYLLABUS: FileText,
  COMMUNITY: MessageCircle,
  OTHER: ExternalLink,
};

const typeColor = {
  DRIVE: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
  MODULE: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50",
  SYLLABUS: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  COMMUNITY: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50",
  OTHER: "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function CourseMaterialSection({ course, canEdit = false }: Props) {
  const { vault, isLoading, mutate } = useVault(course.name, course.id);
  const { suggestions, mutate: mutateSuggestions } = useVaultSuggestions(course.name);

  const [modalOpen, setModalOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [modulUrl, setModulUrl] = useState("");
  const [silabusUrl, setSilabusUrl] = useState("");
  const [communityUrl, setCommunityUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Student Vault Suggestion Modal & Review State
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sugTitle, setSugTitle] = useState("");
  const [sugType, setSugType] = useState<"DRIVE" | "MODUL" | "SILABUS" | "OTHER">("OTHER");
  const [sugUrl, setSugUrl] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugSubmitting, setSugSubmitting] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);
  const [sugSuccess, setSugSuccess] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function handleSubmitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    setSugError(null);
    setSugSuccess(null);
    setSugSubmitting(true);
    try {
      const res = await fetch("/api/vault/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          courseName: course.name,
          title: sugTitle,
          type: sugType,
          url: sugUrl,
          description: sugDesc,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengirim usulan materi");
      }
      setSugTitle("");
      setSugUrl("");
      setSugDesc("");
      setSugType("OTHER");
      setSugSuccess("Usulan berhasil dikirim! Menunggu persetujuan PJ Mata Kuliah.");
      await mutateSuggestions();
      setTimeout(() => {
        setSuggestOpen(false);
        setSugSuccess(null);
      }, 900);
    } catch (err) {
      setSugError(err instanceof Error ? err.message : "Gagal mengirim usulan materi");
    } finally {
      setSugSubmitting(false);
    }
  }

  async function handleReviewSuggestion(id: string, action: "APPROVE" | "REJECT") {
    setReviewingId(id);
    try {
      const res = await fetch("/api/vault/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        await Promise.all([mutateSuggestions(), mutate()]);
      }
    } finally {
      setReviewingId(null);
    }
  }

  function openModal() {
    setDriveUrl(vault?.driveUrl || "");
    setModulUrl(vault?.modulUrl || "");
    setSilabusUrl(vault?.silabusUrl || "");
    setCommunityUrl(vault?.communityUrl || "");
    setNotes(vault?.notes || "");
    setSaveMessage(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          courseName: course.name,
          prodi: course.prodi,
          kelas: course.kelas,
          driveUrl: driveUrl.trim() || null,
          modulUrl: modulUrl.trim() || null,
          silabusUrl: silabusUrl.trim() || null,
          communityUrl: communityUrl.trim() || null,
          notes: notes.trim() || null,
          extraLinks: vault?.extraLinks || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan tautan vault");
      }

      setSaveMessage({ text: "Berhasil menyimpan Course Vault!", type: "success" });
      await mutate();
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    } catch (err: any) {
      setSaveMessage({ text: err.message || "Gagal menyimpan", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  // Build the list of active resources
  const resources = useMemo(() => {
    const list = [];

    // 1. Google Drive
    list.push({
      id: "drive-folder",
      title: "Google Drive Folder Materi",
      url: vault?.driveUrl || null,
      type: "DRIVE" as const,
      description: "Slide kuliah dosen, rangkuman pertemuan, dan materi resmi perkuliahan.",
    });

    // 2. Modul Praktikum
    list.push({
      id: "module-lab",
      title: "Modul Praktikum & Lab",
      url: vault?.modulUrl || null,
      type: "MODULE" as const,
      description: "Panduan praktikum laboratorium, template tugas lab, dan file pendukung.",
    });

    // 3. Silabus & RPS
    list.push({
      id: "rps-syllabus",
      title: "Silabus & RPS Semester",
      url: vault?.silabusUrl || null,
      type: "SYLLABUS" as const,
      description: "Rencana Pembelajaran Semester, bobot nilai, dan referensi perkuliahan.",
    });

    // 4. Komunitas / Grup (if exists)
    if (vault?.communityUrl) {
      list.push({
        id: "community-group",
        title: "Grup Diskusi Mata Kuliah",
        url: vault.communityUrl,
        type: "COMMUNITY" as const,
        description: "Grup koordinasi WhatsApp atau Discord bersama PJ Mata Kuliah.",
      });
    }

    // 5. Extra links
    if (Array.isArray(vault?.extraLinks)) {
      for (const extra of vault.extraLinks) {
        if (extra.url && extra.title) {
          list.push({
            id: extra.id || extra.title,
            title: extra.title,
            url: extra.url,
            type: (extra.type as "OTHER") || "OTHER",
            description: extra.description,
          });
        }
      }
    }

    return list;
  }, [vault]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <p className="label">Course Vault & Repository Materi</p>
          <p className="text-xs text-liquid-text-secondary dark:text-slate-400 mt-0.5">Akses langsung folder Google Drive materi, modul praktikum, dan silabus RPS {course.name}.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSugError(null);
              setSugSuccess(null);
              setSuggestOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Usulkan Materi</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Pencil className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Edit Vault</span>
              </button>

              <Link href="/dashboard/vault-cms" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition">
                <Settings className="h-3.5 w-3.5" />
                <span>Buka CMS Vault</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* PJ Announcement / Notes Banner (if any) */}
      {vault?.notes && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/50 dark:bg-slate-800/60 dark:border-slate-700 p-4">
          <Info className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">Pengumuman dari PJ Mata Kuliah:</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{vault.notes}</p>
          </div>
        </div>
      )}

      {/* Resource Cards */}
      {isLoading ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((item) => {
            const Icon = typeIcon[item.type] || HardDrive;
            const tone = typeColor[item.type] || typeColor.OTHER;
            const isAvailable = Boolean(item.url);

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition ${
                  isAvailable
                    ? "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400/50 hover:shadow-md hover:-translate-y-0.5"
                    : "border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Siap Diakses
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                        Belum Disediakan
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{item.title}</h3>
                  {item.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isAvailable ? (
                    <a href={item.url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      <span>Buka Repository</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : canEdit ? (
                    <button type="button" onClick={openModal} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      <Plus className="h-3 w-3" />
                      <span>Atur Link Sekarang</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Menunggu PJ Matkul</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crowdsourced Material Suggestions Queue */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Usulan Materi Mahasiswa ({suggestions.filter((s) => s.status === "PENDING").length} menunggu tinjauan)
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {suggestions.slice(0, 6).map((sug) => {
              const isBusy = reviewingId === sug.id;
              return (
                <div
                  key={sug.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                        {sug.type}
                      </span>
                      <a
                        href={sug.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sky-600 dark:text-sky-400 hover:underline truncate"
                      >
                        {sug.title} ↗
                      </a>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          sug.status === "APPROVED"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : sug.status === "REJECTED"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {sug.status === "APPROVED" ? "Disetujui" : sug.status === "REJECTED" ? "Ditolak" : "Menunggu PJ"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Oleh {sug.author?.name || sug.author?.username || "Mahasiswa"}
                      {sug.description ? ` · ${sug.description}` : ""}
                    </p>
                  </div>

                  {canEdit && sug.status === "PENDING" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleReviewSuggestion(sug.id, "APPROVE")}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleReviewSuggestion(sug.id, "REJECT")}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 disabled:opacity-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-300 transition cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggest Material Modal (Crowdsourced by Students) */}
      {suggestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Usulkan Materi: {course.name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Bagikan link catatan, drive, atau referensi agar ditinjau PJ Matkul.</p>
              </div>
              <button type="button" onClick={() => setSuggestOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSuggestion} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Materi *</label>
                <input
                  type="text"
                  required
                  value={sugTitle}
                  onChange={(e) => setSugTitle(e.target.value)}
                  placeholder="Contoh: Catatan Minggu 1-4 atau Modul Lab Praktikum"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={sugType}
                    onChange={(e) => setSugType(e.target.value as "DRIVE" | "MODUL" | "SILABUS" | "OTHER")}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-2.5 py-2 text-xs outline-none focus:border-sky-500"
                  >
                    <option value="DRIVE">Drive</option>
                    <option value="MODUL">Modul</option>
                    <option value="SILABUS">Silabus</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tautan Link (URL) *</label>
                  <input
                    type="url"
                    required
                    value={sugUrl}
                    onChange={(e) => setSugUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={sugDesc}
                  onChange={(e) => setSugDesc(e.target.value)}
                  placeholder="Misal: Slide kuliah pertemuan 1-7 + contoh soal UTS"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {sugError && <p className="rounded-xl bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">{sugError}</p>}
              {sugSuccess && <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">{sugSuccess}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSuggestOpen(false)} className="rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sugSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {sugSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{sugSubmitting ? "Mengirim..." : "Kirim Usulan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kelola Course Vault: {course.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tautan yang Anda simpan akan tersimpan di database dan langsung tampil untuk seluruh mahasiswa.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              {/* Google Drive */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                    <span>Link Google Drive Folder Materi</span>
                  </span>
                  {driveUrl && (
                    <a href={driveUrl.startsWith("http") ? driveUrl : `https://${driveUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                      Tes Link ↗
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {/* Modul Praktikum */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5">
                    <FolderGit2 className="h-3.5 w-3.5 text-purple-500" />
                    <span>Link Modul Praktikum Lab</span>
                  </span>
                  {modulUrl && (
                    <a href={modulUrl.startsWith("http") ? modulUrl : `https://${modulUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-purple-500 hover:underline">
                      Tes Link ↗
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... atau GitHub repo"
                  value={modulUrl}
                  onChange={(e) => setModulUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {/* Silabus & RPS */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Link Silabus & RPS</span>
                  </span>
                  {silabusUrl && (
                    <a href={silabusUrl.startsWith("http") ? silabusUrl : `https://${silabusUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-500 hover:underline">
                      Tes Link ↗
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... atau link dokumen RPS"
                  value={silabusUrl}
                  onChange={(e) => setSilabusUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {/* Komunitas / Grup */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-teal-500" />
                    <span>Link Grup WhatsApp / Discord PJ (Opsional)</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/... atau https://discord.gg/..."
                  value={communityUrl}
                  onChange={(e) => setCommunityUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Catatan / Pengumuman PJ untuk Mahasiswa</label>
                <textarea
                  rows={2}
                  placeholder="Informasi pengumpulan tugas, ketentuan lab, dll..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

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

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50">
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

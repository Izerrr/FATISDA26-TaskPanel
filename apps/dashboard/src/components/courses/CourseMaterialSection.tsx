"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, FolderGit2, HardDrive, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Course } from "@/types";

interface ResourceLink {
  id: string;
  title: string;
  url: string;
  type: "DRIVE" | "MODULE" | "SYLLABUS" | "COMMUNITY";
  description?: string;
}

interface Props {
  course: Course;
  canEdit?: boolean;
}

const typeIcon = {
  DRIVE: HardDrive,
  MODULE: FolderGit2,
  SYLLABUS: FileText,
  COMMUNITY: MessageCircle,
};

const typeColor = {
  DRIVE: "bg-blue-50 text-blue-600 border-blue-100",
  MODULE: "bg-purple-50 text-purple-600 border-purple-100",
  SYLLABUS: "bg-emerald-50 text-emerald-600 border-emerald-100",
  COMMUNITY: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export function CourseMaterialSection({ course, canEdit = false }: Props) {
  const storageKey = `fatisda_course_resources_${course.id}`;

  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceLink["type"]>("DRIVE");
  const [description, setDescription] = useState("");

  // Load resources from localStorage with sensible defaults per course
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setResources(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }

    // Default template resources
    const defaults: ResourceLink[] = [
      {
        id: "drive-folder",
        title: "Google Drive Folder Materi",
        url: "https://drive.google.com",
        type: "DRIVE",
        description: "Slide kuliah dosen, rangkuman, dan rekaman pertemuan.",
      },
      {
        id: "module-lab",
        title: "Modul Praktikum & Tugas Lab",
        url: "https://drive.google.com",
        type: "MODULE",
        description: "Panduan praktikum laboratorium, template tugas, dan file pendukung.",
      },
      {
        id: "rps-syllabus",
        title: "Silabus & RPS Semester",
        url: "https://fatisda.uns.ac.id",
        type: "SYLLABUS",
        description: "Rencana Pembelajaran Semester, bobot nilai, dan referensi buku teks.",
      },
    ];
    setResources(defaults);
  }, [storageKey]);

  function handleSaveResource(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const updated = [
      ...resources,
      {
        id: Date.now().toString(),
        title: title.trim(),
        url: finalUrl,
        type,
        description: description.trim() || undefined,
      },
    ];

    setResources(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setTitle("");
    setUrl("");
    setDescription("");
    setType("DRIVE");
    setModalOpen(false);
  }

  function handleDeleteResource(id: string) {
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="label">Repository Materi & Modul Kuliah</p>
          <p className="text-xs text-liquid-text-secondary mt-0.5">Akses cepat folder Google Drive, modul lab, dan silabus mata kuliah {course.name}.</p>
        </div>

        {canEdit && (
          <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">
            <Plus className="h-3.5 w-3.5 text-liquid-accent" />
            <span>Tambah Tautan</span>
          </button>
        )}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((item) => {
          const Icon = typeIcon[item.type] || HardDrive;
          const tone = typeColor[item.type] || "bg-slate-50 text-slate-600 border-slate-100";

          return (
            <div key={item.id} className="group relative flex flex-col justify-between rounded-2xl border border-liquid-border bg-white p-4 shadow-glass transition hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResource(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="mt-3 text-sm font-bold text-liquid-text leading-snug">{item.title}</h3>
                {item.description && <p className="mt-1 text-xs text-liquid-text-secondary line-clamp-2 leading-relaxed">{item.description}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/70">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-liquid-accent hover:underline">
                  <span>Buka Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Tautan */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-liquid-text">Tambah Tautan Materi</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-liquid-text">Tipe Tautan</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-liquid-accent focus:outline-none">
                  <option value="DRIVE">Google Drive (Slide & Rekaman)</option>
                  <option value="MODULE">Modul Praktikum & Lab</option>
                  <option value="SYLLABUS">Silabus / RPS Kuliah</option>
                  <option value="COMMUNITY">Grup WhatsApp / Diskusi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-liquid-text">Judul</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Folder Slide Pertemuan 1-14"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-liquid-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-liquid-text">URL / Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-liquid-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-liquid-text">Deskripsi Singkat (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan atau informasi isi folder..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-liquid-accent focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  Batal
                </button>
                <button type="submit" className="rounded-xl bg-liquid-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-liquid-accent/90">
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

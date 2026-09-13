"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bot, Check, HelpCircle, Loader2, Sparkles, User, Users, X } from "lucide-react";
import type { Course, Role } from "@/types";
import { parseTaskNaturalLanguage, type ParsedTaskResult } from "@/lib/ai-task-parser";

interface Props {
  open: boolean;
  guildId: string;
  courses: Course[];
  roles: Role[] | string[];
  userId?: string;
  onClose: () => void;
  onCreated: () => Promise<unknown> | void;
}

export function NewTaskModal({ open, guildId, courses, roles, onClose, onCreated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"MANUAL" | "AI">("MANUAL");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scope, setScope] = useState<"PERSONAL" | "CLASS">("PERSONAL");

  // AI Mode Fields
  const [aiInput, setAiInput] = useState("");
  const [aiParsed, setAiParsed] = useState<ParsedTaskResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const canCreateClass = roles.some((role) => ["ADMIN", "PJ_KELAS", "PJ_MATKUL"].includes(String(role)));

  function handleAiParse() {
    if (!aiInput.trim()) {
      setError("Ketik deskripsi tugas yang ingin di-parse.");
      return;
    }

    setError("");
    const parsed = parseTaskNaturalLanguage(aiInput, courses);
    setAiParsed(parsed);

    // Also pre-fill the form state
    setTitle(parsed.title);
    setDescription(parsed.description ?? "");
    setCourseId(parsed.courseId);
    setDueDate(parsed.dueDate);
    setScope(parsed.scope);
  }

  function handleApplyAiAndSwitch() {
    if (!aiParsed) return;
    setMode("MANUAL");
  }

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();

    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }

    if (scope === "CLASS" && !canCreateClass) {
      setError("Kamu tidak memiliki izin membuat tugas kelas.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          title: title.trim(),
          description: description.trim() || null,
          courseId: courseId || null,
          dueDate: dueDate || null,
          scope,
          status: "TODO",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat tugas.");
      }

      await onCreated();

      // Reset
      setTitle("");
      setDescription("");
      setCourseId("");
      setDueDate("");
      setScope("PERSONAL");
      setAiInput("");
      setAiParsed(null);
      setMode("MANUAL");

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tugas.");
    } finally {
      setLoading(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === courseId);

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden max-h-[92vh] my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-base font-bold text-liquid-text">Tugas Baru</h2>
            <p className="text-xs text-liquid-text-secondary">Pilih mode pengisian manual atau otomatis dengan AI.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5 px-6">
          <button
            type="button"
            onClick={() => setMode("MANUAL")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              mode === "MANUAL" ? "bg-white text-slate-800 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <span>✏️ Mode Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("AI")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              mode === "AI" ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>✨ Mode AI (Otomatis)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-600">{error}</div>}

          {mode === "AI" ? (
            /* ================= MODE AI (AUTOMATIC PARSE) ================= */
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-900">AI Quick Input</p>
                    <p className="mt-0.5 text-[11px] text-sky-700 leading-relaxed">Ketik tugas secara natural seperti chat. AI akan otomatis menentukan mata kuliah, deadline, dan judul tugas.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block text-xs font-bold">Kalimat Tugas Kamu</label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  rows={3}
                  placeholder="Contoh: fisika krakatau besok senin jam 2 siang"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition focus:border-liquid-accent focus:bg-white"
                />
              </div>

              {/* Example Chips */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Coba klik contoh:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Fisika Krakatau besok senin jam 2 siang", "Laporan praktikum alpro jumat jam 23.59 tugas kelas", "Kuis matematika diskrit lusa jam 10 pagi"].map((example) => (
                    <button key={example} type="button" onClick={() => setAiInput(example)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiParse}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow transition hover:opacity-95 active:scale-98"
              >
                <Sparkles className="h-4 w-4" />
                Ekstrak Format Otomatis
              </button>

              {/* Parsed Result Preview */}
              {aiParsed && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-xs font-bold text-emerald-800">Hasil Format AI:</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Berhasil Diproses</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Judul:</span>
                      <strong className="text-slate-800">{title}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Mata Kuliah:</span>
                      <strong className="text-slate-800">{selectedCourse ? `${selectedCourse.code} · ${selectedCourse.name}` : "Tanpa mata kuliah"}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Deadline:</span>
                      <strong className="text-slate-800">{dueDate ? dueDate.replace("T", " ") : "Tidak ditentukan"}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Lingkup:</span>
                      <strong className="text-slate-800">{scope === "CLASS" ? "Tugas Kelas" : "Personal"}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-emerald-100">
                    <button type="button" onClick={handleApplyAiAndSwitch} className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                      Edit di Mode Manual
                    </button>

                    <button type="button" onClick={() => handleSubmit()} disabled={loading} className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50">
                      {loading ? "Menyimpan..." : "⚡ Langsung Buat Tugas"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= MODE MANUAL ================= */
            <form id="manual-task-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Scope Selector */}
              <div>
                <label className="label mb-1.5 block text-xs font-bold">Lingkup Tugas</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScope("PERSONAL")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${
                      scope === "PERSONAL" ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent shadow-xs" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Personal (Pribadi)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canCreateClass}
                    onClick={() => setScope("CLASS")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${
                      scope === "CLASS" ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent shadow-xs" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    } ${!canCreateClass ? "cursor-not-allowed opacity-40" : ""}`}
                    title={!canCreateClass ? "Hanya PJ Kelas/Matkul & Admin" : ""}
                  >
                    <Users className="h-4 w-4" />
                    <span>Tugas Kelas</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="label mb-1.5 block text-xs font-bold">Judul Tugas *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Contoh: Laporan Fisika Krakatau"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-liquid-accent focus:bg-white"
                />
              </div>

              {/* Course & Due Date */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-1.5 block text-xs font-bold">Mata Kuliah</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none transition focus:border-liquid-accent focus:bg-white">
                    <option value="">Tanpa mata kuliah</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1.5 block text-xs font-bold">Deadline</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none transition focus:border-liquid-accent focus:bg-white"
                  ></input>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label mb-1.5 block text-xs font-bold">Deskripsi / Catatan Tambahan</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail tugas atau instruksi pengerjaan..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none transition focus:border-liquid-accent focus:bg-white"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {mode === "MANUAL" && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">
              Batal
            </button>

            <button
              type="submit"
              form="manual-task-form"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-liquid-accent px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-sky-700 disabled:opacity-50 active:scale-95"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? "Menyimpan..." : "Simpan Tugas"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

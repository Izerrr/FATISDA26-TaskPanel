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
      <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Tugas Baru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih mode pengisian manual atau otomatis dengan AI.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 p-1.5 gap-1.5 px-6">
          <button
            type="button"
            onClick={() => setMode("MANUAL")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              mode === "MANUAL"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-600"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <span>✏️ Mode Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("AI")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              mode === "AI" ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>✨ Mode AI (Otomatis)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</div>}

          {mode === "AI" ? (
            /* ================= MODE AI (AUTOMATIC PARSE) ================= */
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/40 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-900 dark:text-sky-200">AI Quick Input</p>
                    <p className="mt-0.5 text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">Ketik tugas secara natural seperti chat. AI akan otomatis menentukan mata kuliah, deadline, dan judul tugas.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Kalimat Tugas Kamu</label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  rows={3}
                  placeholder="Contoh: fisika krakatau besok senin jam 2 siang"
                  className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 text-sm outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800/90 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Example Chips */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Coba klik contoh:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Fisika Krakatau besok senin jam 2 siang", "Laporan praktikum alpro jumat jam 23.59 tugas kelas", "Kuis matematika diskrit lusa jam 10 pagi"].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setAiInput(example)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-300 transition"
                    >
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
                <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Hasil Format AI:</span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Berhasil Diproses</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Judul:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{title}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Mata Kuliah:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{selectedCourse ? `${selectedCourse.code} · ${selectedCourse.name}` : "Tanpa mata kuliah"}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Deadline:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{dueDate ? dueDate.replace("T", " ") : "Tidak ditentukan"}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lingkup:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{scope === "CLASS" ? "Tugas Kelas" : "Personal"}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/50">
                    <button
                      type="button"
                      onClick={handleApplyAiAndSwitch}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                    >
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
                <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Lingkup Tugas</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScope("PERSONAL")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                      scope === "PERSONAL" ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-xs" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Personal (Pribadi)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canCreateClass}
                    onClick={() => setScope("CLASS")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                      scope === "CLASS" ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-xs" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Judul Tugas *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Contoh: Laporan Fisika Krakatau"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Course & Due Date */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Mata Kuliah</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs outline-none transition focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                      Tanpa mata kuliah
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Deadline</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs outline-none transition focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi / Catatan Tambahan</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail tugas atau instruksi pengerjaan..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs outline-none transition focus:border-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {mode === "MANUAL" && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 px-6 py-3.5">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Batal
            </button>

            <button
              type="submit"
              form="manual-task-form"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-liquid-accent px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-sky-700 disabled:opacity-50 active:scale-95"
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

"use client";

import { useState } from "react";
import { Bot, Calendar, CheckCircle2, ChevronRight, Clock, Loader2, Sparkles, X } from "lucide-react";
import type { AiMatchResult } from "@/lib/schedule/ai-matcher";

interface ScheduleAiMatcherProps {
  defaultProdi?: string;
  defaultSemester?: number;
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  "Kelas A sama Kelas B freenya kapan?",
  "Kelas B smt 1 infor sama kelas A smt 1 sains data",
  "Kelas B smt 1 freenya kapan aja ya?",
  "Kapan slot kosong bareng hari Rabu?",
  "Cari jam rapat semua kelas semester 1",
];

/**
 * Komponen untuk merender jawaban markdown dari AI secara rapi, bersih,
 * tanpa menampilkan simbol ** atau ### mentah ke pengguna.
 */
function MarkdownBlock({ text }: { text: string }) {
  if (!text) return null;

  // Helper untuk mengubah text dengan **bold** menjadi elemen <strong>
  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      renderedElements.push(<div key={`spacer-${idx}`} className="h-1.5" />);
      return;
    }

    // 1. Heading 3: ### Title
    if (line.startsWith("### ")) {
      const headingText = line.replace(/^###\s+/, "");
      renderedElements.push(
        <div key={`h3-${idx}`} className="flex items-center gap-2 pt-2 pb-1 text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-700/60 mb-1.5">
          <span>{renderInline(headingText)}</span>
        </div>,
      );
      return;
    }

    // 2. Heading 4: #### Title
    if (line.startsWith("#### ")) {
      const subHeadingText = line.replace(/^####\s+/, "");
      renderedElements.push(
        <div key={`h4-${idx}`} className="flex items-center gap-1.5 pt-2 pb-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
          <span>{renderInline(subHeadingText)}</span>
        </div>,
      );
      return;
    }

    // 3. Blockquote: > Advice
    if (line.startsWith("> ")) {
      const quoteText = line.replace(/^>\s+/, "");
      renderedElements.push(
        <div key={`quote-${idx}`} className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-2.5 my-1.5 text-xs text-amber-950 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200 leading-relaxed shadow-xs">
          {renderInline(quoteText)}
        </div>,
      );
      return;
    }

    // 4. List items: - item or * item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemText = line.replace(/^[-*]\s+/, "");
      renderedElements.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
          <div className="flex-1 leading-relaxed">{renderInline(itemText)}</div>
        </div>,
      );
      return;
    }

    // 5. Normal text line
    renderedElements.push(
      <p key={`p-${idx}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed py-0.5">
        {renderInline(line)}
      </p>,
    );
  });

  return <div className="space-y-0.5">{renderedElements}</div>;
}

export function ScheduleAiMatcher({ defaultProdi = "INFORMATIKA", defaultSemester = 1, onClose }: ScheduleAiMatcherProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(searchQuery: string) {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setLoading(true);
      setError(null);
      setQuery(q);

      const res = await fetch("/api/schedule/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          prodi: defaultProdi,
          semester: defaultSemester,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses pertanyaan.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mencocokkan jadwal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/50 via-white to-white p-5 shadow-glass-lg dark:border-sky-500/20 dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 transition-all">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/10" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>AI Free-Time & Schedule Matcher</span>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">Live Engine</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Analisis matematis jadwal kuliah & pencarian jam kosong bersama antar kelas / lintas prodi.</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Pertanyaan Cepat:</span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSearch(prompt)}
            disabled={loading}
            className="rounded-full border border-sky-200/60 bg-white/90 px-3 py-1 text-[11px] font-medium text-sky-700 shadow-xs transition hover:border-sky-300 hover:bg-sky-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-sky-300 dark:hover:bg-slate-700"
          >
            ⚡ {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik pertanyaan (cth: 'Kelas B infor sama kelas A sadat freenya kapan?', 'kelas b smt 1 free kapan aja?')..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <span>Cari Jam Kosong</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Error View */}
      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">{error}</div>}

      {/* Result Display */}
      {result && (
        <div className="mt-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Summary Banner */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{result.summary}</p>
                {result.recommendations.length > 0 && <p className="mt-1 text-[11px] text-emerald-800/90 dark:text-emerald-300">💡 {result.recommendations[0]}</p>}
              </div>
            </div>
          </div>

          {/* Free Slots Grid */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Daftar Jam Kosong Bersama Terdeteksi ({result.freeSlots.length} slot)</h4>

            {result.freeSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">Tidak ada slot jam kosong bersama pada hari yang dipilih.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.freeSlots.map((slot, idx) => {
                  const classesDisplay = slot.classesFree.every((c) => c.length === 1)
                    ? slot.classesFree.map((c) => `Kls ${c}`).join(" & ")
                    : slot.classesFree.join(" ✕ ");

                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs hover:border-sky-200 dark:border-slate-800 dark:bg-slate-800/90 transition">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{slot.dayName}</span>
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{slot.durationMinutes} mnt</span>
                        </div>
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                          {slot.startTime} - {slot.endTime} WIB
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate" title={classesDisplay}>
                          {slot.label} · {classesDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Natural Answer Box */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
              <Bot className="h-4 w-4 text-sky-500" />
              <span className="text-xs font-bold">Analisis Detail AI:</span>
            </div>
            <MarkdownBlock text={result.markdownAnswer} />
          </div>
        </div>
      )}
    </div>
  );
}

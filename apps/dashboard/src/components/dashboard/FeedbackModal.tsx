import { useState } from "react";
import { Bug, Calendar, CheckCircle2, ClipboardList, HelpCircle, Lightbulb, Loader2, MessageSquare, Sparkles, X } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "BUG", label: "Bug / Error", icon: Bug, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" },
  { id: "JADWAL", label: "Koreksi Jadwal", icon: Calendar, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" },
  { id: "TUGAS", label: "Kendala Tugas", icon: ClipboardList, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" },
  { id: "FEATURE", label: "Ide Fitur Baru", icon: Lightbulb, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900" },
  { id: "GENERAL", label: "Saran Umum", icon: MessageSquare, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" },
];

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState("BUG");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg("Mohon tuliskan detail masukan atau kendala yang kamu temukan.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengirim masukan.");
      }

      setSuccess(true);
      setTimeout(() => {
        setMessage("");
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat mengirim masukan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-liquid-text dark:text-slate-100">Masukan &amp; Laporan Kendala</h2>
              <p className="text-xs text-liquid-text-secondary dark:text-slate-400">Fase Closed Beta · Bantu kami menyempurnakan TaskPanel</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-3 animate-in fade-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Terima Kasih Banyak!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Laporanmu telah berhasil dicatat. Tim pengurus akan segera memeriksa dan menindaklanjutinya.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-liquid-text dark:text-slate-300 mb-2">Pilih Kategori:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition text-left ${
                        isSelected
                          ? "border-liquid-accent bg-liquid-accent/10 text-liquid-accent dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-300 shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label className="block text-xs font-semibold text-liquid-text dark:text-slate-300 mb-1.5">Detail Laporan atau Masukan:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === "BUG"
                    ? "Jelaskan langkah yang menyebabkan bug atau bagian tampilan yang rusak..."
                    : category === "JADWAL"
                      ? "Sebutkan nama mata kuliah, kelas, hari, jam, atau ruang yang perlu dikoreksi..."
                      : "Tuliskan saran atau masukanmu secara ringkas dan jelas..."
                }
                rows={4}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-liquid-accent focus:bg-white dark:focus:bg-slate-800/90 placeholder:text-slate-400"
              />
            </div>

            {errorMsg && <p className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-2.5 text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Konteks halaman otomatis terlampir</span>

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent hover:bg-opacity-90 px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? "Mengirim..." : "Kirim Laporan"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

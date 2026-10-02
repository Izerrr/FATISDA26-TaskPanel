import { useState, useEffect } from "react";
import { X, Check, BookOpen, Layers, Calendar, AlertCircle } from "lucide-react";
import type { Prodi, Kelas } from "@/types";

interface ClassSelectorModalProps {
  open: boolean;
  initialProdi?: Prodi | null;
  initialKelas?: Kelas | null;
  initialSemester?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ClassSelectorModal({
  open,
  initialProdi,
  initialKelas,
  initialSemester,
  onClose,
  onSaved,
}: ClassSelectorModalProps) {
  const [prodi, setProdi] = useState<Prodi>(initialProdi ?? "INFORMATIKA");
  const [kelas, setKelas] = useState<Kelas>(initialKelas ?? "A");
  const [semester, setSemester] = useState<number>(initialSemester ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialProdi) setProdi(initialProdi);
      if (initialKelas) setKelas(initialKelas);
      if (initialSemester) setSemester(initialSemester);
      setError(null);
    }
  }, [open, initialProdi, initialKelas, initialSemester]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodi,
          kelas,
          semester,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui kelas.");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const prodiOptions: { value: Prodi; label: string }[] = [
    { value: "INFORMATIKA", label: "Informatika" },
    { value: "SAINS_DATA", label: "Sains Data" },
    { value: "INFORMATIKA_PSDKU_KEBUMEN", label: "Informatika PSDKU Kebumen" },
  ];

  const kelasOptions: Kelas[] = ["A", "B", "C", "D", "E"];
  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-selector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="class-selector-title" className="text-lg font-bold text-liquid-text dark:text-slate-100">
              Pengaturan Kelas &amp; Prodi
            </h2>
            <p className="mt-0.5 text-xs text-liquid-text-secondary dark:text-slate-400">
              Jadwal kuliah dan daftar tugas kelas akan disesuaikan dengan pilihanmu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Prodi */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-liquid-accent dark:text-sky-400" />
              <span>Program Studi</span>
            </label>
            <div className="mt-2 space-y-1.5">
              {prodiOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProdi(opt.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    prodi === opt.value
                      ? "border border-liquid-accent bg-liquid-accent/10 text-liquid-accent dark:border-sky-500 dark:bg-sky-500/20 dark:text-sky-300 shadow-sm"
                      : "border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {prodi === opt.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Kelas */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Layers className="h-3.5 w-3.5 text-liquid-accent dark:text-sky-400" />
              <span>Pilih Kelas</span>
            </label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {kelasOptions.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKelas(k)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    kelas === k
                      ? "border border-liquid-accent bg-liquid-accent text-white shadow-md shadow-liquid-accent/20"
                      : "border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-liquid-accent dark:text-sky-400" />
              <span>Semester Aktif</span>
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {semesterOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    semester === s
                      ? "border border-liquid-accent bg-liquid-accent text-white shadow-md shadow-liquid-accent/20"
                      : "border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-liquid-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-liquid-accent/20 hover:bg-liquid-accent/90 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Pilihan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

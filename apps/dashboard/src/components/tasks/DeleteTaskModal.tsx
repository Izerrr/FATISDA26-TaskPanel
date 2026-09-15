"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { Task } from "@/types";

interface DeleteTaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (task: Task) => Promise<void> | void;
}

export function DeleteTaskModal({ open, task, onClose, onConfirm }: DeleteTaskModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, loading]);

  useEffect(() => {
    if (open) {
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open || !mounted || !task) return null;

  async function handleDelete() {
    if (!task) return;
    try {
      setLoading(true);
      setError("");
      await onConfirm(task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus tugas.");
    } finally {
      setLoading(false);
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden cursor-default animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Konfirmasi Hapus Tugas</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-40"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tugas yang dipilih</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  task.scope === "CLASS"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                }`}
              >
                {task.scope === "CLASS" ? "Tugas Kelas" : "Personal"}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 break-words">{task.title}</p>

            {task.course && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Apakah kamu yakin ingin menghapus tugas ini? {task.scope === "CLASS" && "Notifikasi pembaruan tugas juga akan dikirimkan ke Discord."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 px-5 py-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{loading ? "Menghapus..." : "Hapus Tugas"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

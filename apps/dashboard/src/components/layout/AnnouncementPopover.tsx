"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Pin, Plus, X, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useRole } from "@/hooks/useRole";
import Image from "next/image";
import { formatWib } from "@/lib/datetime";

export function AnnouncementPopover() {
  const { user, roles } = useRole();
  const { announcements, isLoading, mutate } = useAnnouncements(user?.prodi, user?.kelas);

  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const isPrivileged = roles?.some((r: string) =>
    ["PJ_KELAS", "PJ_MATKUL", "ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(String(r))
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fatisda_announcement_last_read");
      const ts = stored ? parseInt(stored, 10) : 0;
      setLastReadTimestamp(ts);
    } catch {}
  }, []);

  useEffect(() => {
    if (!announcements || announcements.length === 0) {
      setUnreadCount(0);
      return;
    }
    const unread = announcements.filter(
      (a) => new Date(a.createdAt).getTime() > lastReadTimestamp
    ).length;
    setUnreadCount(unread);
  }, [announcements, lastReadTimestamp]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleMarkAllRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem("fatisda_announcement_last_read", now.toString());
    } catch {}
    setLastReadTimestamp(now);
    setUnreadCount(0);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          isPinned,
          prodi: user?.prodi,
          kelas: user?.kelas,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        mutate();
        handleMarkAllRead();
      }
    } catch (err) {
      console.error("Gagal membuat pengumuman:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) mutate();
    } catch (err) {
      console.error("Gagal menghapus pengumuman:", err);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open && unreadCount > 0) {
            handleMarkAllRead();
          }
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.03] text-liquid-text-secondary transition hover:bg-black/[0.06] hover:text-liquid-text dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Pengumuman & Notifikasi"
        title="Pengumuman Pengurus"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Pengumuman Pengurus</span>
              {announcements.length > 0 && (
                <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  {announcements.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Sudah Dibaca</span>
                </button>
              )}

              {isPrivileged && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-liquid-accent/10 px-2 py-1 text-[10px] font-bold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300 hover:bg-liquid-accent/20 transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>Buat</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="flex justify-center py-6 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 italic">Belum ada pengumuman dari pengurus.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="pt-2.5 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {ann.isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">{ann.title}</h4>
                    </div>
                    {(isPrivileged || user?.id === ann.authorId) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(ann.id)}
                        className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                        title="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {ann.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{ann.author.username}</span>
                    <span>•</span>
                    <span>
                      {formatWib(ann.createdAt, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Buat Pengumuman */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-liquid-border dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-liquid-border dark:border-slate-800">
              <h2 className="text-sm font-semibold text-liquid-text dark:text-slate-100">Buat Pengumuman Baru</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Judul</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Info Perkuliahan Pengganti..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan informasi lengkap untuk rekan sekelas..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin-announcement-popover"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-liquid-accent focus:ring-liquid-accent"
                />
                <label htmlFor="pin-announcement-popover" className="text-xs text-liquid-text dark:text-slate-300">
                  Sematkan pengumuman (Pin di atas)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-liquid-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium bg-liquid-accent text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Publikasikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

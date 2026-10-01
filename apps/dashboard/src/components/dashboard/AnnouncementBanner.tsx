"use client";

import { useEffect, useState } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Loader2, Pin, Plus, X, Trash2, CheckCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import type { User } from "next-auth";

interface AnnouncementBannerProps {
  user: any; // Using any for simplicity since User type is extended
}

export function AnnouncementBanner({ user }: AnnouncementBannerProps) {
  const { announcements, isLoading, mutate } = useAnnouncements(user?.prodi, user?.kelas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

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

  const handleMarkAllRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem("fatisda_announcement_last_read", now.toString());
    } catch {}
    setLastReadTimestamp(now);
    setUnreadCount(0);
  };

  const isPrivileged = user?.roles?.some((r: string) => 
    ['PJ_KELAS', 'PJ_MATKUL', 'ADMIN', 'OWNER', 'KETUA_ANGKATAN'].includes(r)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          content, 
          isPinned,
          prodi: user?.prodi, // Default to user's prodi/kelas for now, can be improved
          kelas: user?.kelas 
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        mutate();
      }
    } catch (error) {
      console.error("Failed to create announcement", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) mutate();
    } catch (error) {
      console.error("Failed to delete announcement", error);
    }
  };

  if (!isLoading && announcements.length === 0 && !isPrivileged) {
    return null; // Don't show anything for regular users if no announcements
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-liquid-text">Pengumuman Pengurus</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
              {unreadCount} Baru
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-liquid-accent dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai dibaca</span>
            </button>
          )}

          {isPrivileged && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-liquid-accent/10 text-liquid-accent hover:bg-liquid-accent/20 rounded-xl text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              Buat Pengumuman
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-liquid-accent" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500">Belum ada pengumuman dari pengurus.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const isUnread = new Date(ann.createdAt).getTime() > lastReadTimestamp;
            return (
              <div 
                key={ann.id} 
                className={`p-4 rounded-2xl border relative transition-all ${
                  ann.isPinned 
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" 
                    : isUnread
                    ? "bg-sky-50/30 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-liquid-border shadow-xs"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                    <h3 className="text-sm font-semibold text-liquid-text leading-tight">{ann.title}</h3>
                    {isUnread && (
                      <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                        Baru
                      </span>
                    )}
                  </div>
                  {(isPrivileged || user?.id === ann.authorId) && (
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              <p className="text-xs text-liquid-text-secondary whitespace-pre-wrap mb-3 line-clamp-3">
                {ann.content}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                {ann.author.avatar ? (
                  <Image 
                    src={ann.author.avatar} 
                    alt={ann.author.username} 
                    width={16} 
                    height={16} 
                    className="rounded-full w-4 h-4 object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
                <span className="font-medium text-slate-600 dark:text-slate-400">{ann.author.username}</span>
                <span>•</span>
                <span>
                  {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-liquid-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-liquid-border">
              <h2 className="text-sm font-semibold text-liquid-text">Buat Pengumuman Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-liquid-text mb-1.5">Judul</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-liquid-border px-3 py-2 text-xs text-liquid-text focus:outline-none focus:ring-2 focus:ring-liquid-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-liquid-text mb-1.5">Isi Pengumuman</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-liquid-border px-3 py-2 text-xs text-liquid-text focus:outline-none focus:ring-2 focus:ring-liquid-accent resize-none"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-liquid-accent focus:ring-liquid-accent"
                />
                <label htmlFor="isPinned" className="text-xs font-medium text-liquid-text cursor-pointer">
                  Pin pengumuman ini (tampil paling atas)
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-liquid-accent text-white hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

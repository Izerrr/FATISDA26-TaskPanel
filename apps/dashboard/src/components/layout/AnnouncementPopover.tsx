"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Bell,
  CheckCheck,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Pin,
  Plus,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { formatWibShort } from "@/lib/datetime";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  createdAt: string;
  prodi?: string | null;
  kelas?: string | null;
  author?: {
    username: string;
    avatar: string | null;
  };
}

type PopoverTab = "notifications" | "announcements";

const LAST_READ_KEY = "fatisda_announcement_last_read";

function getNotificationIcon(type: string) {
  switch (type) {
    case "GROUP_INVITE":
      return { Icon: Users, tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" };
    case "TASK_COMMENT":
      return { Icon: MessageSquare, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" };
    case "MENTION":
      return { Icon: AtSign, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
    case "DISCUSSION_REPLY":
      return { Icon: MessagesSquare, tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400" };
    case "VAULT_APPROVED":
      return { Icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" };
    case "VAULT_REJECTED":
      return { Icon: XCircle, tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400" };
    default:
      return { Icon: Bell, tone: "bg-slate-500/15 text-slate-600 dark:text-slate-300" };
  }
}

export function AnnouncementPopover() {
  const router = useRouter();
  const { user, canCreateClassTask, isAdmin } = useRole();
  const {
    notifications,
    unreadCount: personalUnread,
    isLoading: loadingNotifications,
    markRead,
  } = useNotifications(Boolean(user));

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PopoverTab>("notifications");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementUnread, setAnnouncementUnread] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const markAnnouncementsRead = useCallback((items: AnnouncementItem[]) => {
    const latestTs = items.reduce((max, item) => {
      const ts = new Date(item.createdAt).getTime();
      return ts > max ? ts : max;
    }, Date.now());
    try {
      localStorage.setItem(LAST_READ_KEY, String(latestTs));
    } catch {
      // Ignore storage quota / private mode restrictions
    }
    setAnnouncementUnread(0);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    try {
      const params = new URLSearchParams();
      if (user?.prodi) params.set("prodi", user.prodi);
      if (user?.kelas) params.set("kelas", user.kelas);
      const query = params.toString();
      const res = await fetch(query ? `/api/announcements?${query}` : "/api/announcements");
      if (!res.ok) return;
      const data = await res.json();
      const list: AnnouncementItem[] = Array.isArray(data.announcements) ? data.announcements : [];
      setAnnouncements(list);

      try {
        const lastReadRaw = localStorage.getItem(LAST_READ_KEY);
        const lastRead = lastReadRaw ? Number(lastReadRaw) : 0;
        const unread = list.filter((a) => new Date(a.createdAt).getTime() > lastRead).length;
        setAnnouncementUnread(unread);
      } catch {
        setAnnouncementUnread(0);
      }
    } catch (err) {
      console.error("[AnnouncementPopover] Failed to load announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [user?.prodi, user?.kelas]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const totalUnread = personalUnread + announcementUnread;

  function handleTogglePopover() {
    const next = !open;
    setOpen(next);
    if (next) {
      const preferredTab: PopoverTab =
        personalUnread > 0 ? "notifications" : announcementUnread > 0 ? "announcements" : activeTab;
      setActiveTab(preferredTab);
      if (preferredTab === "announcements" && announcementUnread > 0) {
        markAnnouncementsRead(announcements);
      }
    }
  }

  function handleSwitchTab(tab: PopoverTab) {
    setActiveTab(tab);
    if (tab === "announcements" && announcementUnread > 0) {
      markAnnouncementsRead(announcements);
    }
  }

  async function handleNotificationClick(notif: AppNotification) {
    if (!notif.isRead) {
      void markRead([notif.id]);
    }
    setOpen(false);
    if (notif.href) {
      router.push(notif.href);
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isPinned,
          prodi: user?.prodi ?? null,
          kelas: user?.kelas ?? null,
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setIsPinned(false);
        setModalOpen(false);
        await fetchAnnouncements();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("[AnnouncementPopover] Failed to delete announcement:", err);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleTogglePopover}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.03] text-liquid-text-secondary transition hover:bg-black/[0.06] hover:text-liquid-text dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Notifikasi & Pengumuman"
        title="Notifikasi & Pengumuman"
      >
        <Bell className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* 2-Tab Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-1.5 gap-1">
            <button
              type="button"
              onClick={() => handleSwitchTab("notifications")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                activeTab === "notifications"
                  ? "bg-white dark:bg-slate-800 text-liquid-text dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Notifikasi Saya</span>
              {personalUnread > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                  {personalUnread > 99 ? "99+" : personalUnread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab("announcements")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                activeTab === "announcements"
                  ? "bg-white dark:bg-slate-800 text-liquid-text dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span>Pengumuman Kelas</span>
              {announcements.length > 0 && (
                <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200 leading-none">
                  {announcements.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "notifications" ? (
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {personalUnread > 0 ? `${personalUnread} belum dibaca` : "Semua sudah terbaca"}
                </span>
                {personalUnread > 0 && (
                  <button
                    type="button"
                    onClick={() => void markRead(undefined, true)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-liquid-accent hover:bg-liquid-accent/10 transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {loadingNotifications && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Memuat notifikasi...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum ada notifikasi pribadi</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Undangan kelompok, @mention, komentar tugas, dan status usulan Vault akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const { Icon, tone } = getNotificationIcon(notif.type);
                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notif)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          notif.isRead ? "opacity-80" : "bg-liquid-accent/[0.04] dark:bg-liquid-accent/[0.07]"
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-liquid-accent"
                                aria-label="Belum dibaca"
                              />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {notif.body}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">{formatWibShort(notif.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Info Pengurus Kelas
                </span>
                {canCreateClassTask && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-liquid-accent/10 px-2.5 py-1 text-[11px] font-semibold text-liquid-accent hover:bg-liquid-accent/20 transition"
                  >
                    <Plus className="h-3 w-3" />
                    Buat
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {loadingAnnouncements && announcements.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Memuat pengumuman...</div>
                ) : announcements.length === 0 ? (
                  <div className="p-8 text-center">
                    <Megaphone className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum ada pengumuman aktif</p>
                    <p className="mt-1 text-[11px] text-slate-400">Info dari PJ kelas atau pengurus akan muncul di sini.</p>
                  </div>
                ) : (
                  announcements.map((item) => {
                    const canDelete = isAdmin || (user?.id && item.authorId === user.id);
                    return (
                      <div key={item.id} className="px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.isPinned && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                <Pin className="h-2.5 w-2.5" />
                                Pin
                              </span>
                            )}
                            <h4 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                          </div>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteAnnouncement(item.id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition shrink-0"
                              title="Hapus pengumuman"
                              aria-label="Hapus pengumuman"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-line text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.content}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>@{item.author?.username || "pengurus"}</span>
                          <span>{formatWibShort(item.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Buat Pengumuman untuk PJ / Pengurus */}
      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-liquid-border dark:border-slate-800 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-liquid-accent" />
                  <h3 className="text-sm font-bold text-liquid-text dark:text-slate-100">Buat Pengumuman Kelas</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Tutup modal pengumuman"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">
                    Judul Pengumuman
                  </label>
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
                  <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">
                    Isi Pengumuman
                  </label>
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
          </div>,
          document.body
        )}
    </div>
  );
}

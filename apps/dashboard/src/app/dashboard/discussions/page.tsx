"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Bot, 
  Search, 
  CalendarClock, 
  ChevronRight, 
  ExternalLink, 
  Pin, 
  Plus, 
  Trash2, 
  Loader2,
  Send,
  HelpCircle,
  Command
} from "lucide-react";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { useTasks } from "@/hooks/useTasks";
import { useGuild } from "@/components/providers/GuildProvider";
import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { TaskDetailModal } from "@/components/kanban/TaskDetailModal";
import type { Task } from "@/types";
import { formatDueDate, getUrgency } from "@/lib/due-date";

export default function DiscussionsPage() {
  const { selectedGuild } = useGuild();
  const { tasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks(selectedGuild);
  const { courses } = useCourses();
  const { user, roles } = useRole();
  const { announcements, isLoading: annLoading, mutate: mutateAnnouncements } = useAnnouncements(user?.prodi, user?.kelas);

  const [activeTab, setActiveTab] = useState<"tasks" | "announcements" | "discord">("tasks");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Announcement modal state
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const isPrivileged = roles?.some((r: string) =>
    ["PJ_KELAS", "PJ_MATKUL", "ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(String(r))
  );

  const filteredTasks = tasks.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.course?.name ?? "").toLowerCase().includes(q)
    );
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setAnnSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          isPinned: annPinned,
          prodi: user?.prodi,
          kelas: user?.kelas,
        }),
      });
      if (res.ok) {
        setAnnModalOpen(false);
        setAnnTitle("");
        setAnnContent("");
        setAnnPinned(false);
        mutateAnnouncements();
      }
    } catch (err) {
      console.error("Gagal membuat pengumuman:", err);
    } finally {
      setAnnSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) mutateAnnouncements();
    } catch (err) {
      console.error("Gagal menghapus pengumuman:", err);
    }
  };

  const discordCommands = [
    { cmd: "/tugas", desc: "Melihat daftar tugas kelas aktif dan deadline terdekat." },
    { cmd: "/jadwal", desc: "Melihat jadwal perkuliahan hari ini atau besok." },
    { cmd: "/briefing", desc: "Trigger manual ringkasan pagi jadwal & tugas kelas." },
    { cmd: "/panel", desc: "Buka link cepat menuju website TaskPanel." },
    { cmd: "/sync", desc: "Sinkronisasi role Discord dan profil kelas akunmu." },
  ];

  return (
    <DashboardFrame>
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-liquid-border dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-sky-950/40 p-6 shadow-xs md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-liquid-accent/10 dark:bg-sky-500/20 text-liquid-accent dark:text-sky-400 shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-liquid-text dark:text-slate-100 md:text-2xl">
                    Forum Diskusi &amp; Koordinasi
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                    <Sparkles className="h-3 w-3" />
                    Terintegrasi
                  </span>
                </div>

                <p className="mt-2 max-w-xl text-xs leading-relaxed text-liquid-text-secondary dark:text-slate-400 sm:text-sm">
                  Pusat komunikasi mahasiswa FATISDA 2026. Diskusikan tugas kelompok, baca pengumuman resmi pengurus, atau terhubung langsung ke Discord server.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://discord.com/channels/1547427568599302287"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
              >
                <span>Buka Server Discord</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Beranda</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "tasks"
                ? "bg-liquid-accent text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Thread Tugas ({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "announcements"
                ? "bg-liquid-accent text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
            <span>Pengumuman Pengurus ({announcements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discord")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "discord"
                ? "bg-liquid-accent text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Integrasi Bot Discord</span>
          </button>
        </div>

        {/* TAB 1: THREAD TUGAS */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari thread tugas atau nama matkul..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-liquid-accent shadow-xs"
                />
              </div>

              <span className="text-xs text-slate-400">
                Klik kartu tugas untuk membuka diskusi komentar
              </span>
            </div>

            {tasksLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tidak ada tugas ditemukan</p>
                <p className="mt-1 text-xs text-slate-400">Belum ada tugas yang cocok dengan kata kunci pencarian.</p>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((t) => {
                  const urgency = getUrgency(t.dueDate);
                  return (
                    <article
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-sky-400/60 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              t.scope === "CLASS"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"
                            }`}
                          >
                            {t.scope === "CLASS" ? "Kelas" : "Personal"}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-liquid-accent transition-colors flex items-center gap-0.5">
                            Buka Diskusi →
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-liquid-accent dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                          {t.title}
                        </h3>

                        {t.course && (
                          <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">
                            {t.course.code} · {t.course.name}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <MessageSquare className="h-3 w-3 text-sky-500" />
                          <span>Buka Komentar</span>
                        </span>

                        {t.dueDate && (
                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                              urgency === "overdue"
                                ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50"
                                : urgency === "dueSoon"
                                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
                                : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                            }`}
                          >
                            {formatDueDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENGUMUMAN PENGURUS */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daftar Pengumuman Resmi</h2>
                <p className="text-xs text-slate-400">Informasi perkuliahan dan agenda dari PJ Kelas &amp; Pengurus Angkatan</p>
              </div>

              {isPrivileged && (
                <button
                  type="button"
                  onClick={() => setAnnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-95 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Buat Pengumuman</span>
                </button>
              )}
            </div>

            {annLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-liquid-accent" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
                <Pin className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Belum ada pengumuman</p>
                <p className="mt-1 text-xs text-slate-400">Pengumuman penting dari pengurus akan ditampilkan di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      ann.isPinned
                        ? "border-amber-300/80 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs"
                        : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {ann.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            <Pin className="h-3 w-3" /> Pinned
                          </span>
                        )}
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{ann.title}</h3>
                      </div>

                      {(isPrivileged || user?.id === ann.authorId) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Diposting oleh: <strong className="text-slate-600 dark:text-slate-300">{ann.author.username}</strong></span>
                      <span>
                        {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })} WIB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISCORD COMMUNITY & BOT */}
        {activeTab === "discord" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#5865F2] text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bot FATISDA 2026</h3>
                    <p className="text-xs text-slate-400">Terhubung ke Database Supabase</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bot Discord TaskPanel aktif 24/7 dan otomatis mengirimkan <strong>Morning Briefing</strong> setiap pukul 07:00 WIB serta <strong>Pengingat Deadline Tugas</strong> (H-1 &amp; H-6 Jam).
                </p>
                <div className="pt-2">
                  <a
                    href="https://discord.com/channels/1547427568599302287"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <span>Masuk ke Discord Server</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4 text-liquid-accent dark:text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daftar Perintah Slash Bot</h3>
                </div>
                <div className="space-y-2">
                  {discordCommands.map((c) => (
                    <div key={c.cmd} className="flex items-start gap-2.5 text-xs">
                      <code className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">
                        {c.cmd}
                      </code>
                      <span className="text-slate-600 dark:text-slate-300">{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          courses={courses}
          roles={roles}
          userId={user?.id}
          onClose={() => setSelectedTask(null)}
          onStatusChange={async (t, newStatus) => {
            await fetch(`/api/tasks/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });
            mutateTasks();
            setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
          }}
        />
      )}

      {/* Modal Buat Pengumuman */}
      {annModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-liquid-border dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-liquid-border dark:border-slate-800">
              <h2 className="text-sm font-semibold text-liquid-text dark:text-slate-100">Buat Pengumuman Baru</h2>
              <button
                type="button"
                onClick={() => setAnnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Judul</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Misal: Info Perkuliahan Pengganti..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Tuliskan informasi lengkap untuk rekan sekelas..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin-announcement-discussions"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="rounded border-slate-300 text-liquid-accent focus:ring-liquid-accent"
                />
                <label htmlFor="pin-announcement-discussions" className="text-xs text-liquid-text dark:text-slate-300">
                  Sematkan pengumuman (Pin di atas)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-liquid-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAnnModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={annSubmitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium bg-liquid-accent text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {annSubmitting ? "Menyimpan..." : "Publikasikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}

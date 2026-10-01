"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Command,
  GraduationCap,
  MessageCircle,
  Share2,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useDiscussions, type CourseDiscussionItem } from "@/hooks/useDiscussions";
import type { Course } from "@/types";

function DiscussionsContent() {
  const { courses, isLoading: coursesLoading } = useCourses();
  const { user, roles } = useRole();
  const { announcements, isLoading: annLoading, mutate: mutateAnnouncements } = useAnnouncements(user?.prodi, user?.kelas);

  const searchParams = useSearchParams();
  const paramCourseId = searchParams.get("courseId");
  const paramCourseName = searchParams.get("courseName");

  // Main Tabs: "courses" (Diskusi Per Matkul & Kelas), "announcements", "discord"
  const [activeTab, setActiveTab] = useState<"courses" | "announcements" | "discord">("courses");

  // Selected Channel: null = Forum Umum Kelas, or courseId/courseName
  const [selectedChannel, setSelectedChannel] = useState<{ id?: string; name: string } | null>(null);

  useEffect(() => {
    if (paramCourseId && courses.length > 0) {
      const match = courses.find((c) => c.id === paramCourseId);
      if (match) {
        setSelectedChannel({ id: match.id, name: match.name });
      }
    } else if (paramCourseName) {
      setSelectedChannel({ name: paramCourseName });
    }
  }, [paramCourseId, paramCourseName, courses]);

  // Active course ID / name for fetching discussions
  const channelCourseId = selectedChannel?.id?.startsWith("sched-") ? undefined : selectedChannel?.id;
  const channelCourseName = selectedChannel?.name === "Forum Umum Kelas" ? "Forum Umum Kelas" : selectedChannel?.name;

  const { discussions, isLoading: discLoading, mutate: mutateDiscussions } = useDiscussions(channelCourseId, channelCourseName);

  // Search filter
  const [search, setSearch] = useState("");

  // New Discussion Topic Modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");
  const [topicPinned, setTopicPinned] = useState(false);
  const [submittingTopic, setSubmittingTopic] = useState(false);

  // Reply state: map of discussionId -> reply input text
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Announcement modal state
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const isPrivileged = roles?.some((r: string) => ["PJ_KELAS", "PJ_MATKUL", "ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(String(r)));

  // Active channel title
  const currentChannelTitle = selectedChannel ? selectedChannel.name : "Forum Umum Kelas";

  const filteredDiscussions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return discussions;
    return discussions.filter((d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.author.username.toLowerCase().includes(q));
  }, [discussions, search]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicContent.trim()) return;

    setSubmittingTopic(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: channelCourseId,
          courseName: currentChannelTitle,
          title: topicTitle,
          content: topicContent,
          isPinned: topicPinned,
        }),
      });

      if (res.ok) {
        setTopicModalOpen(false);
        setTopicTitle("");
        setTopicContent("");
        setTopicPinned(false);
        mutateDiscussions();
      }
    } catch (err) {
      console.error("Gagal membuat topik diskusi:", err);
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handleSendReply = async (discussionId: string) => {
    const text = replyInputs[discussionId]?.trim();
    if (!text) return;

    setSubmittingReply((prev) => ({ ...prev, [discussionId]: true }));
    try {
      const res = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        setReplyInputs((prev) => ({ ...prev, [discussionId]: "" }));
        mutateDiscussions();
      }
    } catch (err) {
      console.error("Gagal mengirim balasan:", err);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [discussionId]: false }));
    }
  };

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
                  <h1 className="text-xl font-bold tracking-tight text-liquid-text dark:text-slate-100 md:text-2xl">Forum Diskusi &amp; Tanya Jawab</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                    <Sparkles className="h-3 w-3" />
                    Per Mata Kuliah
                  </span>
                </div>

                <p className="mt-2 max-w-xl text-xs leading-relaxed text-liquid-text-secondary dark:text-slate-400 sm:text-sm">
                  Pusat tanya jawab materi, kisi-kisi ujian, dan koordinasi belajar bersama per mata kuliah atau kelas di FATISDA 2026.
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
            onClick={() => setActiveTab("courses")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "courses" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Diskusi Mata Kuliah &amp; Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "announcements" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
            <span>Pengumuman Pengurus ({announcements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discord")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "discord" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Integrasi Bot Discord</span>
          </button>
        </div>

        {/* TAB 1: DISKUSI PER MATA KULIAH & KELAS */}
        {activeTab === "courses" && (
          <div className="grid gap-6 lg:grid-cols-4 items-start">
            {/* Left Column: Channels & Courses Picker */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Saluran Diskusi</span>
                <span className="text-[10px] font-semibold text-slate-400">{courses.length + 1} Saluran</span>
              </div>

              {/* General Class Forum Button */}
              <button
                type="button"
                onClick={() => setSelectedChannel(null)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
                  selectedChannel === null ? "bg-liquid-accent text-white shadow-xs" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">Forum Umum Kelas</span>
                </div>
                {selectedChannel === null && <span className="h-2 w-2 rounded-full bg-white shrink-0" />}
              </button>

              <div className="pt-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">Mata Kuliah ({user?.kelas ? `Kelas ${user.kelas}` : "Semua"})</span>

                {coursesLoading ? (
                  <div className="space-y-1.5 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                    {courses.map((c) => {
                      const isSelected = selectedChannel?.name === c.name;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedChannel({ id: c.id, name: c.name })}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-left transition-all ${
                            isSelected ? "bg-liquid-accent text-white shadow-xs font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{c.name}</p>
                            <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                              {c.code} {c.kelas ? `· Kelas ${c.kelas}` : ""}
                            </p>
                          </div>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-white shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Discussion Feed for selected course */}
            <div className="lg:col-span-3 space-y-4">
              {/* Channel Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{currentChannelTitle}</h2>
                    <p className="text-[11px] text-slate-400">Ruang tanya jawab materi, kisi-kisi ujian, dan diskusi kelas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTopicModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-95 active:scale-95 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Mulai Diskusi</span>
                  </button>
                </div>
              </div>

              {/* Search in Channel */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Cari topik diskusi di ${currentChannelTitle}...`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-liquid-accent shadow-xs"
                />
              </div>

              {/* Discussion Posts Feed */}
              {discLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  ))}
                </div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Belum ada topik diskusi di {currentChannelTitle}</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">Punya pertanyaan materi, kendala praktikum, atau ingin berbagi kisi-kisi? Klik tombol di bawah untuk memulai!</p>
                  <button
                    type="button"
                    onClick={() => setTopicModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-4 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-95 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tanya Sesuatu</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDiscussions.map((d) => (
                    <article
                      key={d.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        d.isPinned ? "border-amber-300/80 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs" : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                      }`}
                    >
                      {/* Topic Author Header */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          {d.author.avatar ? (
                            <img src={d.author.avatar} alt={d.author.username} className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-800" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-liquid-accent text-xs font-bold text-white shadow-xs">{d.author.username.charAt(0).toUpperCase()}</div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{d.author.username}</span>
                              {d.isPinned && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                                  <Pin className="h-2.5 w-2.5" /> Pinned
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(d.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              WIB
                            </span>
                          </div>
                        </div>

                        {d.courseName && <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">{d.courseName}</span>}
                      </div>

                      {/* Topic Title & Content */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 leading-snug">{d.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{d.content}</p>

                      {/* Replies List */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{d.replies?.length ?? 0} Balasan</span>
                          </span>
                        </div>

                        {d.replies && d.replies.length > 0 && (
                          <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                            {d.replies.map((reply) => (
                              <div key={reply.id} className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-2.5 text-xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    {reply.author.avatar ? (
                                      <img src={reply.author.avatar} alt={reply.author.username} className="h-4 w-4 rounded-full object-cover" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[9px] font-bold text-white">{reply.author.username.charAt(0)}</div>
                                    )}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">{reply.author.username}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(reply.createdAt).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-5">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendReply(d.id);
                          }}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={replyInputs[d.id] || ""}
                            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                            placeholder="Tulis jawaban atau tanggapan..."
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                          />
                          <button
                            type="submit"
                            disabled={!replyInputs[d.id]?.trim() || submittingReply[d.id]}
                            className="inline-flex items-center gap-1 rounded-xl bg-liquid-accent px-3 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-95 disabled:opacity-50 transition"
                          >
                            {submittingReply[d.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">Kirim</span>
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
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
                <button type="button" onClick={() => setAnnModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-95 transition">
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
                      ann.isPinned ? "border-amber-300/80 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs" : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
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
                        <button type="button" onClick={() => handleDeleteAnnouncement(ann.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Diposting oleh: <strong className="text-slate-600 dark:text-slate-300">{ann.author.username}</strong>
                      </span>
                      <span>
                        {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        WIB
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
                      <code className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">{c.cmd}</code>
                      <span className="text-slate-600 dark:text-slate-300">{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Buat Topik Diskusi Matkul Baru */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-liquid-border dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-liquid-border dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-liquid-text dark:text-slate-100">Mulai Topik Diskusi Baru</h2>
                <p className="text-[11px] text-slate-400">
                  Saluran: <strong>{currentChannelTitle}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setTopicModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Judul Pertanyaan / Topik</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Misal: Tanya soal latihan nomor 4 praktikum..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-liquid-text dark:text-slate-300 mb-1">Penjelasan / Detail Pertanyaan</label>
                <textarea
                  required
                  rows={4}
                  value={topicContent}
                  onChange={(e) => setTopicContent(e.target.value)}
                  placeholder="Tuliskan kendala yang dihadapi, potongan kode, atau materi yang ingin didiskusikan..."
                  className="w-full rounded-xl border border-liquid-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-liquid-text dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-liquid-accent"
                />
              </div>

              {isPrivileged && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pin-topic" checked={topicPinned} onChange={(e) => setTopicPinned(e.target.checked)} className="rounded border-slate-300 text-liquid-accent focus:ring-liquid-accent" />
                  <label htmlFor="pin-topic" className="text-xs text-liquid-text dark:text-slate-300">
                    Sematkan topik (Pin di atas)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-liquid-border dark:border-slate-800">
                <button type="button" onClick={() => setTopicModalOpen(false)} className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Batal
                </button>
                <button type="submit" disabled={submittingTopic} className="px-4 py-1.5 rounded-xl text-xs font-medium bg-liquid-accent text-white hover:bg-opacity-90 disabled:opacity-50">
                  {submittingTopic ? "Mengirim..." : "Kirim Topik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Pengumuman */}
      {annModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-liquid-border dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-liquid-border dark:border-slate-800">
              <h2 className="text-sm font-semibold text-liquid-text dark:text-slate-100">Buat Pengumuman Baru</h2>
              <button type="button" onClick={() => setAnnModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
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
                <input type="checkbox" id="pin-announcement-discussions" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} className="rounded border-slate-300 text-liquid-accent focus:ring-liquid-accent" />
                <label htmlFor="pin-announcement-discussions" className="text-xs text-liquid-text dark:text-slate-300">
                  Sematkan pengumuman (Pin di atas)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-liquid-border dark:border-slate-800">
                <button type="button" onClick={() => setAnnModalOpen(false)} className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Batal
                </button>
                <button type="submit" disabled={annSubmitting} className="px-4 py-1.5 rounded-xl text-xs font-medium bg-liquid-accent text-white hover:bg-opacity-90 disabled:opacity-50">
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

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-white/50 dark:bg-slate-900/50" />}>
      <DiscussionsContent />
    </Suspense>
  );
}

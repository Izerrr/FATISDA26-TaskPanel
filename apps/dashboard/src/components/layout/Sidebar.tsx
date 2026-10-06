"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, FolderGit2, GraduationCap, LayoutDashboard, LogOut, MessageSquare, RefreshCw, Sparkles, UserRound, X } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Course, User } from "@/types";

import { SidebarInstallButton } from "@/components/pwa/InstallPrompt";
import { useSessionManager } from "@/components/providers/SessionManager";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";

interface SidebarProps {
  courses: Course[];
  user: User | null;
  guildId: string | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/tasks",
    label: "Tugas",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/schedule",
    label: "Jadwal Kuliah",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/schedule/exam",
    label: "Jadwal UTS / UAS",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/courses",
    label: "Mata Kuliah & Vault",
    icon: BookOpen,
  },
  {
    href: "/dashboard/discussions",
    label: "Diskusi",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/profile",
    label: "Profil Saya",
    icon: UserRound,
  },
] as const;

function getProdiLabel(prodi: User["prodi"]) {
  switch (prodi) {
    case "INFORMATIKA":
      return "Informatika";

    case "SAINS_DATA":
      return "Sains Data";

    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "Informatika PSDKU Kebumen";

    default:
      return null;
  }
}

function getRoleLabels(user: User | null) {
  if (!user) {
    return ["Mahasiswa"];
  }

  const roles = user.roles ?? [];

  const labels: string[] = [];

  if (roles.includes("OWNER")) {
    labels.push("Owner");
  }

  if (roles.includes("ADMIN")) {
    labels.push("Administrator");
  }

  if (roles.includes("KETUA_ANGKATAN")) {
    labels.push("Ketua Angkatan");
  }

  if (roles.includes("PJ_KELAS")) {
    labels.push("PJ Kelas");
  }

  if (roles.includes("PJ_MATKUL")) {
    labels.push("PJ Mata Kuliah");
  }

  if (labels.length === 0) {
    labels.push("Mahasiswa");
  }

  return labels;
}

export function Sidebar({ courses, user, guildId, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { triggerSync } = useSessionManager();

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const prodiLabel = getProdiLabel(user?.prodi ?? null);

  const profileLabel = [prodiLabel, user?.kelas ? `Kelas ${user.kelas}` : null].filter(Boolean).join(" · ");

  const roleLabels = getRoleLabels(user);
  const canManageVault = (user?.roles || []).some((r) => ["ADMIN", "OWNER", "PJ_KELAS", "PJ_MATKUL", "KETUA_ANGKATAN"].includes(r as string));
  const canAccessAnalytics = (user?.roles || []).some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(r as string));

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  const [updatingKelas, setUpdatingKelas] = useState(false);

  async function handleSelectKelas(newKelas: string) {
    try {
      setUpdatingKelas(true);
      void triggerSync("Menyimpan kelas...");
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelas: newKelas }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingKelas(false);
    }
  }

  async function handleSync() {
    if (syncing) {
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage("");
      void triggerSync("Menyelaraskan dengan Discord...");

      // 1. Sync akun profil sendiri langsung dari Discord
      const meResponse = await fetch("/api/me/sync", {
        method: "POST",
      });

      const meData = await meResponse.json();

      // 2. Jika ada guildId, coba sync seluruh member server juga
      if (guildId) {
        await fetch(`/api/guilds/${guildId}/sync`, {
          method: "POST",
        }).catch(() => null);
      }

      if (!meResponse.ok) {
        throw new Error(meData.error ?? "Sinkronisasi gagal.");
      }

      const prodiName = meData.user?.prodi ? meData.user.prodi.replace(/_/g, " ") : null;
      if (prodiName) {
        setSyncMessage(`Profil tersinkron: ${prodiName}${meData.user.kelas ? ` Kelas ${meData.user.kelas}` : ""}`);
      } else {
        setSyncMessage("Profil diperbarui dari Discord.");
      }

      window.location.reload();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Sinkronisasi gagal.");
    } finally {
      setSyncing(false);
    }
  }

  const sidebarContent = (
    <div className="flex h-full w-full md:w-72 flex-col overflow-y-auto bg-white transition-colors dark:bg-slate-900">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-liquid-border px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-white shadow-md">
            <BookOpen className="h-4 w-4" />
          </div>

          <div>
            <p className="font-bold text-liquid-text dark:text-slate-100">TaskPanel</p>
            <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">FATISDA 2026</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-liquid-text-secondary hover:bg-slate-100 hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Context & Profile */}
      <div className="px-4 pt-5">
        <div className="mt-2 rounded-2xl border border-liquid-border/50 bg-liquid-accent/5 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-liquid-accent/20 dark:ring-sky-500/20" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white shadow-sm">{(user?.username ?? "U").charAt(0).toUpperCase()}</div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-liquid-text-secondary dark:text-slate-400">Welcome back,</p>
              <p className="truncate text-sm font-bold text-liquid-text dark:text-slate-100">{user?.username ?? "Mahasiswa"}</p>
            </div>
          </div>

          <p className="mt-2.5 text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{profileLabel || "Profil belum tersinkron"}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {roleLabels.map((role) => (
              <span key={role} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-liquid-accent shadow-xs dark:bg-slate-700 dark:text-sky-300">
                {role}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200/80 bg-white/80 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 hover:text-sky-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-sky-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Menyelaraskan..." : "Sync Discord"}</span>
          </button>

          {syncMessage && <p className="mt-1.5 px-1 text-[10px] leading-4 text-liquid-text-secondary dark:text-slate-400">{syncMessage}</p>}

          {!user?.kelas && (
            <div className="mt-3 rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/30 p-2.5">
              <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">Pilih Kelas Kamu:</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(["A", "B", "C", "D", "E"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={updatingKelas}
                    onClick={() => handleSelectKelas(k)}
                    className="rounded-lg border border-sky-300/80 dark:border-sky-700/80 bg-white dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:text-sky-200 shadow-xs hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition active:scale-95 disabled:opacity-50"
                  >
                    Kls {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 pt-5">
        <p className="label px-2">Menu</p>

        <div className="mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/dashboard/schedule"
                ? pathname === "/dashboard/schedule" || pathname.startsWith("/dashboard/schedule/grand")
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-liquid-accent/10 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-400" : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {(canManageVault || canAccessAnalytics) && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="label">Pengelola</p>
              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">ADMIN</span>
            </div>
            {canManageVault && (
              <Link
                href="/dashboard/vault-cms"
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  pathname.startsWith("/dashboard/vault-cms")
                    ? "bg-liquid-accent/10 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-400"
                    : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <FolderGit2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>Kelola Course Vault</span>
              </Link>
            )}
            {canAccessAnalytics && (
              <Link
                href="/dashboard/analytics"
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "bg-liquid-accent/10 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-400"
                    : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>Analytics &amp; Statistik</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Courses */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between px-2">
          <p className="label">Mata Kuliah</p>
          <span className="text-[10px] font-semibold text-liquid-text-tertiary dark:text-slate-400">{courses.length}</span>
        </div>

        <div className="mt-2 space-y-1">
          {courses.length === 0 ? (
            <p className="px-3 text-xs italic text-liquid-text-secondary dark:text-slate-400">Belum ada data mata kuliah.</p>
          ) : (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-liquid-text-secondary transition hover:bg-slate-50 hover:text-liquid-accent dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-sky-400"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-liquid-text-tertiary transition-colors group-hover:text-liquid-accent dark:text-slate-500 dark:group-hover:text-sky-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-liquid-text transition-colors group-hover:text-liquid-accent dark:text-slate-200 dark:group-hover:text-sky-400">{course.name}</p>
                  <p className="text-[11px] text-liquid-text-secondary dark:text-slate-400">{course.code}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-liquid-border p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            onClose?.();
            setFeedbackOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 shadow-2xs mb-2.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Lapor Bug &amp; Masukan Beta</span>
        </button>

        <SidebarInstallButton />

        <div className="my-2" />

        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
          <Link
            href="/terms"
            onClick={onClose}
            className="hover:text-slate-600 dark:hover:text-slate-300 transition underline underline-offset-2"
          >
            T&amp;C
          </Link>
          <span>•</span>
          <Link
            href="/privacy"
            onClick={onClose}
            className="hover:text-slate-600 dark:hover:text-slate-300 transition underline underline-offset-2"
          >
            Privasi
          </Link>
          <span>•</span>
          <span>v3.0 Beta</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden h-full w-72 shrink-0 border-r border-liquid-border bg-white transition-colors dark:border-slate-800 dark:bg-slate-900 md:block">{sidebarContent}</aside>

      {/* Mobile drawer with subtle slide-in animation & backdrop fade */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-all duration-300 ${mobileOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"}`} role="dialog" aria-modal="true">
        {/* Backdrop overlay */}
        <div className={`fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${mobileOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose} aria-hidden="true" />

        {/* Drawer content */}
        <div className={`relative z-10 h-full w-72 max-w-[85vw] shadow-2xl transform transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebarContent}</div>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, LogOut, MessageSquare, RefreshCw, X } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Course, User } from "@/types";

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
    label: "Jadwal",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/courses",
    label: "Mata Kuliah",
    icon: BookOpen,
  },
  {
    href: "/dashboard/discussions",
    label: "Diskusi",
    icon: MessageSquare,
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

  if (roles.includes("ADMIN")) {
    labels.push("Administrator");
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

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const prodiLabel = getProdiLabel(user?.prodi ?? null);

  const profileLabel = [prodiLabel, user?.kelas ? `Kelas ${user.kelas}` : null].filter(Boolean).join(" · ");

  const roleLabels = getRoleLabels(user);

  async function handleSync() {
    if (!guildId || syncing) {
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage("");

      const response = await fetch(`/api/guilds/${guildId}/sync`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Sinkronisasi gagal.");
      }

      setSyncMessage(`${data.syncedMembers ?? 0} anggota disinkronkan.`);

      window.location.reload();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Sinkronisasi gagal.");
    } finally {
      setSyncing(false);
    }
  }

  const sidebarContent = (
    <div className="flex h-full w-72 flex-col overflow-y-auto bg-white">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-liquid-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-white shadow-md">
            <BookOpen className="h-4 w-4" />
          </div>

          <div>
            <p className="font-bold text-liquid-text">TaskPanel</p>
            <p className="text-[11px] text-liquid-text-secondary">FATISDA 2026</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-liquid-text-secondary hover:bg-slate-100 hover:text-liquid-text md:hidden" aria-label="Tutup menu navigasi">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Context */}
      <div className="px-4 pt-5">
        <div className="mt-2 rounded-2xl bg-liquid-accent/5 px-3 py-3">
          <p className="text-sm font-semibold text-liquid-text">FATISDA 2026</p>

          <p className="mt-1 text-xs text-liquid-text-secondary">{profileLabel || "Profil belum tersinkron"}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {roleLabels.map((role) => (
              <span key={role} className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-liquid-accent shadow-sm">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 pt-5">
        <p className="label px-2">Menu</p>

        <div className="mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-liquid-accent/10 text-liquid-accent" : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Courses */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between px-2">
          <p className="label">Mata Kuliah</p>
          <span className="text-[10px] font-semibold text-liquid-text-tertiary">{courses.length}</span>
        </div>

        <div className="mt-2 space-y-1">
          {courses.length === 0 ? (
            <p className="px-3 text-xs italic text-liquid-text-secondary">Belum ada data mata kuliah.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-liquid-text-secondary">
                <BookOpen className="h-4 w-4 shrink-0 text-liquid-text-tertiary" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-liquid-text">{course.name}</p>
                  <p className="text-[11px] text-liquid-text-secondary">{course.code}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-liquid-border p-4">
        <button
          type="button"
          onClick={handleSync}
          disabled={!guildId || syncing}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-liquid-accent/30 hover:bg-liquid-accent/5 hover:text-liquid-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sinkronisasi..." : "Sync Discord"}
        </button>

        {syncMessage && <p className="mb-3 px-2 text-[11px] leading-4 text-liquid-text-secondary">{syncMessage}</p>}

        {/* User */}
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white">{(user?.username ?? "U").charAt(0).toUpperCase()}</div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-liquid-text">{user?.username ?? "Pengguna"}</p>
            <p className="truncate text-[11px] text-liquid-text-secondary">{roleLabels.join(" · ")}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden h-full w-72 shrink-0 border-r border-liquid-border bg-white md:block">{sidebarContent}</aside>

      {/* Mobile drawer with backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

          {/* Drawer content */}
          <div className="relative z-10 h-full w-72 shadow-2xl transition-transform">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

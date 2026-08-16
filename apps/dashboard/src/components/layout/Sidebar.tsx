"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Course, User } from "@/types";

interface SidebarProps {
  courses: Course[];
  user: User | null;
  guildId: string | null;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard#tasks",
    label: "Tugas",
    icon: ClipboardList,
    exact: false,
  },
  {
    href: "/dashboard/schedule",
    label: "Jadwal",
    icon: CalendarDays,
    exact: false,
  },
  {
    href: "/dashboard/discussions",
    label: "Diskusi",
    icon: MessageSquare,
    exact: false,
  },
] as const;

export function Sidebar({
  courses,
  user,
  guildId,
}: SidebarProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const profileLabel =
    user?.prodi && user?.kelas
      ? `${user.prodi === "INFORMATIKA" ? "Informatika" : "Sains Data"} · Kelas ${user.kelas}`
      : user?.prodi === "INFORMATIKA"
        ? "Informatika"
        : user?.prodi === "SAINS_DATA"
          ? "Sains Data"
          : "Profil belum tersinkron";

  const roleLabel = user?.roles?.includes("ADMIN")
    ? "Administrator"
    : user?.roles?.includes("PJ_KELAS")
      ? "PJ Kelas"
      : user?.roles?.includes("PJ_MATKUL")
        ? "PJ Mata Kuliah"
        : "Mahasiswa";

  async function handleSync() {
    if (!guildId || syncing) return;

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
      setSyncMessage(
        error instanceof Error
          ? error.message
          : "Sinkronisasi gagal."
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-liquid-border bg-white md:flex">
      <div className="border-b border-liquid-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-white shadow-md">
            <BookOpen className="h-4 w-4" />
          </div>

          <div>
            <p className="font-bold text-liquid-text">TaskPanel</p>
            <p className="text-[11px] text-liquid-text-secondary">
              FATISDA 2026
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="label px-2">Konteks</p>

        <div className="mt-2 rounded-2xl bg-liquid-accent/5 px-3 py-3">
          <p className="text-sm font-semibold text-liquid-text">
            FATISDA 2026
          </p>
          <p className="mt-1 text-xs text-liquid-text-secondary">
            {profileLabel}
          </p>
        </div>
      </div>

      <nav className="px-4 pt-5">
        <p className="label px-2">Menu</p>

        <div className="mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.label === "Overview"
                ? pathname === "/dashboard" && hash !== "#tasks"
                : item.label === "Tugas"
                  ? pathname === "/dashboard" && hash === "#tasks"
                  : item.label === "Jadwal"
                    ? pathname.startsWith("/dashboard/schedule")
                    : pathname.startsWith("/dashboard/discussions");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-liquid-accent/10 text-liquid-accent"
                    : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-5">
        <div className="flex items-center justify-between px-2">
          <p className="label">Mata Kuliah</p>
          <span className="text-[10px] font-semibold text-liquid-text-tertiary">
            {courses.length}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {courses.length === 0 ? (
            <p className="px-3 text-xs italic text-liquid-text-secondary">
              Belum ada data mata kuliah.
            </p>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-liquid-text-secondary"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-liquid-text-tertiary" />

                <div className="min-w-0">
                  <p className="truncate font-medium text-liquid-text">
                    {course.name}
                  </p>
                  <p className="text-[11px] text-liquid-text-secondary">
                    {course.code}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-liquid-border p-4">
        <button
          type="button"
          onClick={handleSync}
          disabled={!guildId || syncing}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-liquid-accent/30 hover:bg-liquid-accent/5 hover:text-liquid-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sinkronisasi..." : "Sync Discord"}
        </button>

        {syncMessage && (
          <p className="mb-3 px-2 text-[11px] leading-4 text-liquid-text-secondary">
            {syncMessage}
          </p>
        )}

        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="h-9 w-9 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white">
              {(user?.username ?? "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-liquid-text">
              {user?.username ?? "Pengguna"}
            </p>
            <p className="truncate text-[11px] text-liquid-text-secondary">
              {roleLabel}
            </p>
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
    </aside>
  );
}

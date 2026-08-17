"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";
import { signOut } from "next-auth/react";
import type { User } from "@/types";

interface SidebarProps {
  user: User | null;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard#tasks",
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();

    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, []);

  const prodiLabel = user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : null;

  const profileLabel = prodiLabel ? `${prodiLabel}${user?.kelas ? ` · Kelas ${user.kelas}` : ""}` : "Profil belum tersinkron";

  const roleLabel = user?.roles?.includes("ADMIN") ? "Administrator" : user?.roles?.includes("PJ_KELAS") ? "PJ Kelas" : user?.roles?.includes("PJ_MATKUL") ? "PJ Mata Kuliah" : "Mahasiswa";

  function isNavItemActive(label: string, href: string) {
    switch (label) {
      case "Overview":
        return pathname === "/dashboard" && hash !== "#tasks";

      case "Tugas":
        return pathname === "/dashboard" && hash === "#tasks";

      default:
        return pathname.startsWith(href);
    }
  }

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-liquid-border bg-white md:flex">
      {/* Brand */}
      <div className="border-b border-liquid-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-white shadow-md">
            <BookOpen className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="font-bold text-liquid-text">TaskPanel</p>
            <p className="text-[11px] text-liquid-text-secondary">FATISDA 2026</p>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="px-4 pt-5">
        <p className="label px-2">Workspace</p>

        <div className="mt-2 rounded-2xl bg-liquid-accent/5 px-3 py-3">
          <p className="text-sm font-semibold text-liquid-text">FATISDA 2026</p>

          <p className="mt-1 truncate text-xs text-liquid-text-secondary">{profileLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 pt-5">
        <p className="label px-2">Akademik</p>

        <div className="mt-2 space-y-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.label, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-liquid-accent/10 text-liquid-accent" : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Other */}
      <nav className="px-4 pt-5">
        <p className="label px-2">Lainnya</p>

        <div className="mt-2 space-y-1">
          {navItems.slice(4).map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.label, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-liquid-accent/10 text-liquid-accent" : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="mt-auto border-t border-liquid-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white">{(user?.username ?? "U").charAt(0).toUpperCase()}</div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-liquid-text">{user?.username ?? "Pengguna"}</p>

            <p className="truncate text-[11px] text-liquid-text-secondary">{roleLabel}</p>
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

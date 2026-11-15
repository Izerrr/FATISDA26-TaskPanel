"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, Users } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
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
    label: "Matkul",
    icon: BookOpen,
  },
  {
    href: "/dashboard/class",
    label: "Kelas",
    icon: Users,
  },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-liquid-border bg-white/95 px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                active ? "text-liquid-accent dark:text-sky-400" : "text-liquid-text-secondary dark:text-slate-400"
              }`}
            >
              <div className={`flex h-7 w-9 items-center justify-center rounded-xl transition ${active ? "bg-liquid-accent/10 dark:bg-sky-500/20" : "bg-transparent"}`}>
                <Icon className="h-[17px] w-[17px]" />
              </div>

              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
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
    label: "Matkul & Vault",
    icon: BookOpen,
  },
] as const;

export function MobileNav() {
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

  function isActive(label: string, href: string) {
    if (label === "Home") {
      return pathname === "/dashboard" && hash !== "#tasks";
    }

    if (label === "Tugas") {
      return pathname === "/dashboard" && hash === "#tasks";
    }

    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-liquid-border bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.label, item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition ${active ? "text-liquid-accent" : "text-liquid-text-secondary"}`}
            >
              <div className={`flex h-8 w-10 items-center justify-center rounded-xl transition ${active ? "bg-liquid-accent/10" : "bg-transparent"}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

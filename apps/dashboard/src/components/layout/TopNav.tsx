"use client";

import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ProfileMenu } from "./ProfileMenu";

interface TopNavProps {
  onToggleMobileMenu?: () => void;
  onNewTask?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function TopNav({ onToggleMobileMenu, onNewTask, search, onSearchChange }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white/90 px-4 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 md:px-6">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-liquid-text-secondary transition hover:bg-black/[0.04] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-liquid-text-tertiary dark:text-slate-400">FATISDA 2026</p>
          <h1 className="text-sm font-bold text-liquid-text dark:text-slate-100">Task & Schedule Workspace</h1>
        </div>

        <div className="md:hidden">
          <span className="text-sm font-bold text-liquid-text dark:text-slate-100">TaskPanel</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2 transition-colors dark:bg-slate-800/60 sm:flex">
          <Search className="h-4 w-4 text-liquid-text-tertiary dark:text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari tugas..."
            className="w-40 bg-transparent text-sm text-liquid-text outline-none placeholder:text-liquid-text-tertiary dark:text-slate-100 dark:placeholder:text-slate-500 lg:w-56"
          />
        </div>

        {onNewTask && (
          <button type="button" onClick={onNewTask} className="flex items-center gap-2 rounded-xl bg-liquid-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 md:px-4 md:py-2.5 md:text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tugas Baru</span>
          </button>
        )}

        {/* Animated Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.03] text-liquid-text-secondary transition-all duration-300 hover:bg-black/[0.06] hover:text-liquid-text active:scale-90 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300 overflow-hidden"
          aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        >
          <div className="relative h-5 w-5">
            <Sun className={`absolute inset-0 h-5 w-5 text-amber-400 transition-all duration-500 ease-out transform ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
            <Moon className={`absolute inset-0 h-5 w-5 text-slate-600 transition-all duration-500 ease-out transform ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
          </div>
        </button>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-liquid-text-secondary transition hover:bg-black/[0.04] hover:text-liquid-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <ProfileMenu />
      </div>
    </header>
  );
}

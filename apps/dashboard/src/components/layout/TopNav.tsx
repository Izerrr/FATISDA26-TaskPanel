"use client";

import { Bell, Menu, Plus, Search } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

interface TopNavProps {
  onToggleMobileMenu?: () => void;
  onNewTask?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function TopNav({ onToggleMobileMenu, onNewTask, search, onSearchChange }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white/90 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-liquid-text-secondary transition hover:bg-black/[0.04] hover:text-liquid-text md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-liquid-text-tertiary">FATISDA 2026</p>
          <h1 className="text-sm font-bold text-liquid-text">Task & Schedule Workspace</h1>
        </div>

        <div className="md:hidden">
          <span className="text-sm font-bold text-liquid-text">TaskPanel</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2 sm:flex">
          <Search className="h-4 w-4 text-liquid-text-tertiary" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari tugas..."
            className="w-40 bg-transparent text-sm text-liquid-text outline-none placeholder:text-liquid-text-tertiary lg:w-56"
          />
        </div>

        {onNewTask && (
          <button
            type="button"
            onClick={onNewTask}
            className="flex items-center gap-2 rounded-xl bg-liquid-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 md:px-4 md:py-2.5 md:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tugas Baru</span>
          </button>
        )}

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-liquid-text-secondary transition hover:bg-black/[0.04] hover:text-liquid-text"
          aria-label="Notifikasi"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <ProfileMenu />
      </div>
    </header>
  );
}

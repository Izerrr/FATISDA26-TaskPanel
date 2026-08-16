"use client";

import { Bell, Plus, Search } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

interface TopNavProps {
  onNewTask: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function TopNav({ onNewTask, search, onSearchChange }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center border-b border-liquid-border bg-white/80 px-4 backdrop-blur-xl md:px-6">
      <div className="hidden md:block">
        <h1 className="text-sm font-bold text-liquid-text">Panel Tugas</h1>

        <p className="text-[11px] text-liquid-text-secondary">FATISDA 2026</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-liquid-text-tertiary" />

          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari tugas..." className="w-48 bg-transparent text-sm text-liquid-text outline-none placeholder:text-liquid-text-tertiary" />
        </div>

        <button onClick={onNewTask} className="flex items-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tugas Baru</span>
        </button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-liquid-text-secondary hover:bg-black/[0.04]" aria-label="Notifikasi">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <ProfileMenu />
      </div>
    </header>
  );
}

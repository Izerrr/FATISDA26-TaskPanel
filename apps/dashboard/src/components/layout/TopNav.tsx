"use client";

import { Search, Bell, Plus } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { useState } from "react";

const TABS = ["Tugas", "Papan", "Anggota"];

export function TopNav({ onNewTask }: { onNewTask: () => void }) {
  const [activeTab, setActiveTab] = useState("Tugas");

  return (
    <nav className="flex h-16 items-center border-b border-black/[0.04] bg-white/40 px-6 backdrop-blur-xl">
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              rounded-xl px-4 py-2 text-[13px] font-medium transition-all
              ${activeTab === tab
                ? "bg-liquid-accent/10 text-liquid-accent"
                : "text-liquid-text-secondary hover:bg-black/[0.03] hover:text-liquid-text"}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl bg-black/[0.03] px-3.5 py-2 md:flex">
          <Search className="h-4 w-4 text-liquid-text-tertiary" />
          <input
            type="text"
            placeholder="Cari tugas..."
            className="w-44 bg-transparent text-[13px] text-liquid-text placeholder:text-liquid-text-tertiary outline-none"
          />
        </div>

        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 rounded-2xl bg-liquid-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-liquid-accent/20 transition-all hover:bg-liquid-accent/90 hover:shadow-lg active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tugas Baru</span>
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-liquid-text-secondary transition-colors hover:bg-black/[0.04]">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-liquid-pink ring-2 ring-white" />
        </button>

        <ProfileMenu />
      </div>
    </nav>
  );
}

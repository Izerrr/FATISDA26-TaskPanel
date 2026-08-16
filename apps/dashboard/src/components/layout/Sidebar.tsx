"use client";

import { useGuild } from "@/components/providers/GuildProvider";
import { useGuilds } from "@/hooks/useGuilds";
import { Settings, LogOut, LayoutGrid } from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const { selectedGuild, setSelectedGuild } = useGuild();
  const { guilds, isLoading } = useGuilds();

  return (
    <aside className="flex w-[72px] flex-col items-center gap-3 border-r border-black/[0.04] bg-white/40 py-5 backdrop-blur-xl">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-liquid-accent text-white shadow-md shadow-liquid-accent/20">
        <LayoutGrid className="h-5 w-5" />
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-2 px-2">
        {isLoading ? (
          <div className="h-10 w-10 animate-pulse rounded-xl bg-black/5" />
        ) : (
          guilds.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGuild(g.id)}
              title={g.name}
              className={`
                group relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all
                ${selectedGuild === g.id
                  ? "bg-liquid-accent text-white shadow-md shadow-liquid-accent/20"
                  : "bg-black/[0.04] text-liquid-text-secondary hover:bg-black/[0.08] hover:text-liquid-text"}
              `}
            >
              {g.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                  alt={g.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                g.name.slice(0, 2).toUpperCase()
              )}
              {selectedGuild === g.id && (
                <span className="absolute -right-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-liquid-accent" />
              )}
            </button>
          ))
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-black/[0.04] px-2 pt-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-liquid-text-tertiary transition-colors hover:bg-black/[0.04] hover:text-liquid-text-secondary">
          <Settings className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-liquid-text-tertiary transition-colors hover:bg-liquid-danger-soft hover:text-liquid-danger"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  );
}

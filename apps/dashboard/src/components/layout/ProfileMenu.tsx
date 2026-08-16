"use client";

import { useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-2xl p-1 transition-colors hover:bg-black/[0.04]"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || ""}
            className="h-8 w-8 rounded-xl object-cover ring-1 ring-black/[0.06]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-liquid-accent text-[11px] font-bold text-white">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/90 shadow-glass-lg backdrop-blur-xl">
          <div className="px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-liquid-text">{session.user.name}</p>
            <p className="truncate text-[11px] text-liquid-text-secondary">{session.user.email || "Discord"}</p>
          </div>
          <div className="border-t border-black/[0.04] px-2 py-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-liquid-danger transition-colors hover:bg-liquid-danger-soft"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

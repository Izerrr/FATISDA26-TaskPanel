"use client";

import { LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function ProfileMenu() {
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-black/[0.04]">
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name ?? "User"} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white">{(session.user.name ?? "U").charAt(0).toUpperCase()}</div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-glass-lg">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-liquid-text-secondary" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-liquid-text">{session.user.name}</p>

                <p className="truncate text-xs text-liquid-text-secondary">Discord</p>
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.05] p-2">
            <button
              onClick={() =>
                signOut({
                  callbackUrl: "/login",
                })
              }
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
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

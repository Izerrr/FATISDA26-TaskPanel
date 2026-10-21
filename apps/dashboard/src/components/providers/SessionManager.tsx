"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { Preloader } from "@/components/ui/Preloader";

const PERIODIC_SYNC_INTERVAL_MS = 20 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = "fatisda_last_activity_ts";
const THROTTLE_WRITE_MS = 30 * 1000;

interface SessionManagerContextValue {
  triggerSync: (customMessage?: string, showOverlay?: boolean) => Promise<void>;
  isPreloaderActive: boolean;
}

const SessionManagerContext = createContext<SessionManagerContextValue>({
  triggerSync: async () => {},
  isPreloaderActive: false,
});

export function SessionManager({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const { mutate } = useSWRConfig();

  const [preloaderVisible, setPreloaderVisible] = useState(false);
  const [preloaderMessage, setPreloaderMessage] = useState("Menyelaraskan Sesi...");
  const lastWriteRef = useRef<number>(0);

  function recordActivity() {
    const now = Date.now();
    if (now - lastWriteRef.current > THROTTLE_WRITE_MS) {
      lastWriteRef.current = now;
      try {
        window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      } catch (_) {}
    }
  }

  async function triggerSync(customMessage = "Menyelaraskan Sesi...", showOverlay = true) {
    if (status !== "authenticated") return;

    if (showOverlay) {
      setPreloaderMessage(customMessage);
      setPreloaderVisible(true);
    }

    try {
      await Promise.allSettled([
        fetch("/api/me", { cache: "no-store" }).catch(() => null),
        mutate(
          (key) =>
            typeof key === "string" &&
            key.startsWith("/api/") &&
            !key.startsWith("/api/auth"),
        ),
      ]);
    } catch (e) {
      console.warn("[SessionManager] Sync warning:", e);
    } finally {
      if (showOverlay) {
        setTimeout(() => {
          setPreloaderVisible(false);
        }, 650);
      }
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    recordActivity();

    const events = ["mousedown", "keydown", "scroll", "touchstart", "pointerdown"];
    const handleUserInteraction = () => {
      recordActivity();
    };

    // Safely absorb OS-level gesture interruptions (e.g., 3-finger screenshot on Android)
    const handleGestureCancel = () => {
      recordActivity();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });
    window.addEventListener("touchcancel", handleGestureCancel, { passive: true });
    window.addEventListener("pointercancel", handleGestureCancel, { passive: true });

    const periodicSyncInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void triggerSync("Sinkronisasi Sesi Berkala...", false);
      }
    }, PERIODIC_SYNC_INTERVAL_MS);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      window.removeEventListener("touchcancel", handleGestureCancel);
      window.removeEventListener("pointercancel", handleGestureCancel);
      clearInterval(periodicSyncInterval);
    };
  }, [status]);

  return (
    <SessionManagerContext.Provider
      value={{
        triggerSync,
        isPreloaderActive: preloaderVisible,
      }}
    >
      {children}
      <Preloader visible={preloaderVisible} message={preloaderMessage} />
    </SessionManagerContext.Provider>
  );
}

export function useSessionManager() {
  return useContext(SessionManagerContext);
}

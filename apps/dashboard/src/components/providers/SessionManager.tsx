"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { Preloader } from "@/components/ui/Preloader";

// 20 Menit Sinkronisasi Sesi Berkala
const PERIODIC_SYNC_INTERVAL_MS = 20 * 60 * 1000;

// 24 Jam Batas Waktu Tanpa Aktivitas (Daily Inactivity Reset)
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_STORAGE_KEY = "fatisda_last_activity_ts";
const THROTTLE_WRITE_MS = 30 * 1000; // Simpan ke localStorage maksimal setiap 30 detik

interface SessionManagerContextValue {
  triggerSync: (customMessage?: string) => Promise<void>;
  isPreloaderActive: boolean;
}

const SessionManagerContext = createContext<SessionManagerContextValue>({
  triggerSync: async () => {},
  isPreloaderActive: false,
});

export function SessionManager({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { mutate } = useSWRConfig();

  const [preloaderVisible, setPreloaderVisible] = useState(false);
  const [preloaderMessage, setPreloaderMessage] = useState("Menyelaraskan Sesi...");
  const lastWriteRef = useRef<number>(0);

  // Perbarui timestamp aktivitas user
  function recordActivity() {
    const now = Date.now();
    if (now - lastWriteRef.current > THROTTLE_WRITE_MS) {
      lastWriteRef.current = now;
      try {
        window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      } catch (_) {}
    }
  }

  // Fungsi sinkronisasi dengan preloader subtle
  async function triggerSync(customMessage = "Menyelaraskan Sesi...") {
    if (status !== "authenticated") return;

    setPreloaderMessage(customMessage);
    setPreloaderVisible(true);

    try {
      // Revalidasi endpoint profil user dan seluruh cache SWR
      await Promise.allSettled([fetch("/api/me", { cache: "no-store" }), mutate((key) => typeof key === "string" && key.startsWith("/api/"))]);
    } catch (e) {
      console.warn("[SessionManager] Sync error:", e);
    } finally {
      // Biarkan preloader terlihat sebentar (~1000ms) agar animasinya terasa subtle dan smooth
      setTimeout(() => {
        setPreloaderVisible(false);
      }, 1000);
    }
  }

  // Cek apakah user telah melewati 24 jam tanpa aktivitas
  function checkInactivity() {
    if (status !== "authenticated") return;

    try {
      const stored = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (!stored) {
        // Inisialisasi jika belum ada
        window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
        return;
      }

      const lastActive = parseInt(stored, 10);
      const elapsed = Date.now() - lastActive;

      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        console.warn("[SessionManager] 24 jam tanpa aktivitas terdeteksi. Logout otomatis...");
        window.localStorage.removeItem(ACTIVITY_STORAGE_KEY);
        void signOut({ callbackUrl: "/login?expired=inactivity" });
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    // Catat aktivitas saat pertama kali mount
    recordActivity();
    checkInactivity();

    // Event listeners untuk deteksi interaksi user
    const events = ["mousedown", "keydown", "scroll", "touchstart", "pointerdown"];
    const handleUserInteraction = () => {
      recordActivity();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Pengecekan saat tab aktif kembali (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Interval cek inactivity setiap 1 menit
    const inactivityInterval = setInterval(() => {
      checkInactivity();
    }, 60 * 1000);

    // Interval sync 20 menit berkala dengan subtle preloader
    const periodicSyncInterval = setInterval(() => {
      void triggerSync("Sinkronisasi Sesi Berkala...");
    }, PERIODIC_SYNC_INTERVAL_MS);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(inactivityInterval);
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

"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // 1. Never show on desktop web browser!
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768 && /iphone|ipad|ipod|android/i.test(window.navigator.userAgent);

    setIsMobile(isMobileDevice);
    if (!isMobileDevice) {
      setDismissed(true);
      return;
    }

    // 2. Check if running in standalone PWA mode
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 3. Check permanent dismissal
    const isPermanentlyDismissed = localStorage.getItem("fatisda_pwa_permanently_dismissed") === "true";
    if (isPermanentlyDismissed) {
      setDismissed(true);
      return;
    }

    // 4. Detect iOS Safari on mobile
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleMobile);

    // If mobile and not dismissed, show
    setDismissed(false);

    // 5. Capture beforeinstallprompt event (Android Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    // Permanently remember dismissal so it never annoys the user again
    localStorage.setItem("fatisda_pwa_permanently_dismissed", "true");
  }

  // Do NOT render on desktop, or if already standalone, or if dismissed
  if (!isMobile || isStandalone || dismissed) {
    return null;
  }

  // Only show if prompt is captured OR if on mobile iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Strictly Mobile-Only Floating Install Banner (Hidden on desktop md:) */}
      <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 md:hidden">
        <div className="flex items-center gap-3.5 rounded-2xl border border-sky-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-xl ring-1 ring-black/5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Pasang Aplikasi TaskPanel</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Akses cepat langsung dari layar utama HP</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={handleInstall} className="flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-95">
              <Download className="h-3.5 w-3.5" />
              <span>Pasang</span>
            </button>

            <button type="button" onClick={handleDismiss} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition" aria-label="Tutup rekomendasi instalasi">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Manual Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pasang di iPhone / iPad</h3>
              </div>
              <button type="button" onClick={() => setShowIOSModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 font-bold text-sky-700 dark:text-sky-300 text-[11px]">1</span>
                <p>
                  Ketuk tombol <strong>Bagikan / Share</strong> (ikon ⎋) di bilah bawah browser Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 font-bold text-sky-700 dark:text-sky-300 text-[11px]">2</span>
                <p>
                  Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-sky-600 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-90"
            >
              Mengerti & Jangan Tampilkan Lagi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SidebarInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      alert("Untuk memasang aplikasi:\n• Chrome/Edge: Klik ikon Pasang (Install) di bilah alamat browser.\n• Safari iPhone: Ketuk Bagikan -> Tambahkan ke Layar Utama.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 transition hover:bg-sky-100/80 dark:hover:bg-sky-900/60"
    >
      <Smartphone className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <span>Pasang Aplikasi (PWA)</span>
    </button>
  );
}

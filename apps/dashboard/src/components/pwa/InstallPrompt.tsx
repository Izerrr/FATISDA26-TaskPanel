"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, MonitorSmartphone, Share2, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let listenersInitialized = false;
let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let sharedIsStandalone = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((listener) => listener());
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function ensureInstallListeners() {
  if (listenersInitialized || typeof window === "undefined") return;
  listenersInitialized = true;

  sharedIsStandalone = checkIsStandalone();

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    notifySubscribers();
  });

  window.addEventListener("appinstalled", () => {
    sharedIsStandalone = true;
    sharedDeferredPrompt = null;
    notifySubscribers();
  });
}

function useSharedInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    ensureInstallListeners();
    setMounted(true);

    const syncState = () => {
      setDeferredPrompt(sharedDeferredPrompt);
      setIsStandalone(sharedIsStandalone || checkIsStandalone());
    };

    syncState();
    subscribers.add(syncState);
    return () => {
      subscribers.delete(syncState);
    };
  }, []);

  async function triggerNativePrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!sharedDeferredPrompt) return "unavailable";
    const promptEvent = sharedDeferredPrompt;
    sharedDeferredPrompt = null;
    notifySubscribers();

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      sharedIsStandalone = true;
      notifySubscribers();
    }
    return choice.outcome;
  }

  return { mounted, deferredPrompt, isStandalone, triggerNativePrompt };
}

interface InstallInstructionsModalProps {
  open: boolean;
  mode: "ios" | "manual";
  onClose: () => void;
  onAcknowledge?: () => void;
}

function InstallInstructionsModal({
  open,
  mode,
  onClose,
  onAcknowledge,
}: InstallInstructionsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-instructions-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {mode === "ios" ? (
              <Share2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            ) : (
              <MonitorSmartphone className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            )}
            <h3
              id="pwa-install-instructions-title"
              className="text-sm font-bold text-slate-800 dark:text-slate-100"
            >
              {mode === "ios" ? "Pasang di iPhone / iPad" : "Cara Pasang TaskPanel"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup panduan instalasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode === "ios" ? (
          <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                1
              </span>
              <p>
                Ketuk tombol <strong>Bagikan / Share</strong> (ikon ⎋) di bilah bawah browser Safari.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                2
              </span>
              <p>
                Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Chrome / Edge</p>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                Klik ikon <strong>Pasang (Install)</strong> di sisi kanan bilah alamat browser, atau buka menu browser lalu pilih{" "}
                <strong>Tambahkan ke Layar Utama</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Safari iPhone / iPad</p>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                Ketuk tombol <strong>Bagikan / Share</strong> (ikon ⎋), lalu pilih{" "}
                <strong>Tambahkan ke Layar Utama</strong>.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onAcknowledge?.();
          }}
          className="mt-5 w-full rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          {mode === "ios" ? "Mengerti & Jangan Tampilkan Lagi" : "Mengerti"}
        </button>
      </div>
    </div>,
    document.body
  );
}

export function InstallPrompt() {
  const { mounted, deferredPrompt, isStandalone, triggerNativePrompt } = useSharedInstallPrompt();
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isMobileDevice =
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      /iphone|ipad|ipod|android/i.test(window.navigator.userAgent);

    setIsMobile(isMobileDevice);
    if (!isMobileDevice) {
      setDismissed(true);
      return;
    }

    if (checkIsStandalone()) return;

    try {
      if (localStorage.getItem("fatisda_pwa_permanently_dismissed") === "true") {
        setDismissed(true);
        return;
      }
    } catch {
      // Ignore storage read restrictions
    }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setDismissed(false);
  }, []);

  async function handleInstall() {
    const outcome = await triggerNativePrompt();
    if (outcome === "unavailable" && isIOS) {
      setShowIOSModal(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("fatisda_pwa_permanently_dismissed", "true");
    } catch {
      // Ignore storage write restrictions
    }
  }

  if (!mounted || !isMobile || isStandalone || dismissed) {
    return null;
  }

  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Strictly Mobile-Only Floating Install Banner (Hidden on desktop md:) */}
      <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 md:hidden">
        <div className="flex items-center gap-3.5 rounded-2xl border border-sky-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Pasang Aplikasi TaskPanel</p>
            <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
              Akses cepat langsung dari layar utama HP
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstall}
              className="flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Pasang</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Tutup rekomendasi instalasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <InstallInstructionsModal
        open={showIOSModal}
        mode="ios"
        onClose={() => setShowIOSModal(false)}
        onAcknowledge={handleDismiss}
      />
    </>
  );
}

export function SidebarInstallButton() {
  const { mounted, isStandalone, triggerNativePrompt } = useSharedInstallPrompt();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  if (!mounted || isStandalone) return null;

  async function handleInstall() {
    const outcome = await triggerNativePrompt();
    if (outcome === "unavailable") {
      setShowInstructionsModal(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/70 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100/80 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60"
      >
        <Smartphone className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
        <span>Pasang Aplikasi (PWA)</span>
      </button>

      <InstallInstructionsModal
        open={showInstructionsModal}
        mode="manual"
        onClose={() => setShowInstructionsModal(false)}
      />
    </>
  );
}

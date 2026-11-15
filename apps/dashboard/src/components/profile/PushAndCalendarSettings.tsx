"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { BellOff, BellRing, Loader2, ShieldAlert } from "lucide-react";
import { LiveCalendarFeedCard } from "@/components/schedule/LiveCalendarFeedCard";

interface PushStatusResponse {
  configured: boolean;
  publicKey: string | null;
  subscriptionCount: number;
}

const fetcher = async (url: string): Promise<PushStatusResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal memeriksa status push");
  return res.json();
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushAndCalendarSettings() {
  const { data, isLoading, mutate } = useSWR<PushStatusResponse>("/api/push/subscribe", fetcher, {
    revalidateOnFocus: false,
  });

  const [supported, setSupported] = useState(false);
  const [browserSub, setBrowserSub] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSupported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setBrowserSub(sub))
      .catch(() => {});
  }, []);

  async function handleEnablePush() {
    if (!supported || !data?.configured || !data.publicKey || busy) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setStatusMsg({
          type: "err",
          text: "Izin notifikasi ditolak browser. Aktifkan izin notifikasi di pengaturan situs browser.",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      }

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: "err", text: payload.error || "Gagal mengaktifkan Web Push." });
        return;
      }

      setBrowserSub(subscription);
      setStatusMsg({ type: "ok", text: "Notifikasi Push aktif di perangkat ini." });
      await mutate();
    } catch (err) {
      console.error("[PushSubscribe]", err);
      setStatusMsg({ type: "err", text: "Tidak dapat mendaftarkan layanan push di browser ini." });
    } finally {
      setBusy(false);
    }
  }

  async function handleDisablePush() {
    if (busy) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const endpoint = browserSub?.endpoint;
      if (browserSub) {
        await browserSub.unsubscribe().catch(() => {});
      }
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint ? { endpoint } : {}),
      });
      setBrowserSub(null);
      setStatusMsg({ type: "ok", text: "Notifikasi Push perangkat ini dinonaktifkan." });
      await mutate();
    } catch {
      setStatusMsg({ type: "err", text: "Gagal menonaktifkan notifikasi push." });
    } finally {
      setBusy(false);
    }
  }

  const isSubscribedHere = Boolean(browserSub);

  return (
    <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-liquid-text dark:text-slate-100">
          Sinkronisasi &amp; Notifikasi
        </h2>
        <p className="mt-0.5 text-xs text-liquid-text-secondary dark:text-slate-400">
          Terima pengingat langsung di perangkat (PWA) dan sinkronkan jadwal ke kalender eksternal.
        </p>
      </div>

      {/* Web Push PWA Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isSubscribedHere
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {isSubscribedHere ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Notifikasi Push Browser (PWA)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {!supported
                  ? "Browser atau mode saat ini belum mendukung Web Push API."
                  : isLoading
                    ? "Memeriksa status layanan push..."
                    : !data?.configured
                      ? "Web Push memerlukan VAPID key di server agar dapat mengirimkan notifikasi latar belakang."
                      : isSubscribedHere
                        ? `Aktif di perangkat ini (${data.subscriptionCount} perangkat terdaftar).`
                        : "Dapatkan peringatan real-time saat diajak tugas kelompok, di-@mention, atau mendapat balasan diskusi."}
              </p>
            </div>
          </div>

          {supported && !isLoading && data?.configured && (
            <div className="shrink-0">
              {isSubscribedHere ? (
                <button
                  type="button"
                  onClick={() => void handleDisablePush()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Nonaktifkan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleEnablePush()}
                  disabled={busy || permission === "denied"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95 transition disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {permission === "denied" ? "Izin Diblokir" : "Aktifkan Push"}
                </button>
              )}
            </div>
          )}
        </div>

        {!isLoading && data && !data.configured && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>Notifikasi in-app (ikon lonceng di atas) tetap aktif penuh tanpa VAPID key.</span>
          </div>
        )}

        {statusMsg && (
          <p
            className={`mt-2 text-[11px] font-medium ${
              statusMsg.type === "ok"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {statusMsg.text}
          </p>
        )}
      </div>

      {/* Live Calendar Feed */}
      <LiveCalendarFeedCard compact />
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Calendar, Check, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { useAgamaPreference } from "@/hooks/useAgamaPreference";

interface CalendarTokenResponse {
  token: string | null;
  feedPath: string | null;
  tableMissing?: boolean;
  error?: string;
}

const fetcher = async (url: string): Promise<CalendarTokenResponse> => {
  const res = await fetch(url);
  return res.json();
};

export function LiveCalendarFeedCard({ compact = false }: { compact?: boolean }) {
  const [selectedAgama] = useAgamaPreference();
  const { data, isLoading, mutate } = useSWR<CalendarTokenResponse>("/api/calendar/token", fetcher, {
    revalidateOnFocus: false,
  });

  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const feedUrl = data?.feedPath
    ? `${origin}${data.feedPath}${selectedAgama ? `&agama=${encodeURIComponent(selectedAgama)}` : ""}`
    : "";

  async function handleCopyUrl() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg("Browser memblokir salin otomatis. Salin URL langsung dari kotak di atas.");
    }
  }

  async function handleRegenerateToken() {
    setRotating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/calendar/token", { method: "POST" });
      const payload = (await res.json()) as CalendarTokenResponse;
      if (!res.ok) {
        setErrorMsg(payload.error || "Gagal memperbarui token feed");
        return;
      }
      await mutate(payload, { revalidate: false });
    } catch {
      setErrorMsg("Terjadi kesalahan saat memperbarui token kalender.");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Langganan Kalender Live (Auto-Sync URL)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Sekali tempel ke Google Calendar atau Apple Calendar, jadwal kuliah, deadline tugas, dan ujian otomatis sinkron.
            </p>
          </div>
        </div>
      </div>

      {data?.tableMissing ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Feed kalender live siap digunakan setelah skema database terbaru dijalankan (`pnpm db:push`).</span>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={isLoading ? "Membuat URL kalender live..." : feedUrl || "URL belum tersedia"}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="URL Langganan Kalender Live ICS"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[11px] font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              disabled={!feedUrl}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Tersalin" : "Salin URL"}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleRegenerateToken()}
              disabled={rotating || isLoading}
              title="Buat token URL baru (link lama akan nonaktif)"
              aria-label="Reset token URL kalender"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
            </button>
          </div>

          {errorMsg && <p className="mt-1.5 text-[11px] text-rose-500">{errorMsg}</p>}

          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Google Calendar: buka menu <span className="font-semibold">Other calendars (+)</span> &rarr;{" "}
            <span className="font-semibold">From URL</span>. Apple Calendar: <span className="font-semibold">File</span> &rarr;{" "}
            <span className="font-semibold">New Calendar Subscription</span>.
          </p>
        </>
      )}
    </div>
  );
}

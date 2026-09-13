"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, Loader2, Send, ShieldCheck, X } from "lucide-react";
import type { Prodi } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser?: {
    username?: string | null;
    prodi?: string | null;
    kelas?: string | null;
  } | null;
}

const PRODI_LIST: { value: Prodi; label: string }[] = [
  { value: "INFORMATIKA", label: "Informatika" },
  { value: "SAINS_DATA", label: "Sains Data" },
  { value: "INFORMATIKA_PSDKU_KEBUMEN", label: "Informatika PSDKU Kebumen" },
];

const KELAS_LIST = ["A", "B", "C", "D", "E"] as const;

interface DiagnosticsResponse {
  success: boolean;
  error?: string;
  diagnostics?: {
    targetProdi: string;
    targetKelas: string;
    deliveryMethod: "BOT_REST_API" | "WEBHOOK" | "NONE";
    httpStatus?: number;
    channel: {
      configured: boolean;
      maskedId: string | null;
      viaBot: boolean;
    };
    webhook: {
      configured: boolean;
      maskedUrl: string | null;
    };
    roleMention: {
      included: boolean;
      configured: boolean;
      maskedRoleId: string | null;
      envSource: string;
    };
    testedBy: string;
    timestamp: string;
  };
}

export function TaskNotificationTestModal({ open, onClose, currentUser }: Props) {
  const [prodi, setProdi] = useState<Prodi>((currentUser?.prodi as Prodi) || "INFORMATIKA");
  const [kelas, setKelas] = useState<string>(currentUser?.kelas || "A");
  const [title, setTitle] = useState("Simulasi Pengujian Notifikasi Tugas");
  const [description, setDescription] = useState("Ini adalah pesan pengujian dari Admin Testing Environment untuk memastikan routing notifikasi Discord dan mention role berjalan dengan sempurna.");
  const [includePing, setIncludePing] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticsResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setClientError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tasks/test-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodi,
          kelas,
          title: title.trim(),
          description: description.trim(),
          includePing,
        }),
      });

      const data: DiagnosticsResponse = await response.json();
      setResult(data);

      if (!response.ok && !data.error) {
        setClientError("Terjadi kesalahan server saat mengirim notifikasi.");
      }
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Gagal terhubung ke API pengujian");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-float">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-liquid-text dark:text-slate-100">Admin Testing Environment</h2>
                <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">Simulasi</span>
              </div>
              <p className="mt-0.5 text-xs text-liquid-text-secondary dark:text-slate-400">Uji coba perutean notifikasi Discord & mention role tanpa membuat entri di database.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="test-notify-form" onSubmit={handleSendTest} className="space-y-4">
            {/* Target Program Studi */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-liquid-text dark:text-slate-200">Target Program Studi</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PRODI_LIST.map((item) => {
                  const isSelected = prodi === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProdi(item.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                        isSelected
                          ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Kelas */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-liquid-text dark:text-slate-200">Target Kelas</label>
              <div className="flex flex-wrap gap-2">
                {KELAS_LIST.map((k) => {
                  const isSelected = kelas === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKelas(k)}
                      className={`h-9 w-12 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? "bg-violet-600 text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Judul & Pesan Simulasi */}
            <div>
              <label htmlFor="test-title" className="mb-1.5 block text-xs font-semibold text-liquid-text dark:text-slate-200">
                Judul Notifikasi
              </label>
              <input
                id="test-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800/90"
              />
            </div>

            <div>
              <label htmlFor="test-desc" className="mb-1.5 block text-xs font-semibold text-liquid-text dark:text-slate-200">
                Deskripsi / Pesan Pengujian
              </label>
              <textarea
                id="test-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800/90"
              />
            </div>

            {/* Role Mention Toggle */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={includePing} onChange={(e) => setIncludePing(e.target.checked)} className="mt-0.5 h-4 w-4 rounded text-violet-600 focus:ring-violet-500" />
                <div className="text-xs">
                  <span className="font-semibold text-liquid-text dark:text-slate-200">Mention / Ping Role Discord Kelas</span>
                  <p className="mt-0.5 text-liquid-text-secondary dark:text-slate-400">Jika dicentang, pengujian akan mencoba men-tag role spesifik kelas tersebut (misal role Kelas {kelas}) di Discord.</p>
                </div>
              </label>
            </div>
          </form>

          {/* Client Error Display */}
          {clientError && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Terjadi Kesalahan</p>
                <p className="mt-0.5">{clientError}</p>
              </div>
            </div>
          )}

          {/* Diagnostic Result */}
          {result && (
            <div
              className={`rounded-2xl border p-4 text-xs ${result.success ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/40 text-red-900 dark:text-red-200"}`}
            >
              <div className="flex items-center gap-2 font-bold">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-800 dark:text-emerald-300">Pengiriman Notifikasi Berhasil!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-300">Pengiriman Notifikasi Gagal</span>
                  </>
                )}
              </div>

              {result.error && <div className="mt-2 rounded-xl bg-red-100/70 dark:bg-red-900/50 p-2.5 font-mono text-[11px] text-red-800 dark:text-red-200 break-words">{result.error}</div>}

              {result.diagnostics && (
                <div className="mt-3 space-y-2 border-t border-slate-200/60 dark:border-slate-700 pt-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Target</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {result.diagnostics.targetProdi.replace(/_/g, " ")} ({result.diagnostics.targetKelas})
                      </span>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Metode</span>
                      <span
                        className={`inline-block font-mono text-[11px] font-bold ${
                          result.diagnostics.deliveryMethod === "BOT_REST_API"
                            ? "text-blue-600 dark:text-blue-400"
                            : result.diagnostics.deliveryMethod === "WEBHOOK"
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {result.diagnostics.deliveryMethod}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Channel ID</span>
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{result.diagnostics.channel.maskedId ?? "Tidak diset"}</span>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Webhook URL</span>
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block">{result.diagnostics.webhook.maskedUrl ?? "Tidak diset"}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-slate-800 p-2.5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Role Mention: </span>
                      {result.diagnostics.roleMention.included ? (
                        result.diagnostics.roleMention.configured ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            ID: <code className="font-mono text-slate-800 dark:text-slate-200">{result.diagnostics.roleMention.maskedRoleId}</code> (via{" "}
                            <code className="font-mono text-slate-800 dark:text-slate-200">{result.diagnostics.roleMention.envSource}</code>)
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Belum diset di .env</span>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Dimatikan</span>
                      )}
                    </div>

                    <div className="text-slate-400 dark:text-slate-500 text-[10px]">
                      Diuji oleh <span className="font-medium text-slate-700 dark:text-slate-300">{result.diagnostics.testedBy}</span> · {new Date(result.diagnostics.timestamp).toLocaleTimeString("id-ID")}
                    </div>
                  </div>

                  {!result.success && result.diagnostics.deliveryMethod === "NONE" && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                      💡 <strong>Panduan:</strong> Atur environment variable channel/webhook di <code>.env</code> VPS, contoh:
                      <code className="block mt-1 font-mono text-[10px] bg-white/70 dark:bg-slate-800 p-1.5 rounded">
                        DISCORD_CHANNEL_ID_{result.diagnostics.targetProdi}=1348...
                        <br />
                        atau DISCORD_WEBHOOK_URL_{result.diagnostics.targetProdi}=https://discord.com/api/webhooks/...
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Aman: Tidak ada data tugas yang disimpan di database.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Tutup
            </button>

            <button
              type="submit"
              form="test-notify-form"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Kirim Notifikasi Uji Coba
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

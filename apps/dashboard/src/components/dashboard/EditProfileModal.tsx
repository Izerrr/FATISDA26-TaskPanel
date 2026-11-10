"use client";

import { useEffect, useState } from "react";
import { X, UserRound, AtSign, Hash, Image as ImageIcon, Check, Loader2, AlertCircle } from "lucide-react";
import type { User } from "@/types";

interface EditProfileModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ open, user, onClose, onSaved }: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nim, setNim] = useState("");
  const [avatarSource, setAvatarSource] = useState<"discord" | "google">("discord");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setName(user.name ?? user.username ?? "");
      setUsername((user.username ?? "").toLowerCase().replace(/^@+/, ""));
      setNim(user.nim ?? "");
      setAvatarSource(user.avatarSource === "google" ? "google" : "discord");
      setError(null);
    }
  }, [open, user]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving, onClose]);

  if (!open || !user) return null;

  const isDiscordConnected = Boolean(user.discordId || (!user.id.startsWith("google_") && user.id.length > 5));
  const isGoogleConnected = Boolean(user.googleId || user.email?.endsWith("@student.uns.ac.id"));

  const discordHandleCandidate = (user.discordUsername || "").toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const emailHandleCandidate = user.email ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "") : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase().replace(/^@+/, ""),
          nim: nim.trim().toUpperCase() || null,
          avatarSource,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan perubahan profil.");
        return;
      }

      onSaved();
    } catch {
      setError("Terjadi gangguan jaringan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm overscroll-contain animate-in fade-in duration-150"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-liquid-accent/10 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="edit-profile-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ubah Identitas Profil
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesuaikan nama utama, handle @username, dan foto profilmu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:text-slate-300 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Nama Lengkap / Nama Utama */}
          <div>
            <label htmlFor="profile-name" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Nama Lengkap / Nama Utama
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Muhammad Raihan"
                maxLength={60}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-liquid-accent dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-liquid-accent/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Ditampilkan sebagai nama utama pada papan tugas, komentar, dan kolaborasi kelompok.
            </p>
          </div>

          {/* 2. Username Handle */}
          <div>
            <label htmlFor="profile-username" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Sistem Username (@handle)
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                placeholder="username"
                maxLength={30}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-liquid-accent dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-liquid-accent/20"
              />
            </div>

            {/* Quick Presets for Dual-Linked or Connected Accounts */}
            {(discordHandleCandidate || emailHandleCandidate) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mr-1">Pilih Cepat:</span>
                {discordHandleCandidate && (
                  <button
                    type="button"
                    onClick={() => setUsername(discordHandleCandidate)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
                      username === discordHandleCandidate
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Discord: @{discordHandleCandidate}
                  </button>
                )}
                {emailHandleCandidate && (
                  <button
                    type="button"
                    onClick={() => setUsername(emailHandleCandidate)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
                      username === emailHandleCandidate
                        ? "bg-sky-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Email UNS: @{emailHandleCandidate}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. NIM */}
          <div>
            <label htmlFor="profile-nim" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="profile-nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value.toUpperCase())}
                placeholder="Contoh: M0524001"
                maxLength={25}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-liquid-accent dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-liquid-accent/20"
              />
            </div>
          </div>

          {/* 4. Sumber Foto Profil */}
          {isDiscordConnected && isGoogleConnected && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                Sumber Foto Profil
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAvatarSource("discord")}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                    avatarSource === "discord"
                      ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {user.discordAvatar ? (
                    <img src={user.discordAvatar} alt="Discord Avatar" className="h-9 w-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2] text-white shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Foto Discord</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Avatar server Discord</p>
                  </div>
                  {avatarSource === "discord" && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarSource("google")}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                    avatarSource === "google"
                      ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {user.googleAvatar ? (
                    <img src={user.googleAvatar} alt="Google Avatar" className="h-9 w-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Foto Google</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Akun Student UNS</p>
                  </div>
                  {avatarSource === "google" && <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-liquid-accent px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-95 active:scale-95 disabled:opacity-60 transition"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>{saving ? "Menyimpan..." : "Simpan Profil"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Lock,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { buildGoogleSheetsEditUrl } from "@/lib/settings-shared";
import type {
  ClassStudentDirectoryItem,
  ClassTeam,
  ParsedClassTab,
  StudentTeamAssignment,
} from "@/lib/groups/parse-groups";
import type { Kelas, Prodi } from "@/types";

interface GroupsApiResponse {
  success: boolean;
  needsProfileSetup?: boolean;
  configured?: boolean;
  prodi?: Prodi;
  kelas?: Kelas;
  semester?: number;
  isSuperManager?: boolean;
  canManageSource?: boolean;
  error?: string;
  source?: {
    prodi: Prodi;
    kelas: Kelas;
    semester: number;
    spreadsheetId: string;
    gid: string;
    label: string;
  };
  data?: {
    spreadsheetId: string;
    defaultGid: string;
    documentTitle: string;
    sheetUrl: string;
    fetchedAt: string;
    tabs: ParsedClassTab[];
    totalStudentsInClass: number;
  };
  myAssignments?: StudentTeamAssignment[];
  userProfile?: {
    username: string;
    nim: string | null;
    prodi: Prodi | null;
    kelas: Kelas | null;
    semester: number;
  };
}

const PRODI_OPTIONS: { value: Prodi; label: string }[] = [
  { value: "INFORMATIKA", label: "Informatika" },
  { value: "SAINS_DATA", label: "Sains Data" },
  { value: "INFORMATIKA_PSDKU_KEBUMEN", label: "Informatika PSDKU Kebumen" },
];

const KELAS_OPTIONS: Kelas[] = ["A", "B", "C", "D", "E"];
const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function getProdiShortLabel(prodi?: Prodi | null): string {
  switch (prodi) {
    case "INFORMATIKA":
      return "Informatika";
    case "SAINS_DATA":
      return "Sains Data";
    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "Informatika PSDKU Kebumen";
    default:
      return "Program Studi";
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ClassGroupsPage() {
  const [response, setResponse] = useState<GroupsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Super Manager filter state
  const [selectedProdi, setSelectedProdi] = useState<Prodi | "">("");
  const [selectedKelas, setSelectedKelas] = useState<Kelas | "">("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");

  // Active tab & search state
  const [activeTabGid, setActiveTabGid] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyMyTeam, setOnlyMyTeam] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);

  // Source configuration modal state (for PJ Kelas / Admin)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState("");
  const [sheetLabelInput, setSheetLabelInput] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchGroups = useCallback(
    async (opts?: { refresh?: boolean; prodi?: Prodi | ""; kelas?: Kelas | ""; semester?: number | "" }) => {
      const isManualRefresh = Boolean(opts?.refresh);
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const params = new URLSearchParams();
        if (isManualRefresh) params.set("refresh", "true");
        const p = opts?.prodi ?? selectedProdi;
        const k = opts?.kelas ?? selectedKelas;
        const s = opts?.semester ?? selectedSemester;
        if (p) params.set("prodi", p);
        if (k) params.set("kelas", k);
        if (s) params.set("semester", String(s));

        const res = await fetch(`/api/groups?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as GroupsApiResponse;

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Gagal memuat data ruang kelas.");
        }

        setResponse(json);

        if (json.prodi && !selectedProdi) setSelectedProdi(json.prodi);
        if (json.kelas && !selectedKelas) setSelectedKelas(json.kelas);
        if (json.semester && !selectedSemester) setSelectedSemester(json.semester);

        const loadedData = json.data;
        if (loadedData && loadedData.tabs.length > 0) {
          setActiveTabGid((prev) => {
            if (prev && loadedData.tabs.some((t) => t.gid === prev)) {
              return prev;
            }
            return loadedData.defaultGid || loadedData.tabs[0].gid;
          });
        }

        if (json.source) {
          setSheetUrlInput(
            buildGoogleSheetsEditUrl(json.source.spreadsheetId, json.source.gid),
          );
          setSheetLabelInput(json.source.label);
        } else {
          setSheetUrlInput("");
          setSheetLabelInput("");
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Terjadi kesalahan saat memuat ruang kelas.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedProdi, selectedKelas, selectedSemester],
  );

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTab = useMemo(() => {
    if (!response?.data?.tabs.length) return null;
    return (
      response.data.tabs.find((t) => t.gid === activeTabGid) ??
      response.data.tabs[0]
    );
  }, [response?.data?.tabs, activeTabGid]);

  // Map student NIM -> list of team assignments across all tabs (used in directory view)
  const studentCrossTabMap = useMemo(() => {
    const map = new Map<string, { tabName: string; teamName: string; role: "Ketua" | "Anggota" }[]>();
    if (!response?.data?.tabs) return map;

    for (const tab of response.data.tabs) {
      if (tab.kind !== "groups") continue;
      for (const team of tab.teams) {
        for (const m of team.members) {
          const key = m.nim.trim().toLowerCase() || m.name.trim().toLowerCase();
          if (!key) continue;
          const list = map.get(key) ?? [];
          list.push({ tabName: tab.name, teamName: team.name, role: m.role });
          map.set(key, list);
        }
      }
    }
    return map;
  }, [response?.data?.tabs]);

  // Check if a team belongs to the logged-in user
  const myTeamNameInActiveTab = useMemo(() => {
    if (!activeTab || !response?.myAssignments) return null;
    const found = response.myAssignments.find((a) => a.tabGid === activeTab.gid);
    return found?.teamName ?? null;
  }, [activeTab, response?.myAssignments]);

  const filteredTeams = useMemo(() => {
    if (!activeTab || activeTab.kind !== "groups") return [];
    const q = searchQuery.trim().toLowerCase();

    return activeTab.teams.filter((team) => {
      if (onlyMyTeam && myTeamNameInActiveTab && team.name !== myTeamNameInActiveTab) {
        return false;
      }
      if (!q) return true;
      if (team.name.toLowerCase().includes(q)) return true;
      if (team.topic && team.topic.toLowerCase().includes(q)) return true;
      if (team.category && team.category.toLowerCase().includes(q)) return true;
      return team.members.some(
        (m) => m.name.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q),
      );
    });
  }, [activeTab, searchQuery, onlyMyTeam, myTeamNameInActiveTab]);

  const filteredDirectory = useMemo(() => {
    if (!activeTab || activeTab.kind !== "directory") return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeTab.directory;

    return activeTab.directory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        (item.status && item.status.toLowerCase().includes(q)),
    );
  }, [activeTab, searchQuery]);

  const classOfficers = useMemo(() => {
    if (!activeTab || activeTab.kind !== "directory") return [];
    return activeTab.directory.filter((item) => item.isPjKelas || item.pjMatkul || item.status);
  }, [activeTab]);

  const handleCopyTeam = async (team: ClassTeam, tabName: string) => {
    const header = `${team.name} - ${tabName}${team.topic ? ` (${team.topic})` : ""}`;
    const memberLines =
      team.members.length > 0
        ? team.members.map(
            (m, idx) =>
              `${idx + 1}. ${m.name}${m.nim ? ` (${m.nim})` : ""}${m.role === "Ketua" ? " [Ketua]" : ""}`,
          )
        : ["(Belum ada anggota terdaftar)"];

    const text = [header, ...memberLines].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTeamId(team.id);
      setTimeout(() => {
        setCopiedTeamId((prev) => (prev === team.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard API fallback ignored if denied
    }
  };

  const handleSaveSourceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    setIsSavingConfig(true);

    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodi: response?.prodi,
          kelas: response?.kelas,
          semester: response?.semester,
          sheetUrl: sheetUrlInput,
          label: sheetLabelInput,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan tautan spreadsheet.");
      }

      setShowConfigModal(false);
      await fetchGroups({ refresh: true });
    } catch (err) {
      setConfigError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.",
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  const currentTabSheetUrl = useMemo(() => {
    if (!response?.data?.spreadsheetId) return null;
    const gid = activeTab?.gid || response.data.defaultGid || "0";
    return buildGoogleSheetsEditUrl(response.data.spreadsheetId, gid);
  }, [response?.data?.spreadsheetId, response?.data?.defaultGid, activeTab?.gid]);

  return (
    <DashboardFrame>
      <div className="mx-auto w-full max-w-[1400px] min-w-0 space-y-6 pb-10">
        {/* Top Header Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  <Users className="h-3.5 w-3.5" />
                  {getProdiShortLabel(response?.prodi)} · Kelas {response?.kelas || "-"} · Semester{" "}
                  {response?.semester || 1}
                </span>

                {!response?.isSuperManager && !response?.needsProfileSetup && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    <Lock className="h-3 w-3 text-slate-400" />
                    Khusus Kelas Anda
                  </span>
                )}
              </div>

              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {response?.data?.documentTitle || "Ruang Kelas & Pembagian Kelompok"}
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {response?.configured && response.data
                  ? `${response.data.totalStudentsInClass} mahasiswa terdaftar · ${response.data.tabs.filter((t) => t.kind === "groups").length} mata kuliah dengan pembagian kelompok`
                  : "Direktori anggota kelas, PJ mata kuliah, dan pembagian tim tugas/praktikum yang tersinkronisasi dari Google Spreadsheet kelas."}
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {response?.canManageSource && (
                <button
                  type="button"
                  onClick={() => {
                    setConfigError(null);
                    setShowConfigModal(true);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Settings2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Atur Spreadsheet</span>
                </button>
              )}

              {currentTabSheetUrl && (
                <a
                  href={currentTabSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Buka Google Sheets</span>
                </a>
              )}

              {response?.configured && (
                <button
                  type="button"
                  onClick={() => fetchGroups({ refresh: true })}
                  disabled={isRefreshing || isLoading}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronisasi Ulang"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Super Manager Switcher (Admin / Owner / Ketua Angkatan only) */}
          {response?.isSuperManager && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mode Supervisi Admin/Ketang:
              </span>

              <select
                aria-label="Pilih Program Studi"
                value={selectedProdi}
                onChange={(e) => {
                  const nextProdi = e.target.value as Prodi;
                  setSelectedProdi(nextProdi);
                  fetchGroups({ prodi: nextProdi, kelas: selectedKelas, semester: selectedSemester });
                }}
                className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {PRODI_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Pilih Kelas"
                value={selectedKelas}
                onChange={(e) => {
                  const nextKelas = e.target.value as Kelas;
                  setSelectedKelas(nextKelas);
                  fetchGroups({ prodi: selectedProdi, kelas: nextKelas, semester: selectedSemester });
                }}
                className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>

              <select
                aria-label="Pilih Semester"
                value={selectedSemester}
                onChange={(e) => {
                  const nextSem = parseInt(e.target.value, 10);
                  setSelectedSemester(nextSem);
                  fetchGroups({ prodi: selectedProdi, kelas: selectedKelas, semester: nextSem });
                }}
                className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
              <span>Mengambil dan mem-parse daftar kelompok dari Google Spreadsheet kelas...</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 dark:border-rose-900/60 dark:bg-rose-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Gagal Memuat Data Kelompok Kelas
                </h2>
                <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                  {errorMsg}
                </p>
                <button
                  type="button"
                  onClick={() => fetchGroups({ refresh: true })}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Coba Muat Ulang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Needs Profile Setup State */}
        {!isLoading && !errorMsg && response?.needsProfileSetup && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="max-w-xl space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lengkapi Kelas & Semester di Profil Anda
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Fitur Ruang Kelas dikunci khusus sesuai kelas dan semester masing-masing mahasiswa.
                Silakan atur Program Studi, Kelas, dan Semester Anda terlebih dahulu di halaman Profil.
              </p>
              <Link
                href="/dashboard/profile"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-700"
              >
                <span>Buka Pengaturan Profil</span>
              </Link>
            </div>
          </div>
        )}

        {/* Unconfigured Class Spreadsheet State */}
        {!isLoading && !errorMsg && !response?.needsProfileSetup && response?.configured === false && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="mx-auto max-w-lg space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Spreadsheet Kelompok Belum Dihubungkan
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Belum ada tautan Google Spreadsheet kelompok untuk{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  {getProdiShortLabel(response.prodi)} Kelas {response.kelas} (Semester{" "}
                  {response.semester})
                </strong>
                .{" "}
                {response.canManageSource
                  ? "Klik tombol di bawah untuk menautkan link Google Spreadsheet kelas Anda."
                  : "Silakan hubungi PJ Kelas atau Admin untuk menautkan link Google Spreadsheet kelompok kelas Anda."}
              </p>
              {response.canManageSource && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>Hubungkan Google Spreadsheet Kelas</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configured Content */}
        {!isLoading && !errorMsg && response?.configured && response.data && (
          <>
            {/* Personal Team Assignments Strip (Focal Point for Logged-in Student) */}
            {response.myAssignments && response.myAssignments.length > 0 && (
              <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/60 dark:bg-sky-950/25">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                        Kelompok Saya ({response.userProfile?.username})
                      </h2>
                      <p className="text-xs text-sky-700 dark:text-sky-300/90">
                        Klik mata kuliah untuk langsung melompat ke kartu tim Anda:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {response.myAssignments.map((assign) => {
                      const isCurrent = activeTab?.gid === assign.tabGid;
                      return (
                        <button
                          key={`${assign.tabGid}-${assign.teamName}`}
                          type="button"
                          onClick={() => {
                            setActiveTabGid(assign.tabGid);
                          }}
                          className={`inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
                            isCurrent
                              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                              : "border-sky-200/80 bg-white text-slate-800 hover:border-sky-400 dark:border-sky-800 dark:bg-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <span>{assign.tabName}:</span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                              isCurrent
                                ? "bg-white/20 text-white"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200"
                            }`}
                          >
                            {assign.teamName}
                          </span>
                          {assign.role === "Ketua" && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500 dark:text-amber-300">
                              Ketua
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Tabs Navigation & Search Bar */}
            <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              {/* Accessible Course Tab List */}
              <div
                role="tablist"
                aria-label="Daftar Mata Kuliah dan Direktori Kelas"
                className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-800"
              >
                {response.data.tabs.map((tab) => {
                  const isSelected = activeTab?.gid === tab.gid;
                  const badgeCount =
                    tab.kind === "directory"
                      ? `${tab.directory.length} Mhs`
                      : `${tab.teams.length} Tim`;

                  return (
                    <button
                      key={tab.gid}
                      role="tab"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => setActiveTabGid(tab.gid)}
                      className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-sky-600 dark:text-white"
                          : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{tab.name}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Quick Filter Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab?.kind === "directory"
                        ? "Cari nama mahasiswa, NIM, atau jabatan PJ Matkul..."
                        : "Cari nama mahasiswa, NIM, nomor tim, atau topik..."
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus-visible:bg-slate-800"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Bersihkan pencarian"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeTab?.kind === "groups" && myTeamNameInActiveTab && (
                    <button
                      type="button"
                      onClick={() => setOnlyMyTeam((prev) => !prev)}
                      className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        onlyMyTeam
                          ? "border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/60 dark:text-sky-300"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Hanya Tim Saya ({myTeamNameInActiveTab})</span>
                    </button>
                  )}

                  {activeTab?.sharedLink && (
                    <a
                      href={activeTab.sharedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>Buka Folder Pengumpulan Drive</span>
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Active Tab View: Study/Project Groups Grid */}
            {activeTab?.kind === "groups" && (
              <section aria-label={`Daftar Kelompok ${activeTab.name}`}>
                {filteredTeams.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Tidak ada kelompok yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Coba kata kunci nama atau NIM lain, atau tampilkan semua kelompok.
                    </p>
                    {(searchQuery || onlyMyTeam) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setOnlyMyTeam(false);
                        }}
                        className="mt-3 inline-flex min-h-[38px] items-center rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTeams.map((team) => {
                      const isMyTeam = myTeamNameInActiveTab === team.name;
                      const isCopied = copiedTeamId === team.id;

                      return (
                        <article
                          key={team.id}
                          className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition dark:bg-slate-900 sm:p-5 ${
                            isMyTeam
                              ? "border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-500"
                              : "border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="space-y-3.5">
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {team.name}
                                  </h3>

                                  {isMyTeam && (
                                    <span className="rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                      Kelompok Anda
                                    </span>
                                  )}

                                  {team.category && (
                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {team.category}
                                    </span>
                                  )}
                                </div>

                                {team.topic && (
                                  <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
                                    Topik: <span className="font-semibold">{team.topic}</span>
                                  </p>
                                )}
                              </div>

                              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {team.members.length}/{team.totalSlots} Anggota
                              </span>
                            </div>

                            {/* Members List */}
                            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                              {team.members.length > 0 ? (
                                <ul className="space-y-2">
                                  {team.members.map((m, idx) => {
                                    const q = searchQuery.trim().toLowerCase();
                                    const isHighlightedMember =
                                      Boolean(q) &&
                                      (m.name.toLowerCase().includes(q) ||
                                        m.nim.toLowerCase().includes(q));

                                    return (
                                      <li
                                        key={`${team.id}-${m.nim || idx}`}
                                        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs ${
                                          isHighlightedMember
                                            ? "bg-amber-50 dark:bg-amber-950/40"
                                            : "bg-slate-50/70 dark:bg-slate-800/40"
                                        }`}
                                      >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                            {getInitials(m.name)}
                                          </span>
                                          <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                              {m.name}
                                            </p>
                                            {m.nim && (
                                              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                {m.nim}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {m.role === "Ketua" && (
                                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                            Ketua
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                  Belum ada nama anggota yang diisi pada kelompok ini ({team.totalSlots} kursi tersedia).
                                </div>
                              )}

                              {team.members.length > 0 && team.emptySlots > 0 && (
                                <p className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
                                  + {team.emptySlots} kursi anggota masih kosong
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => handleCopyTeam(team, activeTab.name)}
                              disabled={team.members.length === 0}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    Tersalin
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Salin Anggota</span>
                                </>
                              )}
                            </button>

                            {team.link && (
                              <a
                                href={team.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60"
                              >
                                <FolderOpen className="h-3.5 w-3.5" />
                                <span>Folder Drive</span>
                              </a>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Active Tab View: Class Student Directory & PJ Officers */}
            {activeTab?.kind === "directory" && (
              <div className="space-y-6">
                {/* PJ Kelas & PJ Matkul Highlight Grid */}
                {classOfficers.length > 0 && !searchQuery && (
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Daftar Pengurus & PJ Mata Kuliah Kelas {response.kelas}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {classOfficers.map((officer: ClassStudentDirectoryItem) => (
                        <div
                          key={`officer-${officer.nim}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {officer.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {officer.nim}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                              officer.isPjKelas
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300"
                            }`}
                          >
                            {officer.isPjKelas
                              ? "PJ Kelas"
                              : officer.pjMatkul
                                ? `PJ ${officer.pjMatkul}`
                                : officer.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Full Class Directory Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3.5 w-12">No</th>
                          <th className="px-4 py-3.5">Nama Mahasiswa</th>
                          <th className="px-4 py-3.5">NIM</th>
                          <th className="px-4 py-3.5">Peran / PJ Matkul</th>
                          <th className="px-4 py-3.5">Kelompok Terdaftar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredDirectory.map((student) => {
                          const teams =
                            studentCrossTabMap.get(student.nim.trim().toLowerCase()) ??
                            studentCrossTabMap.get(student.name.trim().toLowerCase()) ??
                            [];

                          return (
                            <tr
                              key={student.nim || student.no}
                              className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            >
                              <td className="px-4 py-3 font-medium text-slate-400">
                                {student.no}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                {student.name}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                                {student.nim}
                              </td>
                              <td className="px-4 py-3">
                                {student.status ? (
                                  <span
                                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                      student.isPjKelas
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                        : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                                    }`}
                                  >
                                    {student.status}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Anggota Kelas</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {teams.length > 0 ? (
                                    teams.map((t) => (
                                      <span
                                        key={`${student.nim}-${t.tabName}`}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                      >
                                        <span className="font-medium text-slate-500 dark:text-slate-400">
                                          {t.tabName}:
                                        </span>
                                        <strong className="font-semibold">{t.teamName}</strong>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Konfigurasi Spreadsheet Kelas (PJ Kelas / Admin) */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-config-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2
                  id="modal-config-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Atur Google Spreadsheet Kelompok
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getProdiShortLabel(response?.prodi)} · Kelas {response?.kelas} · Semester{" "}
                  {response?.semester}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSourceConfig} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="sheet-url-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  URL Google Spreadsheet Kelas
                </label>
                <input
                  id="sheet-url-input"
                  type="url"
                  required
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus-visible:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Cukup masukkan 1 tautan spreadsheet kelas. Sistem otomatis mendeteksi seluruh tab mata kuliah yang ada di dalamnya.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="sheet-label-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Judul / Label Dokumen (Opsional)
                </label>
                <input
                  id="sheet-label-input"
                  type="text"
                  value={sheetLabelInput}
                  onChange={(e) => setSheetLabelInput(e.target.value)}
                  placeholder="Contoh: Class B Infor'26 - Teams"
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus-visible:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {configError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {configError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="min-h-[40px] rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="min-h-[40px] rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {isSavingConfig ? "Menyimpan..." : "Simpan & Sinkronkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}


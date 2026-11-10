import { useEffect, useState, useMemo } from "react";
import { Search, UserPlus, Users, X, Loader2, Sparkles, CheckCircle2, AlertCircle, ChevronDown, BookOpen } from "lucide-react";
import type { ParsedClassTab, StudentTeamAssignment, ClassTeam } from "@/lib/groups/parse-groups";

export interface SelectedGroupMember {
  id: string;
  name?: string | null;
  username: string;
  nim?: string | null;
  avatar: string | null;
}

interface GroupMemberPickerProps {
  selectedMembers: SelectedGroupMember[];
  onChange: (members: SelectedGroupMember[]) => void;
  currentUserId?: string;
}

interface GroupsApiResponse {
  success: boolean;
  configured?: boolean;
  data?: {
    documentTitle: string;
    tabs: ParsedClassTab[];
  };
  myAssignments?: StudentTeamAssignment[];
}

export function GroupMemberPicker({ selectedMembers, onChange, currentUserId }: GroupMemberPickerProps) {
  const [pickerMode, setPickerMode] = useState<"auto" | "manual">("auto");

  // Manual search states
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedGroupMember[]>([]);
  const [searching, setSearching] = useState(false);

  // Auto-import states
  const [classGroups, setClassGroups] = useState<GroupsApiResponse | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedTabGid, setSelectedTabGid] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    successCount: number;
    unmatched: Array<{ name: string; nim?: string }>;
    teamName: string;
  } | null>(null);

  // Fetch class groups data when component mounts
  useEffect(() => {
    let active = true;
    setLoadingGroups(true);
    fetch("/api/groups")
      .then((res) => res.json())
      .then((json: GroupsApiResponse) => {
        if (active && json.success) {
          setClassGroups(json);

          // Default selection if available
          const groupTabs = json.data?.tabs?.filter((t) => t.kind === "groups") || [];
          if (groupTabs.length > 0) {
            setSelectedTabGid(groupTabs[0].gid);
            if (groupTabs[0].teams.length > 0) {
              setSelectedTeamId(groupTabs[0].teams[0].id);
            }
          }
        }
      })
      .catch(() => {
        // Fallback silently if class groups are not configured
      })
      .finally(() => {
        if (active) setLoadingGroups(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Manual search debounce
  useEffect(() => {
    const cleanQuery = query.trim().replace(/^@+/, "");
    if (!cleanQuery) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(cleanQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.users)) {
          setResults(data.users);
        }
      } catch {
        // Ignore network error during live search
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredResults = results.filter(
    (u) => u.id !== currentUserId && !selectedMembers.some((m) => m.id === u.id),
  );

  function handleAdd(user: SelectedGroupMember) {
    if (selectedMembers.some((m) => m.id === user.id)) return;
    onChange([...selectedMembers, user]);
    setQuery("");
    setResults([]);
  }

  function handleRemove(userId: string) {
    onChange(selectedMembers.filter((m) => m.id !== userId));
  }

  // Auto-import handler given a list of members from a team in Ruang Kelas
  async function handleImportTeam(teamName: string, members: Array<{ nim?: string; name: string }>) {
    if (importing || members.length === 0) return;
    setImporting(true);
    setImportFeedback(null);

    try {
      const res = await fetch("/api/groups/resolve-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencocokkan anggota");

      const matched: SelectedGroupMember[] = data.matched || [];
      const unmatched: Array<{ name: string; nim?: string }> = data.unmatched || [];

      // Merge new matched members without duplicates
      const newMembers = [...selectedMembers];
      let addedCount = 0;
      for (const user of matched) {
        if (!newMembers.some((m) => m.id === user.id)) {
          newMembers.push(user);
          addedCount++;
        }
      }

      onChange(newMembers);
      setImportFeedback({
        successCount: addedCount,
        unmatched,
        teamName,
      });
    } catch (err) {
      console.error("[GroupMemberPicker] Import error:", err);
    } finally {
      setImporting(false);
    }
  }

  // Quick 1-click import from student's own assignment
  function handleQuickImportAssignment(assign: StudentTeamAssignment) {
    if (!classGroups?.data) return;
    const tab = classGroups.data.tabs.find((t) => t.gid === assign.tabGid);
    const team = tab?.teams.find((t) => t.name === assign.teamName);
    if (team) {
      void handleImportTeam(`${assign.tabName} - ${team.name}`, team.members);
    }
  }

  // Filter available tabs and teams for manual selection
  const availableGroupTabs = useMemo(() => {
    return classGroups?.data?.tabs?.filter((t) => t.kind === "groups") || [];
  }, [classGroups]);

  const activeTab = useMemo(() => {
    return availableGroupTabs.find((t) => t.gid === selectedTabGid) || availableGroupTabs[0];
  }, [availableGroupTabs, selectedTabGid]);

  const activeTeam = useMemo(() => {
    return activeTab?.teams?.find((t) => t.id === selectedTeamId) || activeTab?.teams?.[0];
  }, [activeTab, selectedTeamId]);

  return (
    <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/25 p-3 space-y-3 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
            Anggota Kelompok ({selectedMembers.length + 1} orang termasuk kamu)
          </span>
        </div>
        <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
          Linked Status
        </span>
      </div>

      {/* Selected Members Chips */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedMembers.map((member) => {
            const displayName = member.name || member.username;
            return (
              <div
                key={member.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs shadow-2xs"
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={displayName} className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="font-mono text-[10px] text-slate-400">@{member.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition"
                  aria-label={`Hapus ${displayName}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode Switcher Tabs: Auto from Class vs Manual */}
      <div className="flex rounded-xl bg-indigo-100/70 dark:bg-slate-800/80 p-1 border border-indigo-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setPickerMode("auto")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
            pickerMode === "auto"
              ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>⚡ Dari Ruang Kelas</span>
        </button>

        <button
          type="button"
          onClick={() => setPickerMode("manual")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
            pickerMode === "manual"
              ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Search className="h-3 w-3" />
          <span>🔍 Cari Manual</span>
        </button>
      </div>

      {/* ================= MODE 1: AUTO FROM CLASS (RUANG KELAS) ================= */}
      {pickerMode === "auto" && (
        <div className="space-y-2.5 pt-0.5">
          {/* Quick Suggestions: User's Own Assignments */}
          {classGroups?.myAssignments && classGroups.myAssignments.length > 0 && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-1.5">
                ⚡ Pintasan Cepat: Kelompok Kamu di Kelas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {classGroups.myAssignments.map((assign) => (
                  <button
                    key={`${assign.tabGid}-${assign.teamName}`}
                    type="button"
                    onClick={() => handleQuickImportAssignment(assign)}
                    disabled={importing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition active:scale-95 disabled:opacity-50 shadow-2xs"
                  >
                    <Users className="h-3 w-3 text-indigo-500" />
                    <span>
                      {assign.tabName} · {assign.teamName}
                    </span>
                    <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 text-[10px] font-mono">
                      +{assign.memberCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dropdown Selector for Any Course & Team */}
          {availableGroupTabs.length > 0 ? (
            <div className="rounded-xl border border-indigo-200/70 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 p-2.5 space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pilih Kelompok Lain di Ruang Kelas
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Course Tab Dropdown */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Mata Kuliah</label>
                  <select
                    value={activeTab?.gid}
                    onChange={(e) => {
                      setSelectedTabGid(e.target.value);
                      const targetTab = availableGroupTabs.find((t) => t.gid === e.target.value);
                      if (targetTab?.teams?.[0]) {
                        setSelectedTeamId(targetTab.teams[0].id);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {availableGroupTabs.map((t) => (
                      <option key={t.gid} value={t.gid} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {t.name} ({t.teams.length} kelompok)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Dropdown */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Kelompok</label>
                  <select
                    value={activeTeam?.id}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {activeTab?.teams?.map((team) => (
                      <option key={team.id} value={team.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {team.name} ({team.members.length} anggota)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Import Action Button */}
              {activeTeam && (
                <button
                  type="button"
                  onClick={() => handleImportTeam(`${activeTab.name} - ${activeTeam.name}`, activeTeam.members)}
                  disabled={importing || activeTeam.members.length === 0}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {importing ? "Mencocokkan Anggota..." : `⚡ Impor Anggota ${activeTeam.name}`}
                  </span>
                </button>
              )}
            </div>
          ) : loadingGroups ? (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span>Memuat data kelompok kelas...</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 p-3 text-center text-xs text-slate-500 dark:text-slate-400">
              <p>Belum ada data pembagian kelompok di Ruang Kelas kamu.</p>
              <button
                type="button"
                onClick={() => setPickerMode("manual")}
                className="mt-1 text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2"
              >
                Gunakan pencarian manual di sini
              </button>
            </div>
          )}

          {/* Import Result Feedback Alert */}
          {importFeedback && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-800 p-2.5 space-y-1.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {importFeedback.successCount > 0
                    ? `Berhasil menambahkan ${importFeedback.successCount} anggota dari ${importFeedback.teamName}.`
                    : `Semua anggota dari ${importFeedback.teamName} sudah ditambahkan.`}
                </span>
              </div>

              {importFeedback.unmatched.length > 0 && (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                    ⚠️ {importFeedback.unmatched.length} anggota belum terdeteksi akunnya secara otomatis:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {importFeedback.unmatched.map((unm) => (
                      <button
                        key={`${unm.nim}-${unm.name}`}
                        type="button"
                        onClick={() => {
                          setPickerMode("manual");
                          setQuery(unm.name);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
                        title="Klik untuk mencari manual akun teman ini"
                      >
                        <span>{unm.name}</span>
                        <Search className="h-2.5 w-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 2: MANUAL SEARCH ================= */}
      {pickerMode === "manual" && (
        <div className="space-y-2 pt-0.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari @username, nama lengkap, atau NIM..."
              className="w-full rounded-xl border border-indigo-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-8 pr-8 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-indigo-500" />
            )}
          </div>

          {/* Live Search Dropdown Results */}
          {query.trim().length > 0 && (
            <div className="max-h-40 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/60 shadow-sm">
              {filteredResults.length === 0 && !searching ? (
                <p className="p-2.5 text-center text-[11px] text-slate-400">
                  Tidak ditemukan mahasiswa dengan kata kunci tersebut.
                </p>
              ) : (
                filteredResults.map((user) => {
                  const displayName = user.name || user.username;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAdd(user)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-indigo-50/70 dark:hover:bg-slate-700/60 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={displayName} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
                          <p className="truncate font-mono text-[10px] text-slate-400">
                            @{user.username}
                            {user.nim ? ` · ${user.nim}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                        <UserPlus className="h-3 w-3" />
                        <span>Tambah</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

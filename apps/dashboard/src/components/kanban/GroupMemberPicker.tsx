import { useEffect, useState } from "react";
import { Search, UserPlus, Users, X, Loader2 } from "lucide-react";

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

export function GroupMemberPicker({ selectedMembers, onChange, currentUserId }: GroupMemberPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedGroupMember[]>([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/25 p-3 space-y-2.5 animate-in fade-in duration-150">
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

      <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/90 leading-relaxed">
        Tambah teman kelompok via <strong className="font-mono">@username</strong>, nama lengkap, atau NIM. Status pengerjaan akan tersinkronisasi untuk semua anggota.
      </p>

      {/* Selected Members Chips */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedMembers.map((member) => {
            const displayName = member.name || member.username;
            return (
              <div
                key={member.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-white dark:bg-slate-800 px-2 py-1 text-xs shadow-2xs"
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

      {/* Search Input */}
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
          <Loader2 className=" absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-indigo-500" />
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
  );
}

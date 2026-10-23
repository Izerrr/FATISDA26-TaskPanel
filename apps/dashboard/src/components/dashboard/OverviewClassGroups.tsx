"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Users } from "lucide-react";
import type { ParsedClassTab, StudentTeamAssignment } from "@/lib/groups/parse-groups";
import type { Kelas, Prodi } from "@/types";

interface GroupsSummaryResponse {
  success: boolean;
  configured?: boolean;
  prodi?: Prodi;
  kelas?: Kelas;
  semester?: number;
  data?: {
    documentTitle: string;
    totalStudentsInClass: number;
    tabs: ParsedClassTab[];
  };
  myAssignments?: StudentTeamAssignment[];
}

export function OverviewClassGroups() {
  const [summary, setSummary] = useState<GroupsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/groups")
      .then((res) => res.json())
      .then((json: GroupsSummaryResponse) => {
        if (active && json.success) {
          setSummary(json);
        }
      })
      .catch(() => {
        // Silent fallback on overview widget
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !summary?.configured || !summary.data) {
    return null;
  }

  const groupTabs = summary.data.tabs.filter((t) => t.kind === "groups");
  const myAssignments = summary.myAssignments ?? [];

  return (
    <section className="w-full max-w-full min-w-0 rounded-2xl border border-liquid-border bg-white p-4 shadow-glass dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            {myAssignments.length > 0 ? (
              <UserCheck className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-liquid-text dark:text-slate-100">
                {myAssignments.length > 0
                  ? `Kelompok Kuliah Saya (Kelas ${summary.kelas})`
                  : `Ruang Kelas ${summary.kelas} · ${summary.data.documentTitle}`}
              </h2>
              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                Semester {summary.semester}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-liquid-text-secondary dark:text-slate-400">
              {myAssignments.length > 0
                ? `Terdaftar di ${myAssignments.length} pembagian kelompok mata kuliah`
                : `${summary.data.totalStudentsInClass} mahasiswa · ${groupTabs.length} mata kuliah dengan pembagian kelompok`}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/class"
          className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          Buka Ruang Kelas
        </Link>
      </div>

      {/* Pills for student's assigned teams or available course tabs */}
      <div className="mt-3.5 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {myAssignments.length > 0
          ? myAssignments.map((assign) => (
              <Link
                key={`${assign.tabGid}-${assign.teamName}`}
                href="/dashboard/class"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200/80 bg-sky-50/60 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-sky-400 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-slate-200"
              >
                <span className="text-slate-500 dark:text-slate-400">{assign.tabName}:</span>
                <strong className="font-bold text-sky-700 dark:text-sky-300">
                  {assign.teamName}
                </strong>
                {assign.role === "Ketua" && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Ketua
                  </span>
                )}
              </Link>
            ))
          : groupTabs.map((tab) => (
              <Link
                key={tab.gid}
                href="/dashboard/class"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
              >
                <span className="font-semibold">{tab.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({tab.teams.length} Tim)
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}


"use client";

import Link from "next/link";
import { BookOpen, Check, FolderOpen, FileText, PlusSquare } from "lucide-react";
import {
  EXAM_READINESS_STEPS,
  getSafeExamMaterialLinks,
  type ExamReadinessChecklistKey,
  type ExamReadinessItemState,
  type VaultMatchSummary,
} from "@/lib/exam-readiness";

interface ExamReadinessStripProps {
  examId: string;
  courseName: string;
  vaults: VaultMatchSummary[];
  readinessState: ExamReadinessItemState;
  onToggleStep: (examId: string, step: ExamReadinessChecklistKey) => void;
  onCreateStudyTask?: () => void;
  compact?: boolean;
  isPast?: boolean;
}

export function ExamReadinessStrip({
  examId,
  courseName,
  vaults,
  readinessState,
  onToggleStep,
  onCreateStudyTask,
  compact = false,
  isPast = false,
}: ExamReadinessStripProps) {
  const material = getSafeExamMaterialLinks(vaults, courseName);
  const doneCount = EXAM_READINESS_STEPS.filter((s) => readinessState[s.key]).length;
  const allReady = doneCount === EXAM_READINESS_STEPS.length;
  const vaultHref = material.courseId ? `/dashboard/courses/${material.courseId}` : "/dashboard/courses";

  return (
    <div
      className={`rounded-xl border border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 ${
        compact ? "p-2.5 space-y-2" : "p-3 space-y-2.5"
      }`}
    >
      {/* Checklist kesiapan belajar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Kesiapan Ujian
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            allReady
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          }`}
        >
          {doneCount}/{EXAM_READINESS_STEPS.length} {allReady ? "Siap" : "Target"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {EXAM_READINESS_STEPS.map((step) => {
          const checked = readinessState[step.key];
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onToggleStep(examId, step.key)}
              aria-pressed={checked}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                checked
                  ? "border-emerald-300 bg-emerald-500/15 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded ${
                  checked ? "bg-emerald-500 text-white" : "border border-slate-300 dark:border-slate-600"
                }`}
              >
                {checked && <Check className="h-2.5 w-2.5" />}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vault links & Quick Study Task */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center gap-1">
          {material.driveUrl && (
            <a
              href={material.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-500/20 dark:text-sky-300 transition"
            >
              <FolderOpen className="h-3 w-3" />
              Drive
            </a>
          )}
          {material.modulUrl && (
            <a
              href={material.modulUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-500/20 dark:text-violet-300 transition"
            >
              <BookOpen className="h-3 w-3" />
              Modul
            </a>
          )}
          {material.silabusUrl && (
            <a
              href={material.silabusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition"
            >
              <FileText className="h-3 w-3" />
              Silabus
            </a>
          )}
          {!material.driveUrl && !material.modulUrl && !material.silabusUrl && (
            <Link
              href={vaultHref}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-700/60 dark:text-slate-300 transition"
            >
              <FolderOpen className="h-3 w-3" />
              Buka Vault
            </Link>
          )}
        </div>

        {onCreateStudyTask && !isPast && (
          <button
            type="button"
            onClick={onCreateStudyTask}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300 transition"
          >
            <PlusSquare className="h-3 w-3" />
            <span>Tugas Belajar</span>
          </button>
        )}
      </div>
    </div>
  );
}

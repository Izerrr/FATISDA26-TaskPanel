import { useEffect, useState } from "react";
import { 
  X, 
  CalendarClock, 
  CheckCircle2, 
  Clock3, 
  User, 
  BookOpen, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  History, 
  AlertCircle,
  ArrowRight,
  Loader2
} from "lucide-react";
import type { Task, TaskStatus, Course, Role } from "@/types";
import { formatDueDate, getUrgency } from "@/lib/due-date";
import { formatWib } from "@/lib/datetime";
import { TaskCommentSection } from "./TaskCommentSection";
import useSWR from "swr";

interface TaskDetailModalProps {
  task: Task | null;
  courses: Course[];
  roles: Role[] | string[];
  userId?: string;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => Promise<void> | void;
}

interface ActivityItem {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    username: string;
    avatar: string | null;
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusOptions: { value: TaskStatus; label: string; bg: string; text: string; ring: string }[] = [
  { value: "TODO", label: "Todo", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-300 dark:ring-slate-600" },
  { value: "IN_PROGRESS", label: "In Progress", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-400" },
  { value: "NEED_REVIEW", label: "Need Review", bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", ring: "ring-purple-400" },
  { value: "DONE", label: "Done", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-400" },
];

export function TaskDetailModal({
  task,
  courses,
  roles,
  userId,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Activity logs
  const { data: activityData, isLoading: activityLoading, mutate: mutateActivity } = useSWR<{ activities: ActivityItem[] }>(
    task ? `/api/tasks/${task.id}/activities` : null,
    fetcher
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && task) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  const urgency = getUrgency(task.dueDate);
  const canManageClass = roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(String(r)));
  const isOwner = task.createdById === userId;
  const canModify = isOwner || (task.scope === "CLASS" && canManageClass);

  async function handleQuickStatus(newStatus: TaskStatus) {
    if (!task || task.status === newStatus || statusUpdating) return;
    setStatusUpdating(true);
    try {
      if (onStatusChange) {
        await onStatusChange(task, newStatus);
      }
      mutateActivity();
    } finally {
      setStatusUpdating(false);
    }
  }

  function formatActionText(action: string, oldVal: string | null, newVal: string | null) {
    switch (action) {
      case "CREATED":
        return `Membuat tugas "${newVal || ""}"`;
      case "STATUS_CHANGED":
        return `Mengubah status: ${oldVal || "-"} → ${newVal || "-"}`;
      case "TITLE_CHANGED":
        return `Mengubah judul tugas`;
      default:
        return action;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                task.scope === "CLASS"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  : "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-900"
              }`}
            >
              {task.scope === "CLASS" ? "Tugas Kelas" : "Tugas Personal"}
            </span>

            {task.course && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <BookOpen className="h-3 w-3" />
                {task.course.code}
              </span>
            )}

            {task.kelas && (
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Kelas {task.kelas}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {canModify && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Edit Tugas"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            {canModify && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(task);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                title="Hapus Tugas"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-6">
          {/* Title & Course */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {task.title}
            </h2>
            {task.course && (
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {task.course.code} · {task.course.name}
              </p>
            )}
          </div>

          {/* Quick Status Bar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Status Pengerjaan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((opt) => {
                const isCurrent = task.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleQuickStatus(opt.value)}
                    disabled={statusUpdating}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isCurrent
                        ? `${opt.bg} ${opt.text} ring-2 ${opt.ring} shadow-xs font-extrabold`
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isCurrent && <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Deadline Banner */}
          {task.dueDate && (
            <div
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl p-3.5 text-xs ${
                urgency === "overdue"
                  ? "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : urgency === "dueSoon"
                  ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                  : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-bold">Batas Pengumpulan: </span>
                  <span>{formatWib(task.dueDate, { dateStyle: "full", timeStyle: "short" })} WIB</span>
                </div>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold shadow-xs">
                {formatDueDate(task.dueDate)}
              </span>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Catatan / Petunjuk Tugas
              </label>
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {task.description}
              </div>
            </div>
          )}

          {/* Meta Info: Pembuat & Penerima */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            {task.createdBy && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Dibuat oleh:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{task.createdBy.username}</span>
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Penerima tugas:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{task.assignee.username}</span>
              </div>
            )}
          </div>

          {/* Interactive Tabs: Diskusi & Riwayat */}
          <div className="pt-2">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${
                  activeTab === "comments"
                    ? "border-liquid-accent text-liquid-accent dark:border-sky-400 dark:text-sky-400"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Diskusi & Komentar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${
                  activeTab === "activity"
                    ? "border-liquid-accent text-liquid-accent dark:border-sky-400 dark:text-sky-400"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Riwayat Aktivitas</span>
              </button>
            </div>

            {/* Tab 1: Comments */}
            {activeTab === "comments" && (
              <div>
                <TaskCommentSection taskId={task.id} />
              </div>
            )}

            {/* Tab 2: Activity Log Timeline */}
            {activeTab === "activity" && (
              <div className="space-y-3">
                {activityLoading ? (
                  <div className="flex justify-center py-6 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : !activityData?.activities || activityData.activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">Belum ada catatan aktivitas pada tugas ini.</p>
                ) : (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {activityData.activities.map((act) => (
                      <div key={act.id} className="relative flex flex-col text-xs">
                        <div className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-liquid-accent dark:bg-sky-400 ring-4 ring-white dark:ring-slate-900" />
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {act.user.username}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatWib(act.createdAt, {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatActionText(act.action, act.oldValue, act.newValue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <span className="text-[11px] text-slate-400">
            ID: <code className="font-mono text-[10px]">{task.id.slice(0, 10)}...</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock3, CalendarClock, AlertCircle, Pencil, Trash2, ChevronRight, ChevronDown, ChevronUp, ClipboardList, Sparkles, Flame } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { formatDueDate, getUrgency } from "@/lib/due-date";

interface TaskListViewProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onMoveStatus: (task: Task, newStatus: TaskStatus) => Promise<void>;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  justMovedTaskId?: string | null;
}

const statusOptions: { value: TaskStatus; label: string; bg: string; text: string }[] = [
  { value: "TODO", label: "Todo", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" },
  { value: "IN_PROGRESS", label: "In Progress", bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300" },
  { value: "NEED_REVIEW", label: "Need Review", bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300" },
  { value: "DONE", label: "Done", bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300" },
];

export function TaskListView({ tasks, onSelect, onMoveStatus, onEdit, onDelete, justMovedTaskId }: TaskListViewProps) {
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "DONE">("ALL");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (filterTab === "ACTIVE") {
      list = list.filter((t) => t.status !== "DONE");
    } else if (filterTab === "DONE") {
      list = list.filter((t) => t.status === "DONE");
    }

    // Sort by deadline closest first; tasks without deadline come last
    return list.sort((a, b) => {
      if (a.status === "DONE" && b.status !== "DONE") return 1;
      if (a.status !== "DONE" && b.status === "DONE") return -1;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks, filterTab]);

  // Jika ada tugas yang baru saja dipindahkan ke filter ini di luar 5 teratas, otomatis buka agar terlihat
  useEffect(() => {
    if (justMovedTaskId && filteredTasks.some((t, idx) => t.id === justMovedTaskId && idx >= 5)) {
      setIsExpanded(true);
    }
  }, [justMovedTaskId, filteredTasks]);

  const hasExcess = filteredTasks.length > 5;
  const visibleTasks = hasExcess && !isExpanded ? filteredTasks.slice(0, 5) : filteredTasks;

  const handleTabChange = (tab: "ALL" | "ACTIVE" | "DONE") => {
    setFilterTab(tab);
    setIsExpanded(tab !== "DONE");
  };

  const activeCount = tasks.filter((t) => t.status !== "DONE").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-4">
      {/* List Sub-filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-1 backdrop-blur-sm overflow-x-auto max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange("ALL")}
            className={`shrink-0 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${filterTab === "ALL" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            Semua ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("ACTIVE")}
            className={`shrink-0 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${filterTab === "ACTIVE" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <span className="hidden sm:inline">Aktif / Belum Selesai</span>
            <span className="sm:hidden">Aktif</span> ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("DONE")}
            className={`shrink-0 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${filterTab === "DONE" ? "bg-liquid-accent text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            Selesai ({doneCount})
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">Diurutkan berdasarkan tenggat waktu terdekat</p>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {filterTab === "DONE" ? "Belum ada tugas yang selesai." : filterTab === "ACTIVE" ? "Semua tugas aktif sudah diselesaikan!" : "Tidak ada tugas yang sesuai."}
          </p>
          <p className="mt-1 text-xs text-slate-400">{filterTab === "ACTIVE" ? "Kerja bagus! Waktunya istirahat." : "Tugas akan muncul di sini setelah dibuat."}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {visibleTasks.map((task) => {
            const isDone = task.status === "DONE";
            const urgency = getUrgency(task.dueDate, task.status);
            const isHighlighted = justMovedTaskId === task.id;

            return (
              <div key={task.id} className={`group flex items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${isHighlighted ? "bg-emerald-50/40 dark:bg-emerald-950/30" : ""}`}>
                {/* Checkbox & Main Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextStatus: TaskStatus = isDone ? "TODO" : "DONE";
                      void onMoveStatus(task, nextStatus);
                    }}
                    title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                    className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/40" /> : <Circle className="h-5 w-5" />}
                  </button>

                  <div onClick={() => onSelect(task)} className="min-w-0 flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold transition-colors group-hover:text-liquid-accent dark:group-hover:text-sky-400 ${isDone ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}
                      >
                        {task.title}
                      </span>

                      {/* Course badge */}
                      {task.course && <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{task.course.code}</span>}

                      {/* Scope tag */}
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          task.scope === "CLASS" ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" : "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                        }`}
                      >
                        {task.scope === "CLASS" ? "Kelas" : "Personal"}
                      </span>
                    </div>

                    {/* Metadata line: Due date & Course name */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {task.course?.name && <span className="truncate max-w-[220px]">{task.course.name}</span>}

                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            urgency === "overdue" ? "text-rose-600 dark:text-rose-400 font-bold" : urgency === "dueSoon" ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {urgency === "overdue" ? <AlertCircle className="h-3 w-3" /> : urgency === "dueSoon" ? <Flame className="h-3 w-3 animate-pulse" /> : <Clock3 className="h-3 w-3" />}
                          <span>
                            {urgency === "overdue" ? "Terlewat: " : ""}
                            {formatDueDate(task.dueDate)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Status Dropdown & Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => {
                      void onMoveStatus(task, e.target.value as TaskStatus);
                    }}
                    className={`rounded-xl border-none px-2 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold outline-none cursor-pointer shrink-0 ${statusOptions.find((o) => o.value === task.status)?.bg} ${statusOptions.find((o) => o.value === task.status)?.text}`}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Edit action */}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      title="Edit tugas"
                      className="hidden sm:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Delete action */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(task)}
                      title="Hapus tugas"
                      className="hidden sm:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Chevron to view detail */}
                  <button type="button" onClick={() => onSelect(task)} title="Buka detail tugas" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasExcess && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                <span>Sembunyikan ({filteredTasks.length - 5} tugas)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                <span>Lihat {filteredTasks.length - 5} tugas lainnya</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

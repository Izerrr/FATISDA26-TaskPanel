"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, CheckSquare, Loader2, Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import type { Course, Task, TaskStatus } from "@/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Todo",
  WAITING: "Waiting List",
  IN_PROGRESS: "In Progress",
  NEED_REVIEW: "Need Review",
  DONE: "Done",
};

const SCOPE_LABEL: Record<Task["scope"], string> = {
  PERSONAL: "Personal",
  GROUP: "Kelompok",
  CLASS: "Kelas",
};

export function GlobalSearch() {
  const { user } = useRole();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ tasks: Task[]; courses: Course[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setIsMac(typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        if (isDesktop) {
          desktopInputRef.current?.focus();
          desktopInputRef.current?.select();
          setIsOpen(true);
        } else {
          setMobileModalOpen(true);
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setMobileModalOpen(false);
        desktopInputRef.current?.blur();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (mobileModalOpen) {
      const timer = setTimeout(() => mobileInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [mobileModalOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (user?.prodi) params.set("prodi", user.prodi);
        if (user?.kelas) params.set("kelas", user.kelas);

        const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          if (!mobileModalOpen) {
            setIsOpen(true);
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Search failed", error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, user?.prodi, user?.kelas, mobileModalOpen]);

  function closeAll() {
    setIsOpen(false);
    setMobileModalOpen(false);
    setQuery("");
    setResults(null);
  }

  function handleSelectTask(task: Task) {
    closeAll();
    router.push(`/dashboard/tasks?taskId=${encodeURIComponent(task.id)}`);
  }

  function handleSelectCourse(course: Course) {
    closeAll();
    router.push(`/dashboard/courses/${encodeURIComponent(course.id)}`);
  }

  function renderResultsBody() {
    if (query.trim().length < 2) {
      return (
        <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Ketik minimal 2 karakter untuk mencari tugas atau mata kuliah.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      );
    }

    if (!results) return null;

    if (results.tasks.length === 0 && results.courses.length === 0) {
      return (
        <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Tidak ada hasil untuk &ldquo;{query.trim()}&rdquo;
        </div>
      );
    }

    return (
      <div className="py-2">
        {results.tasks.length > 0 && (
          <div className="mb-2">
            <h3 className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tugas</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-liquid-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{STATUS_LABEL[task.status] ?? task.status}</span>
                        <span>•</span>
                        <span>{SCOPE_LABEL[task.scope] ?? task.scope}</span>
                        {task.course?.code && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{task.course.code}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.courses.length > 0 && (
          <div>
            <h3 className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Mata Kuliah</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.courses.map((course) => (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectCourse(course)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{course.name}</p>
                      <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{course.code}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile compact search button */}
      <button
        type="button"
        onClick={() => setMobileModalOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.03] text-liquid-text-secondary transition hover:bg-black/[0.06] hover:text-liquid-text active:scale-95 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
        aria-label="Cari tugas atau mata kuliah"
        title="Cari tugas atau mata kuliah"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {/* Desktop search bar */}
      <div ref={searchContainerRef} className="relative hidden w-full max-w-sm md:block">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-slate-400" />
          </div>
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2) setIsOpen(true);
            }}
            onClick={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            placeholder="Cari tugas, mata kuliah..."
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 leading-5 text-slate-900 placeholder-slate-400 transition-colors focus:border-liquid-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-liquid-accent dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 sm:text-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
                setIsOpen(false);
                desktopInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Bersihkan pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <kbd className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            </div>
          )}
        </div>

        {isOpen && query.trim().length >= 2 && (
          <div className="absolute z-50 mt-1 max-h-96 w-full min-w-[280px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {renderResultsBody()}
          </div>
        )}
      </div>

      {/* Mobile Portal Search Modal */}
      {mounted &&
        mobileModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-950/60 p-3 pt-14 backdrop-blur-sm animate-in fade-in duration-150 md:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileModalOpen(false);
            }}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-3 dark:border-slate-800">
                <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari tugas, mata kuliah..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults(null);
                      mobileInputRef.current?.focus();
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Hapus kata kunci"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  Tutup
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">{renderResultsBody()}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

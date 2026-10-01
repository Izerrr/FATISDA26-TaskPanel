"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Loader2, BookOpen, CheckSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Task, Course } from "@/types";
import { useRole } from "@/hooks/useRole";

export function GlobalSearch() {
  const { user } = useRole();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ tasks: Task[], courses: Course[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (user?.prodi) params.set("prodi", user.prodi);
        if (user?.kelas) params.set("kelas", user.kelas);
        
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, user?.prodi, user?.kelas]);

  const statusLabel = {
    TODO: "Todo",
    IN_PROGRESS: "In Progress",
    NEED_REVIEW: "Need Review",
    DONE: "Done",
  };

  const handleSelect = (type: "task" | "course", item: any) => {
    setIsOpen(false);
    setQuery("");
    if (type === "task") {
      router.push("/dashboard"); // Simple for now
    } else {
      router.push("/dashboard/courses");
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-sm hidden md:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-slate-400" />
        </div>
        <input
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
          className="block w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-2xl leading-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-liquid-accent focus:border-liquid-accent sm:text-xs transition-colors"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery("");
              setResults(null);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute mt-1 w-full z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : results ? (
            <div className="py-2">
              {results.tasks.length === 0 && results.courses.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  Tidak ada hasil untuk "{query}"
                </div>
              )}

              {results.tasks.length > 0 && (
                <div className="mb-2">
                  <h3 className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tugas</h3>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.tasks.map((task) => (
                      <li key={task.id}>
                        <button 
                          onClick={() => handleSelect("task", task)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-3 transition-colors"
                        >
                          <CheckSquare className="h-4 w-4 text-liquid-accent mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] text-slate-500">{statusLabel[task.status as keyof typeof statusLabel]}</span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-500">{task.scope === "CLASS" ? "Kelas" : "Personal"}</span>
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
                          onClick={() => handleSelect("course", course)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                        >
                          <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{course.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{course.code}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

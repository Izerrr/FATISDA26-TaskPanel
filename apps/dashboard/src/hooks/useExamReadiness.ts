"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExamReadinessChecklistKey, ExamReadinessItemState } from "@/lib/exam-readiness";

const STORAGE_KEY = "fatisda_exam_readiness_v1";
const EVENT_NAME = "fatisda_exam_readiness_change";

const DEFAULT_STATE: ExamReadinessItemState = {
  kisi: false,
  catatan: false,
  latihan: false,
};

type ReadinessMap = Record<string, ExamReadinessItemState>;

function readStorage(): ReadinessMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ReadinessMap) : {};
  } catch {
    return {};
  }
}

export function useExamReadiness() {
  const [map, setMap] = useState<ReadinessMap>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMap(readStorage());

    const handleSync = () => {
      setMap(readStorage());
    };
    window.addEventListener(EVENT_NAME, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(EVENT_NAME, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const getExamState = useCallback(
    (examId: string): ExamReadinessItemState => map[examId] ?? DEFAULT_STATE,
    [map]
  );

  const toggleStep = useCallback((examId: string, step: ExamReadinessChecklistKey) => {
    setMap((prev) => {
      const current = prev[examId] ?? DEFAULT_STATE;
      const next: ReadinessMap = {
        ...prev,
        [examId]: {
          ...current,
          [step]: !current[step],
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event(EVENT_NAME));
        } catch {
          // Ignore storage quota restrictions
        }
      }
      return next;
    });
  }, []);

  return {
    getExamState,
    toggleStep,
  };
}

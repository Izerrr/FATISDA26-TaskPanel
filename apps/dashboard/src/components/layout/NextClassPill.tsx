"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import { getCurrentLiveClassStatus } from "@/lib/schedule-utils";

export function NextClassPill() {
  const { schedules } = useSchedule();
  const [, setTick] = useState(0);

  // Update status setiap 30 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const liveStatus = getCurrentLiveClassStatus(schedules);

  if (liveStatus.state === "ONGOING") {
    const courseName = liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name ?? "Kuliah";
    const room = liveStatus.schedule.room;

    return (
      <Link
        href="/dashboard/schedule"
        className="flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:shadow-xs dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-200 max-w-[125px] sm:max-w-[280px]"
        title={`Sedang berlangsung: ${courseName}${room ? ` di ${room}` : ""}`}
      >
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
        <span className="truncate font-bold">
          {courseName}
        </span>
        {room && (
          <span className="hidden sm:inline shrink-0 rounded bg-emerald-100/80 px-1 text-[10px] text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
            {room}
          </span>
        )}
        <span className="shrink-0 text-[10px] text-emerald-700 dark:text-emerald-400">
          {liveStatus.minutesRemaining}m
        </span>
      </Link>
    );
  }

  if (liveStatus.state === "UPCOMING_SOON") {
    const courseName = liveStatus.schedule.courseName ?? liveStatus.schedule.course?.name ?? "Kuliah";
    const room = liveStatus.schedule.room;
    const timeLabel =
      liveStatus.minutesUntilStart < 60
        ? `${liveStatus.minutesUntilStart}m lagi`
        : `pk ${liveStatus.schedule.startTime}`;

    return (
      <Link
        href="/dashboard/schedule"
        className="flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/90 px-2.5 py-1 text-[11px] font-semibold text-sky-900 transition hover:bg-sky-100 hover:shadow-xs dark:border-sky-800/70 dark:bg-sky-950/50 dark:text-sky-200 max-w-[125px] sm:max-w-[280px]"
        title={`Kuliah berikutnya: ${courseName} (${timeLabel})${room ? ` di ${room}` : ""}`}
      >
        <Clock3 className="h-3 w-3 shrink-0 text-sky-600 dark:text-sky-400" />
        <span className="truncate font-bold">
          {courseName}
        </span>
        {room && (
          <span className="hidden sm:inline shrink-0 rounded bg-sky-100/80 px-1 text-[10px] text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
            {room}
          </span>
        )}
        <span className="shrink-0 text-[10px] font-medium text-sky-700 dark:text-sky-400">
          {timeLabel}
        </span>
      </Link>
    );
  }

  return null;
}

import { formatExamDuration } from "./schedule/exam/constants";

export type BroadcastTiming = "tomorrow" | "today" | "scheduled";
export type BroadcastTone = "casual_en" | "formal_id" | "concise";

export interface BroadcastTaskItem {
  title: string;
  dueDate?: string | Date | null;
}

export interface CourseBroadcastOptions {
  mode?: "course" | "exam";
  examType?: "UTS" | "UAS";
  kelas: string;
  courseName: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  lecturer?: string | null;
  dayName?: string;
  dateStr?: string;
  timing: BroadcastTiming;
  tone?: BroadcastTone;
  includeLecturer?: boolean;
  includeTasks?: boolean;
  tasks?: BroadcastTaskItem[];
}

export interface DaySummaryBroadcastOptions {
  mode?: "course" | "exam";
  examType?: "UTS" | "UAS";
  kelas: string;
  dayName: string;
  dateStr?: string;
  timing: BroadcastTiming;
  tone?: BroadcastTone;
  includeLecturer?: boolean;
  items: Array<{
    courseName: string;
    startTime: string;
    endTime: string;
    room?: string | null;
    lecturer?: string | null;
  }>;
}

/**
 * Formats "09:20" to "09.20" to match the authentic PJ Matkul broadcast style.
 */
export function formatDotTime(time: string): string {
  return time.trim().replace(":", ".");
}

/**
 * Automatically determines whether a schedule day or exam date is H-1 ("tomorrow") or Hari-H ("today").
 */
export function detectDefaultTiming(
  options: { dayNum?: number; date?: string | Date | null },
  now: Date = new Date(),
): BroadcastTiming {
  if (options.date) {
    const target = typeof options.date === "string" ? new Date(options.date) : options.date;
    if (!isNaN(target.getTime())) {
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const targetMidnight = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
      ).getTime();
      const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "today";
      if (diffDays === 1) return "tomorrow";
      return "tomorrow";
    }
  }

  if (typeof options.dayNum === "number") {
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon .. 6 = Sat
    if (options.dayNum === currentDay) {
      return "today";
    }
    const nextDay = currentDay === 7 ? 1 : currentDay + 1;
    if (options.dayNum === nextDay) {
      return "tomorrow";
    }
  }

  return "tomorrow";
}

function formatShortDeadline(dueDate?: string | Date | null): string {
  if (!dueDate) return "";
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateCourseBroadcast(opts: CourseBroadcastOptions): string {
  const mode = opts.mode ?? "course";
  const tone = opts.tone ?? "casual_en";
  const kelasLabel = opts.kelas?.trim() || "A";
  const timeRange = `${formatDotTime(opts.startTime)} - ${formatDotTime(opts.endTime)}`;
  const roomText = opts.room?.trim() || "TBA";
  const duration = mode === "exam" ? formatExamDuration(opts.startTime, opts.endTime) : "";
  const examBadge = opts.examType ?? "UTS";

  const showLecturer = Boolean(opts.includeLecturer && opts.lecturer?.trim());
  const activeTasks = opts.includeTasks && opts.tasks?.length ? opts.tasks : [];

  // Build details block
  const detailLines: string[] = [
    `📚 ${opts.courseName}`,
    `⏰ ${timeRange}${tone === "casual_en" && mode === "course" ? "" : " WIB"}${duration ? ` (${duration})` : ""}`,
    `📍 ${roomText}`,
  ];

  if (showLecturer) {
    detailLines.push(`👨‍🏫 ${opts.lecturer!.trim()}`);
  }

  const detailsBlock = detailLines.join("\n");

  // 1. CASUAL ENGLISH (Default PJ Matkul style)
  if (tone === "casual_en") {
    const isToday = opts.timing === "today";
    const isScheduled = opts.timing === "scheduled";

    const timeWord = isToday
      ? "today"
      : isScheduled && (opts.dateStr || opts.dayName)
        ? `on ${[opts.dayName, opts.dateStr].filter(Boolean).join(", ")}`
        : "tomorrow";

    const introReady =
      mode === "exam"
        ? isToday
          ? `Hope you're doing well and ready for today's ${examBadge}! ✨`
          : `Hope you're doing well and ready for ${examBadge} ${isScheduled ? "" : "tomorrow"}! ✨`.replace(
              "  ",
              " ",
            )
        : isToday
          ? "Hope you're doing well and ready for today's class! ✨"
          : "Hope you're doing well and ready for tomorrow! ✨";

    const reminderHeader =
      mode === "exam"
        ? `Just a little reminder, ${timeWord} we have ${examBadge} for:`
        : `Just a little reminder, ${timeWord} we have:`;

    let taskBlock = "";
    if (activeTasks.length > 0) {
      const taskLines = activeTasks.map((t) => {
        const dl = formatShortDeadline(t.dueDate);
        return `• ${t.title}${dl ? ` (Deadline: ${dl})` : ""}`;
      });
      taskBlock = `\n\n📝 Task Reminder:\n${taskLines.join("\n")}`;
    }

    const prepLine =
      mode === "exam"
        ? "Don't forget to bring your Student ID (KTM), stationery, and arrive 15 minutes early, okay? 📖✨"
        : "Don't forget to prepare everything you need, okay? 📖✨";

    const seeYouLine = isToday
      ? mode === "exam"
        ? "Good luck and see you at the exam room, everyone! 👋"
        : "See you in class, everyone! 👋"
      : "See you tomorrow, everyone! 👋";

    return [
      `Hello, Members of Class ${kelasLabel}!`,
      "",
      "How are u today? 👋🏻",
      introReady,
      "",
      reminderHeader,
      "",
      detailsBlock + taskBlock,
      "",
      prepLine,
      seeYouLine,
    ].join("\n");
  }

  // 2. FORMAL BAHASA INDONESIA
  if (tone === "formal_id") {
    const isToday = opts.timing === "today";
    const isScheduled = opts.timing === "scheduled";
    const whenLabel = isToday
      ? "hari ini"
      : isScheduled && (opts.dayName || opts.dateStr)
        ? `pada ${[opts.dayName, opts.dateStr].filter(Boolean).join(", ")}`
        : "besok";

    const activityLabel = mode === "exam" ? `Ujian (${examBadge})` : "perkuliahan";

    let taskBlock = "";
    if (activeTasks.length > 0) {
      const taskLines = activeTasks.map((t) => {
        const dl = formatShortDeadline(t.dueDate);
        return `• ${t.title}${dl ? ` (Tenggat: ${dl})` : ""}`;
      });
      taskBlock = `\n\n📝 Pengingat Tugas:\n${taskLines.join("\n")}`;
    }

    const closingLine =
      mode === "exam"
        ? "Mohon hadir 15 menit sebelum ujian dimulai serta membawa KTM dan alat tulis masing-masing. Semangat dan semoga sukses! 🙏✨"
        : "Jangan lupa menyiapkan materi dan keperluan perkuliahan ya. Terima kasih dan sampai jumpa! ✨";

    return [
      `Halo rekan-rekan Kelas ${kelasLabel}! 👋🏻`,
      "",
      `Sekadar mengingatkan, ${whenLabel} kita memiliki jadwal ${activityLabel}:`,
      "",
      detailsBlock + taskBlock,
      "",
      closingLine,
    ].join("\n");
  }

  // 3. SUPER RINGKAS (CONCISE)
  const isToday = opts.timing === "today";
  const tagWhen = isToday ? "HARI INI" : opts.dateStr ? opts.dateStr.toUpperCase() : "BESOK";
  const headerTitle =
    mode === "exam"
      ? `*[REMINDER ${examBadge} KELAS ${kelasLabel} - ${tagWhen}]*`
      : `*[REMINDER KULIAH KELAS ${kelasLabel} - ${tagWhen}]*`;

  let taskBlock = "";
  if (activeTasks.length > 0) {
    const taskLines = activeTasks.map((t) => `• Tugas: ${t.title}`);
    taskBlock = `\n${taskLines.join("\n")}`;
  }

  const footerNote =
    mode === "exam" ? "\n📌 _Wajib bawa KTM & hadir 15 menit lebih awal._" : "";

  return `${headerTitle}\n${detailsBlock}${taskBlock}${footerNote}`;
}

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];

export function generateDaySummaryBroadcast(opts: DaySummaryBroadcastOptions): string {
  const mode = opts.mode ?? "course";
  const tone = opts.tone ?? "casual_en";
  const kelasLabel = opts.kelas?.trim() || "A";
  const examBadge = opts.examType ?? "UTS";
  const isToday = opts.timing === "today";
  const isScheduled = opts.timing === "scheduled";

  const formattedItems = opts.items
    .map((item, idx) => {
      const badge = NUMBER_EMOJIS[idx] ?? `${idx + 1}.`;
      const timeRange = `${formatDotTime(item.startTime)} - ${formatDotTime(item.endTime)}`;
      const roomText = item.room?.trim() || "TBA";
      const duration = mode === "exam" ? formatExamDuration(item.startTime, item.endTime) : "";
      const lines = [
        `${badge} 📚 ${item.courseName}`,
        `⏰ ${timeRange}${tone === "casual_en" && mode === "course" ? "" : " WIB"}${duration ? ` (${duration})` : ""}`,
        `📍 ${roomText}`,
      ];
      if (opts.includeLecturer && item.lecturer?.trim()) {
        lines.push(`👨‍🏫 ${item.lecturer.trim()}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  if (tone === "casual_en") {
    const timeWord = isToday
      ? "today"
      : isScheduled
        ? `on ${[opts.dayName, opts.dateStr].filter(Boolean).join(", ")}`
        : "tomorrow";

    const seeYouLine = isToday
      ? "See you in class, everyone! 👋"
      : "See you tomorrow, everyone! 👋";

    return [
      `Hello, Members of Class ${kelasLabel}!`,
      "",
      "How are u today? 👋🏻",
      isToday
        ? "Hope you're doing well and ready for today! ✨"
        : "Hope you're doing well and ready for tomorrow! ✨",
      "",
      mode === "exam"
        ? `Just a little reminder, ${timeWord} we have ${examBadge} sessions:`
        : `Just a little reminder, ${timeWord} we have:`,
      "",
      formattedItems,
      "",
      mode === "exam"
        ? "Don't forget to bring your Student ID (KTM) and prepare everything you need, okay? 📖✨"
        : "Don't forget to prepare everything you need, okay? 📖✨",
      seeYouLine,
    ].join("\n");
  }

  if (tone === "formal_id") {
    const whenLabel = isToday
      ? `hari ini (${opts.dayName})`
      : isScheduled
        ? `hari ${[opts.dayName, opts.dateStr].filter(Boolean).join(", ")}`
        : `besok (${opts.dayName})`;

    return [
      `Halo rekan-rekan Kelas ${kelasLabel}! 👋🏻`,
      "",
      `Berikut rangkuman jadwal ${mode === "exam" ? examBadge : "perkuliahan"} kita untuk ${whenLabel}:`,
      "",
      formattedItems,
      "",
      "Jangan lupa menyiapkan materi dan keperluan masing-masing ya. Semangat! ✨",
    ].join("\n");
  }

  const tagWhen = isToday ? "HARI INI" : opts.dayName.toUpperCase();
  return `*[JADWAL ${mode === "exam" ? examBadge : "KULIAH"} KELAS ${kelasLabel} - ${tagWhen}]*\n\n${formattedItems}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

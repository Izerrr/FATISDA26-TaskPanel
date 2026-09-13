import type { Course, TaskScope } from "@/types";

export interface ParsedTaskResult {
  title: string;
  description?: string;
  courseId: string;
  dueDate: string;
  scope: TaskScope;
  confidence: number;
}

const COURSE_KEYWORDS: Record<string, string[]> = {
  fisika: ["fisika"],
  alpro: ["algoritma", "pemrograman"],
  matdis: ["matematika diskrit", "diskrit"],
  kalkulus: ["kalkulus"],
  basdat: ["basis data", "database"],
  bd: ["basis data"],
  sisop: ["sistem operasi", "operating system"],
  os: ["sistem operasi"],
  jarkom: ["jaringan", "komputer"],
  pti: ["pengantar teknologi", "pti"],
  pbo: ["berorientasi objek", "pbo"],
  oop: ["berorientasi objek"],
  etika: ["etika", "profesi"],
  statistika: ["statistika", "probabilitas"],
  olahraga: ["olahraga", "kebugaran"],
  agama: ["agama", "pendidikan agama"],
  pancasila: ["pancasila"],
  kwu: ["kewirausahaan"],
};

const DAY_NAMES: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

export function parseTaskNaturalLanguage(input: string, courses: Course[]): ParsedTaskResult {
  const text = input.trim();
  const lower = text.toLowerCase();
  const now = new Date();

  // 1. Detect Scope
  let scope: TaskScope = "PERSONAL";
  if (/\b(tugas kelas|kelas|sekelas|angkatan|kelompok)\b/i.test(lower)) {
    scope = "CLASS";
  }

  // 2. Detect Course
  let matchedCourseId = "";

  // Priority A: direct course code or full name match
  for (const c of courses) {
    const nameLower = c.name.toLowerCase();
    const codeLower = c.code.toLowerCase();
    if (lower.includes(nameLower) || (codeLower.length > 2 && lower.includes(codeLower))) {
      matchedCourseId = c.id;
      break;
    }
  }

  // Priority B: fuzzy keyword matching
  if (!matchedCourseId) {
    for (const [kw, targets] of Object.entries(COURSE_KEYWORDS)) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
        const found = courses.find((c) => {
          const cName = c.name.toLowerCase();
          return targets.some((t) => cName.includes(t));
        });
        if (found) {
          matchedCourseId = found.id;
          break;
        }
      }
    }
  }

  // Priority C: partial word match on course names
  if (!matchedCourseId) {
    for (const c of courses) {
      const words = c.name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 4);
      if (words.some((w) => lower.includes(w))) {
        matchedCourseId = c.id;
        break;
      }
    }
  }

  // 3. Detect Time
  let hours = 23;
  let minutes = 59;

  // Format: "jam 2 siang", "jam 8 malam", "jam 10 pagi", "jam 4 sore"
  const timeWordMatch = lower.match(/jam\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?/i);
  if (timeWordMatch) {
    let h = parseInt(timeWordMatch[1], 10);
    const m = timeWordMatch[2] ? parseInt(timeWordMatch[2], 10) : 0;
    const period = timeWordMatch[3]?.toLowerCase();

    if (period === "siang" && h < 12) h += 12;
    if (period === "sore" && h < 12) h += 12;
    if (period === "malam" && h < 12) h += 12;
    if (period === "pagi" && h === 12) h = 0;

    hours = h;
    minutes = m;
  } else {
    // Format: "14:00", "23.59"
    const timeNumMatch = lower.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (timeNumMatch) {
      hours = parseInt(timeNumMatch[1], 10);
      minutes = parseInt(timeNumMatch[2], 10);
    }
  }

  // 4. Detect Day / Target Date
  const targetDate = new Date(now);
  let dayOffset: number | null = null;

  if (/\bhari ini\b/i.test(lower)) {
    dayOffset = 0;
  } else if (/\bbesok lusa\b/i.test(lower) || /\blusa\b/i.test(lower)) {
    dayOffset = 2;
  } else {
    // Check specific day names: "besok senin", "senin depan", "senin"
    for (const [dayName, dayIndex] of Object.entries(DAY_NAMES)) {
      if (new RegExp(`\\b(besok\\s+)?${dayName}(\\s+depan)?\\b`, "i").test(lower)) {
        const currentDay = now.getDay();
        let diff = (dayIndex - currentDay + 7) % 7;
        if (diff === 0) diff = 7; // Next week if same day
        dayOffset = diff;
        break;
      }
    }

    if (dayOffset === null && /\bbesok\b/i.test(lower)) {
      dayOffset = 1;
    }
  }

  if (dayOffset !== null) {
    targetDate.setDate(now.getDate() + dayOffset);
  } else {
    // Default: tomorrow
    targetDate.setDate(now.getDate() + 1);
  }

  targetDate.setHours(hours, minutes, 0, 0);

  // Format datetime-local string: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  const dueDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

  // 5. Clean Title
  let cleanTitle = text
    .replace(/\b(besok|lusa|hari ini|depan|minggu depan)\b/gi, "")
    .replace(/\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/gi, "")
    .replace(/jam\s*\d{1,2}(?:[:.]\d{2})?\s*(pagi|siang|sore|malam)?/gi, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, "")
    .replace(/\b(tugas kelas|tugas personal|personal|kelas|sekelas|angkatan)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanTitle) {
    cleanTitle = text;
  }

  // Capitalize clean title
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: cleanTitle,
    description: `Dibuat otomatis via AI Task Quick Parse dari: "${text}"`,
    courseId: matchedCourseId,
    dueDate: dueDateStr,
    scope,
    confidence: matchedCourseId ? 0.95 : 0.8,
  };
}

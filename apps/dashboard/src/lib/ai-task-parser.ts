import type { Course, TaskScope } from "@/types";
import { getWibParts, toWibInputValue, wibDate } from "./datetime";

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
  sisdig: ["sistem digital", "sisdig"],
  digital: ["sistem digital", "sisdig"],
  agama: ["agama", "pendidikan agama", "pai", "kristen", "katholik", "katolik", "hindu", "budha", "buddha", "konghucu"],
  pancasila: ["pancasila"],
  kwu: ["kewirausahaan"],
  imk: ["interaksi manusia", "komputer"],
  rpl: ["rekayasa perangkat lunak"],
  web: ["pemrograman web", "web"],
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

const MONTH_NAMES: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agt: 8,
  agu: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
  dec: 12,
};

const MONTH_PATTERN = Object.keys(MONTH_NAMES).join("|");

export function parseTaskNaturalLanguage(
  input: string,
  courses: Course[],
  now: Date = new Date()
): ParsedTaskResult {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Detect Scope (prioritize GROUP over CLASS)
  let scope: TaskScope = "PERSONAL";
  if (/\b(kerja\s+kelompok|tugas\s+kelompok|kelompok|tim|group)\b/i.test(lower)) {
    scope = "GROUP";
  } else if (/\b(tugas\s+kelas|kelas|sekelas|angkatan)\b/i.test(lower)) {
    scope = "CLASS";
  }

  // 2. Detect Course
  let matchedCourseId = "";

  for (const c of courses) {
    const nameLower = c.name.toLowerCase();
    const codeLower = c.code.toLowerCase();
    if (lower.includes(nameLower) || (codeLower.length > 2 && lower.includes(codeLower))) {
      matchedCourseId = c.id;
      break;
    }
  }

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

  const timeWordMatch = lower.match(/jam\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?/i);
  if (timeWordMatch) {
    let h = parseInt(timeWordMatch[1], 10);
    const m = timeWordMatch[2] ? parseInt(timeWordMatch[2], 10) : 0;
    const period = timeWordMatch[3]?.toLowerCase();

    if ((period === "siang" || period === "sore" || period === "malam") && h < 12) h += 12;
    if (period === "pagi" && h === 12) h = 0;

    hours = h;
    minutes = m;
  } else {
    const timeNumMatch = lower.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (timeNumMatch) {
      const parsedH = parseInt(timeNumMatch[1], 10);
      const parsedM = parseInt(timeNumMatch[2], 10);
      if (parsedH <= 23 && parsedM <= 59) {
        hours = parsedH;
        minutes = parsedM;
      }
    }
  }

  // 4. Detect Explicit or Relative Target Date (in WIB)
  const wibNow = getWibParts(now);
  const currentDay = wibNow.weekday === 7 ? 0 : wibNow.weekday;
  let targetDate: Date | null = null;
  const matchedDateFragments: string[] = [];

  // Explicit: "tanggal 20 nov", "20 november 2026"
  const monthRegex = new RegExp(`(?:\\b(?:tanggal|tgl)\\s+)?\\b(\\d{1,2})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`, "i");
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const dayNum = parseInt(monthMatch[1], 10);
    const monthNum = MONTH_NAMES[monthMatch[2].toLowerCase()];
    const explicitYear = monthMatch[3] ? parseInt(monthMatch[3], 10) : null;
    if (dayNum >= 1 && dayNum <= 31 && monthNum) {
      let yearNum = explicitYear ?? wibNow.year;
      if (!explicitYear && (monthNum < wibNow.month || (monthNum === wibNow.month && dayNum < wibNow.day))) {
        yearNum += 1;
      }
      targetDate = wibDate(yearNum, monthNum, dayNum, hours, minutes);
      matchedDateFragments.push(monthMatch[0]);
    }
  }

  // Explicit numeric: "20/11" or "20-11-2026" (only when not preceded by "jam ")
  if (!targetDate) {
    const slashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
    if (slashMatch) {
      const dayNum = parseInt(slashMatch[1], 10);
      const monthNum = parseInt(slashMatch[2], 10);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        let yearNum = slashMatch[3]
          ? slashMatch[3].length === 2
            ? 2000 + parseInt(slashMatch[3], 10)
            : parseInt(slashMatch[3], 10)
          : wibNow.year;
        if (!slashMatch[3] && (monthNum < wibNow.month || (monthNum === wibNow.month && dayNum < wibNow.day))) {
          yearNum += 1;
        }
        targetDate = wibDate(yearNum, monthNum, dayNum, hours, minutes);
        matchedDateFragments.push(slashMatch[0]);
      }
    }
  }

  // Explicit day of current/next month: "tgl 25", "tanggal 5"
  if (!targetDate) {
    const tglMatch = text.match(/\b(?:tanggal|tgl)\s*(\d{1,2})\b/i);
    if (tglMatch) {
      const dayNum = parseInt(tglMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        const nextMonth = dayNum < wibNow.day ? wibNow.month + 1 : wibNow.month;
        targetDate = wibDate(wibNow.year, nextMonth, dayNum, hours, minutes);
        matchedDateFragments.push(tglMatch[0]);
      }
    }
  }

  if (!targetDate) {
    let dayOffset: number | null = null;
    if (/\bhari ini\b/i.test(lower)) {
      dayOffset = 0;
    } else if (/\bbesok lusa\b/i.test(lower) || /\blusa\b/i.test(lower)) {
      dayOffset = 2;
    } else {
      for (const [dayName, dayIndex] of Object.entries(DAY_NAMES)) {
        if (new RegExp(`\\b(besok\\s+)?${dayName}(\\s+depan)?\\b`, "i").test(lower)) {
          let diff = (dayIndex - currentDay + 7) % 7;
          if (diff === 0) diff = 7;
          dayOffset = diff;
          break;
        }
      }

      if (dayOffset === null && /\bbesok\b/i.test(lower)) {
        dayOffset = 1;
      }
    }

    const finalOffset = dayOffset !== null ? dayOffset : 1;
    targetDate = wibDate(wibNow.year, wibNow.month, wibNow.day + finalOffset, hours, minutes);
  }

  const dueDateStr = toWibInputValue(targetDate);

  // 5. Clean Title
  let cleanTitle = text;
  for (const frag of matchedDateFragments) {
    cleanTitle = cleanTitle.replace(frag, " ");
  }
  cleanTitle = cleanTitle
    .replace(/\b(besok|lusa|hari ini|depan|minggu depan|tanggal|tgl)\b/gi, "")
    .replace(/\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/gi, "")
    .replace(/jam\s*\d{1,2}(?:[:.]\d{2})?\s*(pagi|siang|sore|malam)?/gi, "")
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, "")
    .replace(/\b(kerja\s+kelompok|tugas\s+kelompok|tugas\s+kelas|tugas\s+personal|kelompok|group|personal|kelas|sekelas|angkatan)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanTitle) {
    cleanTitle = text;
  }

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

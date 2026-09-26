import type { Kelas, Prodi } from "@prisma/client";

export interface ScheduleSlotInfo {
  session: number;
  startTime: string;
  endTime: string;
}

export const STANDARD_SESSIONS: Record<number, { start: string; end: string }> = {
  1: { start: "07:30", end: "08:20" },
  2: { start: "08:25", end: "09:15" },
  3: { start: "09:20", end: "10:10" },
  4: { start: "10:15", end: "11:05" },
  5: { start: "11:10", end: "12:00" },
  6: { start: "13:00", end: "13:50" },
  7: { start: "13:55", end: "14:45" },
  8: { start: "15:30", end: "16:20" },
  9: { start: "16:25", end: "17:15" },
  10: { start: "18:00", end: "18:50" },
};

export const DAY_NUMBER_MAP: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
};

export const NUMBER_TO_DAY_NAME: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

export interface MatchedFreeSlot {
  dayName: string;
  dayNumber: number;
  startSession: number;
  endSession: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
  classesFree: string[];
}

export interface ClassBusySummary {
  kelas: string;
  dayName: string;
  occupiedSessions: number[];
  lectureCount: number;
  courses: string[];
}

export interface QueryTargetGroup {
  prodi: Prodi;
  semester: number;
  classes: string[];
  label: string;
}

export interface AiMatchResult {
  query: string;
  intent: "MUTUAL_FREE_TIME" | "SINGLE_CLASS_FREE" | "ALL_CLASSES_FREE" | "BUSIEST_DAYS" | "GENERAL_SCHEDULE";
  prodi: Prodi;
  targetClasses: string[];
  targetSemester: number;
  targetDay: string | null;
  targetGroups: QueryTargetGroup[];
  isCrossProdi: boolean;
  summary: string;
  markdownAnswer: string;
  freeSlots: MatchedFreeSlot[];
  busySummaries: ClassBusySummary[];
  recommendations: string[];
  taskInsights?: string[];
}

export interface RawScheduleInput {
  prodi: Prodi;
  kelas: string | null;
  semester: number | null;
  day: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  courseName?: string | null;
  sourceSlots?: number[];
}

export interface TaskInput {
  title: string;
  dueDate: Date | string | null;
  kelas?: string | null;
  courseName?: string | null;
}

/**
 * Normalisasi waktu HH:MM ke menit sejak 00:00
 */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Ekstraksi sesi dari waktu kuliah jika sourceSlots tidak terdefinisi
 */
function inferSessionsFromTime(startTime: string, endTime: string): number[] {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const sessions: number[] = [];

  for (let s = 1; s <= 10; s++) {
    const slot = STANDARD_SESSIONS[s];
    if (!slot) continue;
    const slotStartM = timeToMinutes(slot.start);
    const slotEndM = timeToMinutes(slot.end);

    // Cek irisan waktu
    if (Math.max(startM, slotStartM) < Math.min(endM, slotEndM)) {
      sessions.push(s);
    }
  }

  return sessions.length > 0 ? sessions : [1];
}

export function detectProdiInText(text: string, fallback: Prodi | null = null): Prodi | null {
  const t = text.toLowerCase();
  if (t.includes("psdku") || t.includes("kebumen")) return "INFORMATIKA_PSDKU_KEBUMEN";
  if (t.includes("sains data") || t.includes("sadat") || /\bsd\b/.test(t)) return "SAINS_DATA";
  if (t.includes("infor") || t.includes("informatika") || /\bif\b/.test(t)) return "INFORMATIKA";
  return fallback;
}

export function detectSemesterInText(text: string, fallback: number = 1): number {
  const m = text.match(/\b(?:semester|smt|smstr|sem|s)\s*(\d)\b/i) || text.match(/\b(\d)\s*(?:semester|smt)\b/i);
  if (m) {
    const s = parseInt(m[1], 10);
    if (s >= 1 && s <= 8) return s;
  }
  return fallback;
}

export function detectClassesInText(text: string): string[] {
  const classes = new Set<string>();
  const t = text.toLowerCase();

  // Multi class like "kelas a b", "kelas a dan b", "kelas a, b", "kelas a b c"
  const multiClassRegex = /\b(?:kelas|kls)\s+([a-d])(?:\s*(?:dan|sama|&|\+|,|\s)\s*([a-d]))+/gi;
  let match: RegExpExecArray | null;
  while ((match = multiClassRegex.exec(t)) !== null) {
    const full = match[0];
    const afterKeyword = full.replace(/^(?:kelas|kls)\s+/i, "");
    const tokens = afterKeyword.match(/\b[a-d]\b/gi);
    if (tokens) {
      tokens.forEach((tok) => classes.add(tok.toUpperCase()));
    }
  }

  // Explicit "kelas a", "kls b"
  const explicit = /\b(?:kelas|kls)\s+([a-d])\b/gi;
  while ((match = explicit.exec(t)) !== null) {
    classes.add(match[1].toUpperCase());
  }

  // Preceded by conjunction
  const standalone = /\b(?:dan|sama|&|\+|,)\s+([a-d])\b/gi;
  while ((match = standalone.exec(t)) !== null) {
    classes.add(match[1].toUpperCase());
  }

  // All classes keyword
  if (/\b(?:semua kelas|seluruh kelas|angkatan|gabungan)\b/i.test(t)) {
    classes.add("A");
    classes.add("B");
    classes.add("C");
    classes.add("D");
  }

  return Array.from(classes).sort();
}

/**
 * Parser Intent & Entitas berbasis aturan NLP bahasa Indonesia (mendukung Lintas Prodi)
 */
export function parseQueryEntities(query: string, defaultProdi: Prodi = "INFORMATIKA", defaultSemester: number = 1) {
  const q = query.toLowerCase();

  // 1. Deteksi Hari
  let targetDay: string | null = null;
  for (const day of ["senin", "selasa", "rabu", "kamis", "jumat"]) {
    if (q.includes(day)) {
      targetDay = day;
      break;
    }
  }

  // 2. Global Semester & Prodi fallback
  const globalSem = detectSemesterInText(q, defaultSemester);
  const globalProdi = detectProdiInText(q, defaultProdi) || defaultProdi;

  // 3. Deteksi Multi-Target / Cross-Prodi clauses
  const splitRegex = /\b(?:sama|dengan|vs|versus)\b|\b(?:dan)\s+(?=(?:kelas|kls|infor|sains|psdku))/i;
  const rawClauses = q.split(splitRegex).map((c) => c.trim()).filter(Boolean);

  let targetGroups: QueryTargetGroup[] = [];

  if (rawClauses.length > 1) {
    for (const clause of rawClauses) {
      const p = detectProdiInText(clause, null);
      const sem = detectSemesterInText(clause, globalSem);
      const cls = detectClassesInText(clause);
      if (cls.length > 0 || p) {
        const prodiToUse = p || globalProdi;
        const classesToUse = cls.length > 0 ? cls : ["A"];
        const prodiLabel = prodiToUse === "SAINS_DATA" ? "Sains Data" : prodiToUse === "INFORMATIKA_PSDKU_KEBUMEN" ? "Infor PSDKU" : "Informatika";
        targetGroups.push({
          prodi: prodiToUse,
          semester: sem,
          classes: classesToUse,
          label: `${prodiLabel} Smt ${sem} (Kls ${classesToUse.join(", ")})`,
        });
      }
    }
  }

  // Fallback single group
  if (targetGroups.length < 2) {
    const cls = detectClassesInText(q);
    const classesToUse = cls.length > 0 ? cls : (q.includes("bareng") || q.includes("sama") || q.includes("gabung") ? ["A", "B"] : ["A"]);
    const prodiLabel = globalProdi === "SAINS_DATA" ? "Sains Data" : globalProdi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Infor PSDKU" : "Informatika";
    targetGroups = [
      {
        prodi: globalProdi,
        semester: globalSem,
        classes: classesToUse,
        label: `${prodiLabel} Smt ${globalSem} (Kls ${classesToUse.join(", ")})`,
      },
    ];
  }

  // Cek apakah lintas prodi
  const uniqueProdis = Array.from(new Set(targetGroups.map((g) => g.prodi)));
  const isCrossProdi = uniqueProdis.length > 1;

  // Flattened target classes & semester for backwards compatibility
  const targetClasses = Array.from(new Set(targetGroups.flatMap((g) => g.classes))).sort();
  const targetSemester = targetGroups[0]?.semester || globalSem;
  const primaryProdi = targetGroups[0]?.prodi || globalProdi;

  // Tentukan Intent
  let intent: AiMatchResult["intent"] = "MUTUAL_FREE_TIME";
  if (!isCrossProdi && targetClasses.length === 1) {
    intent = "SINGLE_CLASS_FREE";
  } else if (!isCrossProdi && targetClasses.length >= 4) {
    intent = "ALL_CLASSES_FREE";
  } else if (q.includes("padat") || q.includes("santai") || q.includes("sibuk")) {
    intent = "BUSIEST_DAYS";
  }

  return {
    classes: targetClasses,
    semester: targetSemester,
    day: targetDay,
    prodi: primaryProdi,
    targetGroups,
    isCrossProdi,
    intent,
  };
}

/**
 * Core Engine: Menghitung jam kosong dan membandingkan jadwal (mendukung Lintas Prodi)
 */
export function analyzeScheduleAndFreeTime(
  query: string,
  allSchedules: RawScheduleInput[],
  tasks: TaskInput[] = [],
  userProdi: Prodi = "INFORMATIKA",
  userSemester: number = 1,
): AiMatchResult {
  const parsed = parseQueryEntities(query, userProdi, userSemester);

  // Filter jadwal sesuai grup yang ditarget
  const relevantSchedules = allSchedules.filter((s) => {
    return parsed.targetGroups.some((g) => g.prodi === s.prodi && g.semester === s.semester && g.classes.includes(s.kelas as string));
  });

  // Tentukan hari yang diteliti (1..5 atau spesifik 1 hari)
  const daysToInspect = parsed.day && DAY_NUMBER_MAP[parsed.day] ? [DAY_NUMBER_MAP[parsed.day]] : [1, 2, 3, 4, 5];

  const freeSlots: MatchedFreeSlot[] = [];
  const busySummaries: ClassBusySummary[] = [];

  // Hitung jadwal sibuk per grup target per hari
  for (const dayNum of daysToInspect) {
    const dayName = NUMBER_TO_DAY_NAME[dayNum] || `Hari ${dayNum}`;

    // Kumpulkan sesi sibuk per grup target
    const occupiedPerGroup: Set<number>[] = [];

    for (const group of parsed.targetGroups) {
      const groupSchedules = relevantSchedules.filter(
        (s) => s.prodi === group.prodi && s.semester === group.semester && group.classes.includes(s.kelas as string) && s.day === dayNum,
      );

      const groupOccupied = new Set<number>();
      const coursesSet = new Set<string>();

      for (const s of groupSchedules) {
        if (s.courseName) coursesSet.add(s.courseName);
        const sessList = s.sourceSlots && s.sourceSlots.length > 0 ? s.sourceSlots : inferSessionsFromTime(s.startTime, s.endTime);
        sessList.forEach((sn) => groupOccupied.add(sn));
      }

      busySummaries.push({
        kelas: group.label,
        dayName,
        occupiedSessions: Array.from(groupOccupied).sort((a, b) => a - b),
        lectureCount: coursesSet.size,
        courses: Array.from(coursesSet),
      });

      occupiedPerGroup.push(groupOccupied);
    }

    // Irisan jam kosong bersama: sesi yang TIDAK ada di salah satu grup pun
    const allOccupied = new Set<number>();
    occupiedPerGroup.forEach((occ) => occ.forEach((sn) => allOccupied.add(sn)));

    const mutuallyFreeSessions: number[] = [];
    for (let s = 1; s <= 10; s++) {
      if (!allOccupied.has(s)) {
        mutuallyFreeSessions.push(s);
      }
    }

    // Kelompokkan sesi berurutan menjadi blok waktu
    if (mutuallyFreeSessions.length > 0) {
      let blockStart = mutuallyFreeSessions[0];
      let blockEnd = mutuallyFreeSessions[0];

      for (let i = 1; i < mutuallyFreeSessions.length; i++) {
        const curr = mutuallyFreeSessions[i];
        if (curr === blockEnd + 1) {
          blockEnd = curr;
        } else {
          addBlock(freeSlots, dayName, dayNum, blockStart, blockEnd, parsed.targetGroups);
          blockStart = curr;
          blockEnd = curr;
        }
      }
      addBlock(freeSlots, dayName, dayNum, blockStart, blockEnd, parsed.targetGroups);
    }
  }

  function addBlock(slots: MatchedFreeSlot[], dName: string, dNum: number, startSess: number, endSess: number, groups: QueryTargetGroup[]) {
    const startStr = STANDARD_SESSIONS[startSess]?.start || "07:30";
    const endStr = STANDARD_SESSIONS[endSess]?.end || "18:50";
    const duration = timeToMinutes(endStr) - timeToMinutes(startStr);

    const classesFree = parsed.isCrossProdi
      ? groups.map((g) => g.label)
      : Array.from(new Set(groups.flatMap((g) => g.classes))).sort();

    slots.push({
      dayName: dName,
      dayNumber: dNum,
      startSession: startSess,
      endSession: endSess,
      startTime: startStr,
      endTime: endStr,
      durationMinutes: duration,
      label: startSess === endSess ? `Sesi ${startSess}` : `Sesi ${startSess} - ${endSess}`,
      classesFree,
    });
  }

  // Rekomendasi Pintar
  const recommendations: string[] = [];
  const longSlots = freeSlots.filter((f) => f.durationMinutes >= 90);
  if (longSlots.length > 0) {
    const top = longSlots[0];
    recommendations.push(`Slot terbaik untuk diskusi/rapat bersama adalah hari ${top.dayName} jam ${top.startTime} - ${top.endTime} WIB (${top.label}, durasi ${top.durationMinutes} menit).`);
  } else if (freeSlots.length > 0) {
    const top = freeSlots[0];
    recommendations.push(`Tersedia slot luang pada hari ${top.dayName} jam ${top.startTime} - ${top.endTime} WIB (${top.label}).`);
  } else {
    recommendations.push(`Jadwal perkuliahan cukup padat pada hari yang dipilih. Disarankan menggunakan waktu di atas jam 17:15 WIB atau akhir pekan.`);
  }

  // Cek korelasi tugas
  const taskInsights: string[] = [];
  if (tasks.length > 0) {
    const pendingTasks = tasks.slice(0, 3);
    for (const t of pendingTasks) {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const dayStr = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
        taskInsights.push(`Tugas [${t.title}] deadline pada ${dayStr}. Manfaatkan slot luang sebelum hari tersebut.`);
      }
    }
  }

  // Format ringkasan eksekutif
  const targetDesc = parsed.isCrossProdi
    ? parsed.targetGroups.map((g) => g.label).join(" dan ")
    : `${parsed.targetGroups.map((g) => `Kelas ${g.classes.join(" & ")}`).join(", ")} (${parsed.targetGroups[0]?.label})`;

  const summary =
    freeSlots.length > 0
      ? `Ditemukan ${freeSlots.length} slot waktu luang bersama untuk ${targetDesc}.`
      : `Tidak ditemukan slot luang bersama yang cocok untuk ${targetDesc} pada hari yang diteliti.`;

  // Susun Jawaban Markdown yang bersih dan terstruktur
  let markdownAnswer = "";
  if (parsed.isCrossProdi || parsed.targetGroups.length > 1) {
    markdownAnswer += `### 🤝 Analisis Jam Kosong Lintas Target\n`;
    markdownAnswer += `Target Analisis: ${parsed.targetGroups.map((g) => g.label).join(" ✕ ")}\n\n`;

    if (freeSlots.length === 0) {
      markdownAnswer += `Tidak ditemukan slot kosong yang saling beririsan antara kelompok tersebut pada hari perkuliahan yang diteliti. Jadwal kedua kelompok saling bersinggungan.\n\n`;
    } else {
      markdownAnswer += `Berdasarkan kalkulasi jadwal perkuliahan resmi, berikut adalah waktu ketika seluruh kelompok target **sama-sama TIDAK memiliki jadwal kuliah** (Free):\n\n`;
      for (const slot of freeSlots) {
        markdownAnswer += `- 🟢 **${slot.dayName}**: Jam **${slot.startTime} - ${slot.endTime} WIB** (${slot.label}, ~${slot.durationMinutes} menit)\n`;
      }
      markdownAnswer += `\n💡 **Rekomendasi Waktu Rapat/Diskusi:**\n`;
      for (const rec of recommendations) {
        markdownAnswer += `> ${rec}\n`;
      }
    }
  } else {
    const g = parsed.targetGroups[0];
    markdownAnswer += `### 📅 Jadwal Waktu Luang (${g.label})\n\n`;
    if (freeSlots.length === 0) {
      markdownAnswer += `Jadwal perkuliahan sangat padat dari pagi hingga sore pada hari yang dipilih.\n\n`;
    } else {
      markdownAnswer += `Berikut adalah sesi dan jam luang perkuliahan:\n\n`;
      for (const slot of freeSlots) {
        markdownAnswer += `- 🕒 **${slot.dayName}**: Jam **${slot.startTime} - ${slot.endTime} WIB** (${slot.label})\n`;
      }
    }
  }

  if (taskInsights.length > 0) {
    markdownAnswer += `\n#### 📌 Pengingat Tugas Terkait:\n`;
    for (const ti of taskInsights) {
      markdownAnswer += `- ⚡ ${ti}\n`;
    }
  }

  return {
    query,
    intent: parsed.intent,
    prodi: parsed.prodi,
    targetClasses: parsed.classes,
    targetSemester: parsed.semester,
    targetDay: parsed.day,
    targetGroups: parsed.targetGroups,
    isCrossProdi: parsed.isCrossProdi,
    summary,
    markdownAnswer,
    freeSlots,
    busySummaries,
    recommendations,
    taskInsights,
  };
}

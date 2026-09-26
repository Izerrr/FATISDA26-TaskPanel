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

export interface AiMatchResult {
  query: string;
  intent: "MUTUAL_FREE_TIME" | "SINGLE_CLASS_FREE" | "ALL_CLASSES_FREE" | "BUSIEST_DAYS" | "GENERAL_SCHEDULE";
  prodi: Prodi;
  targetClasses: string[];
  targetSemester: number;
  targetDay: string | null;
  summary: string;
  markdownAnswer: string;
  freeSlots: MatchedFreeSlot[];
  busySummaries: ClassBusySummary[];
  recommendations: string[];
  taskInsights?: string[];
}

interface RawScheduleInput {
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

interface TaskInput {
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

/**
 * Parser Intent & Entitas berbasis aturan NLP bahasa Indonesia
 */
export function parseQueryEntities(query: string, defaultProdi: Prodi, defaultSemester: number = 1) {
  const q = query.toLowerCase();

  // 1. Deteksi Kelas
  const detectedClasses = new Set<string>();

  // Pola gabungan seperti: "kelas a dan b", "kelas a sama b", "kelas a & b", "a dan b"
  const multiClassMatch = q.match(/\b(?:kelas|kls)?\s*([a-e])\s*(?:dan|sama|&|\+|,)\s*(?:kelas|kls)?\s*([a-e])\b/i);
  if (multiClassMatch) {
    detectedClasses.add(multiClassMatch[1].toUpperCase());
    detectedClasses.add(multiClassMatch[2].toUpperCase());
  }

  // Pola eksplisit: "kelas a", "kls b"
  const classRegex = /\b(?:kelas|kls)\s*([a-e])\b/gi;
  let match: RegExpExecArray | null;
  while ((match = classRegex.exec(q)) !== null) {
    detectedClasses.add(match[1].toUpperCase());
  }

  // Pola sambungan: "dan b" / "sama b" setelah ada kelas terdeteksi
  const andMatch = q.match(/(?:dan|sama|&|\+)\s*(?:kelas|kls)?\s*([a-e])\b/i);
  if (andMatch) {
    detectedClasses.add(andMatch[1].toUpperCase());
  }

  // Cek kata kunci angkatan/semua kelas
  if (/\b(?:semua kelas|seluruh kelas|angkatan|gabungan)\b/i.test(q)) {
    detectedClasses.add("A");
    detectedClasses.add("B");
    detectedClasses.add("C");
    detectedClasses.add("D");
  }

  // Jika tetap tidak terdeteksi, default bandingkan Kelas A & B jika ada kata "bareng/sama", atau default Kelas A
  if (detectedClasses.size === 0) {
    if (q.includes("bareng") || q.includes("sama") || q.includes("gabung") || q.includes("rapat")) {
      detectedClasses.add("A");
      detectedClasses.add("B");
    } else {
      detectedClasses.add("A");
    }
  }

  // 2. Deteksi Semester
  let targetSemester = defaultSemester;
  const semMatch = q.match(/\b(?:semester|smt|smstr|sem|s)\s*(\d)\b/i) || q.match(/\b(\d)\s*(?:semester|smt)\b/i);
  if (semMatch) {
    const sem = parseInt(semMatch[1], 10);
    if (sem >= 1 && sem <= 8) targetSemester = sem;
  }

  // 3. Deteksi Hari
  let targetDay: string | null = null;
  for (const day of ["senin", "selasa", "rabu", "kamis", "jumat"]) {
    if (q.includes(day)) {
      targetDay = day;
      break;
    }
  }

  // 4. Deteksi Prodi (prioritaskan PSDKU terlebih dahulu agar 'sd' tidak memicu Sains Data)
  let prodi = defaultProdi;
  if (q.includes("psdku") || q.includes("kebumen")) {
    prodi = "INFORMATIKA_PSDKU_KEBUMEN";
  } else if (q.includes("sains data") || q.includes("sadat") || /\bsd\b/.test(q)) {
    prodi = "SAINS_DATA";
  } else if (q.includes("infor") || q.includes("informatika") || /\bif\b/.test(q)) {
    prodi = "INFORMATIKA";
  }

  // 5. Tentukan Intent
  let intent: AiMatchResult["intent"] = "MUTUAL_FREE_TIME";
  if (detectedClasses.size === 1) {
    intent = "SINGLE_CLASS_FREE";
  } else if (detectedClasses.size >= 4) {
    intent = "ALL_CLASSES_FREE";
  } else if (q.includes("padat") || q.includes("santai") || q.includes("sibuk")) {
    intent = "BUSIEST_DAYS";
  }

  return {
    classes: Array.from(detectedClasses).sort(),
    semester: targetSemester,
    day: targetDay,
    prodi,
    intent,
  };
}

/**
 * Core Engine: Menghitung jam kosong dan membandingkan jadwal
 */
export function analyzeScheduleAndFreeTime(query: string, allSchedules: RawScheduleInput[], tasks: TaskInput[] = [], userProdi: Prodi = "INFORMATIKA", userSemester: number = 1): AiMatchResult {
  const parsed = parseQueryEntities(query, userProdi, userSemester);
  const targetDays = parsed.day ? [DAY_NUMBER_MAP[parsed.day]] : [1, 2, 3, 4, 5];

  // Filter jadwal sesuai prodi dan semester target
  const relevantSchedules = allSchedules.filter((s) => s.prodi === parsed.prodi && s.semester === parsed.semester);

  const busySummaries: ClassBusySummary[] = [];
  const freeSlots: MatchedFreeSlot[] = [];

  // Hitung jadwal per hari
  for (const dayNum of targetDays) {
    const dayName = NUMBER_TO_DAY_NAME[dayNum] || `Hari ${dayNum}`;

    // Map: Kelas -> Set sesi terisi (1-10)
    const classOccupiedMap = new Map<string, Set<number>>();
    const classCourseMap = new Map<string, Set<string>>();

    for (const k of parsed.classes) {
      classOccupiedMap.set(k, new Set());
      classCourseMap.set(k, new Set());
    }

    const daySchedules = relevantSchedules.filter((s) => s.day === dayNum);

    for (const sched of daySchedules) {
      if (!sched.kelas) continue;
      const k = sched.kelas.toUpperCase();
      if (!classOccupiedMap.has(k)) continue;

      const sessions = sched.sourceSlots && sched.sourceSlots.length > 0 ? sched.sourceSlots : inferSessionsFromTime(sched.startTime, sched.endTime);

      for (const sess of sessions) {
        if (sess >= 1 && sess <= 10) {
          classOccupiedMap.get(k)!.add(sess);
        }
      }

      if (sched.courseName) {
        classCourseMap.get(k)!.add(sched.courseName);
      }
    }

    // Catat busy summary per kelas
    for (const k of parsed.classes) {
      const occupied = Array.from(classOccupiedMap.get(k) || []).sort((a, b) => a - b);
      busySummaries.push({
        kelas: k,
        dayName,
        occupiedSessions: occupied,
        lectureCount: occupied.length,
        courses: Array.from(classCourseMap.get(k) || []),
      });
    }

    // Cari sesi di mana SEMUA kelas target free (atau kelas tunggal free)
    const mutuallyFreeSessions: number[] = [];
    for (let s = 1; s <= 10; s++) {
      const isAnyOccupied = parsed.classes.some((k) => classOccupiedMap.get(k)!.has(s));
      if (!isAnyOccupied) {
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
          // Tutup blok sebelumnya
          addBlock(freeSlots, dayName, dayNum, blockStart, blockEnd, parsed.classes);
          blockStart = curr;
          blockEnd = curr;
        }
      }
      addBlock(freeSlots, dayName, dayNum, blockStart, blockEnd, parsed.classes);
    }
  }

  function addBlock(slots: MatchedFreeSlot[], dName: string, dNum: number, startSess: number, endSess: number, classes: string[]) {
    const startStr = STANDARD_SESSIONS[startSess]?.start || "07:30";
    const endStr = STANDARD_SESSIONS[endSess]?.end || "18:50";
    const duration = timeToMinutes(endStr) - timeToMinutes(startStr);

    slots.push({
      dayName: dName,
      dayNumber: dNum,
      startSession: startSess,
      endSession: endSess,
      startTime: startStr,
      endTime: endStr,
      durationMinutes: duration,
      label: startSess === endSess ? `Sesi ${startSess}` : `Sesi ${startSess} - ${endSess}`,
      classesFree: [...classes],
    });
  }

  // Rekomendasi Pintar
  const recommendations: string[] = [];
  const longSlots = freeSlots.filter((f) => f.durationMinutes >= 90);
  if (longSlots.length > 0) {
    const top = longSlots[0];
    recommendations.push(`Slot terbaik untuk diskusi/rapat bersama adalah hari **${top.dayName}** jam **${top.startTime} - ${top.endTime} WIB** (${top.label}, durasi ${top.durationMinutes} menit).`);
  } else if (freeSlots.length > 0) {
    const top = freeSlots[0];
    recommendations.push(`Tersedia slot luang pada hari **${top.dayName}** jam **${top.startTime} - ${top.endTime} WIB** (${top.label}).`);
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
        taskInsights.push(`Tugas **${t.title}** deadline pada **${dayStr}**. Manfaatkan slot luang sebelum hari tersebut.`);
      }
    }
  }

  // Susun Ringkasan Eksekutif & Jawaban Natural Markdown
  const classListStr = parsed.classes.map((c) => `Kelas ${c}`).join(" & ");
  const prodiLabel = parsed.prodi === "SAINS_DATA" ? "Sains Data" : parsed.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Informatika";

  let markdownAnswer = "";
  if (parsed.classes.length > 1) {
    markdownAnswer += `### 🤝 Analisis Jam Kosong Bersama (${classListStr} — ${prodiLabel} Smt ${parsed.semester})\n\n`;
    if (freeSlots.length === 0) {
      markdownAnswer += `Tidak ditemukan slot kosong yang sama antara **${classListStr}** pada hari perkuliahan yang diteliti. Kedua kelas memiliki jam kuliah yang saling bersinggungan.\n\n`;
    } else {
      markdownAnswer += `Berdasarkan jadwal perkuliahan resmi, berikut adalah waktu di mana **${classListStr} sama-sama TIDAK memiliki kelas** (Free):\n\n`;
      for (const slot of freeSlots) {
        markdownAnswer += `- 🟢 **${slot.dayName}**: Jam **${slot.startTime} - ${slot.endTime} WIB** (${slot.label}, ~${slot.durationMinutes} menit)\n`;
      }
      markdownAnswer += `\n💡 **Rekomendasi Rapat/Belajar Bersama:**\n`;
      for (const rec of recommendations) {
        markdownAnswer += `> ${rec}\n`;
      }
    }
  } else {
    const k = parsed.classes[0];
    markdownAnswer += `### 📅 Jadwal Waktu Luang (Kelas ${k} — ${prodiLabel} Smt ${parsed.semester})\n\n`;
    if (freeSlots.length === 0) {
      markdownAnswer += `Jadwal **Kelas ${k}** sangat padat dari pagi hingga sore pada hari yang dipilih.\n\n`;
    } else {
      markdownAnswer += `Berikut adalah sesi dan jam luang untuk **Kelas ${k}**:\n\n`;
      for (const slot of freeSlots) {
        markdownAnswer += `- 🕒 **${slot.dayName}**: Jam **${slot.startTime} - ${slot.endTime} WIB** (${slot.label})\n`;
      }
    }
  }

  if (taskInsights.length > 0) {
    markdownAnswer += `\n#### 📌 Pengingat Tugas Terkait:\n`;
    for (const t of taskInsights) {
      markdownAnswer += `- ${t}\n`;
    }
  }

  return {
    query,
    intent: parsed.intent,
    prodi: parsed.prodi,
    targetClasses: parsed.classes,
    targetSemester: parsed.semester,
    targetDay: parsed.day,
    summary: `Ditemukan ${freeSlots.length} slot waktu luang untuk ${classListStr} (${prodiLabel} Smt ${parsed.semester}).`,
    markdownAnswer,
    freeSlots,
    busySummaries,
    recommendations,
    taskInsights,
  };
}

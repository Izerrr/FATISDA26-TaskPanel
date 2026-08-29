import type { ParsedScheduleEntry } from "./types";

export interface NormalizedScheduleEntry {
  prodi: ParsedScheduleEntry["prodi"];

  day: ParsedScheduleEntry["day"];

  startTime: string | null;
  endTime: string | null;

  room: string;

  courseName: string;
  semester: number;

  classCode: ParsedScheduleEntry["classCode"];
  rawClassCode: string | null;

  markers: string[];

  sourceSlots: number[];

  lecturer: string | null;
}

type ScheduleGroupKey = string;

function getGroupKey(entry: ParsedScheduleEntry): ScheduleGroupKey {
  return [entry.prodi, entry.day, entry.room, entry.courseName, entry.semester, entry.classCode ?? "UNKNOWN", entry.rawClassCode].join("::");
}

function createNormalizedEntry(entries: ParsedScheduleEntry[]): NormalizedScheduleEntry {
  const first = entries[0];
  const last = entries[entries.length - 1];

  const markers = Array.from(new Set(entries.flatMap((entry) => entry.markers)));

  return {
    prodi: first.prodi,

    day: first.day,

    startTime: first.startTime,

    endTime: last.endTime,

    room: first.room,

    courseName: first.courseName,

    semester: first.semester,

    classCode: first.classCode,

    rawClassCode: first.rawClassCode,

    markers,

    sourceSlots: entries.map((entry) => entry.session),

    lecturer: first.lecturer,
  };
}

function mergeGroup(entries: ParsedScheduleEntry[]): NormalizedScheduleEntry[] {
  if (entries.length === 0) {
    return [];
  }

  const sorted = [...entries].sort((a, b) => a.session - b.session);

  const result: NormalizedScheduleEntry[] = [];

  let current: ParsedScheduleEntry[] = [sorted[0]];

  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];

    const entry = sorted[index];

    /**
     * Hanya merge jika session berurutan.
     *
     * Contoh:
     *
     * 6 → 7 → 8
     *
     * menjadi satu blok.
     *
     * Tetapi:
     *
     * 6 → 8
     *
     * tetap menjadi dua blok.
     */
    if (entry.session === previous.session + 1) {
      current.push(entry);
      continue;
    }

    result.push(createNormalizedEntry(current));

    current = [entry];
  }

  result.push(createNormalizedEntry(current));

  return result;
}

export function normalizeScheduleEntries(entries: ParsedScheduleEntry[]): NormalizedScheduleEntry[] {
  /**
   * STEP 1
   *
   * Kelompokkan berdasarkan identitas jadwal.
   *
   * Kita sengaja tidak mencampur:
   *
   * - mata kuliah berbeda
   * - kelas berbeda
   * - semester berbeda
   * - ruangan berbeda
   * - prodi berbeda
   */
  const groups = new Map<ScheduleGroupKey, ParsedScheduleEntry[]>();

  for (const entry of entries) {
    const key = getGroupKey(entry);

    const existing = groups.get(key);

    if (existing) {
      existing.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  /**
   * STEP 2
   *
   * Merge session berurutan di masing-masing
   * group.
   */
  const normalized = Array.from(groups.values()).flatMap(mergeGroup);

  /**
   * STEP 3
   *
   * Sorting hanya untuk output yang deterministic.
   */
  return normalized.sort((a, b) => {
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day);
    }

    if (a.startTime !== b.startTime) {
      return (a.startTime ?? "").localeCompare(b.startTime ?? "");
    }

    if (a.room !== b.room) {
      return a.room.localeCompare(b.room);
    }

    return a.courseName.localeCompare(b.courseName);
  });
}

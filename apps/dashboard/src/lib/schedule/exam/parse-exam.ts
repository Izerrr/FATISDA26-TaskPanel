import type { Kelas, Prodi } from "@/types";
import {
  CLEAN_EXAM_COURSE_NAMES,
  ID_MONTHS,
  MKU_CLASS_MAPPING,
  SESSION_TIMES_FRIDAY,
  SESSION_TIMES_NORMAL,
} from "./constants";

export interface ParsedExamRecord {
  type: "UTS" | "UAS";
  prodi: Prodi;
  semester: number;
  kelas: Kelas;
  courseName: string;
  date: Date;
  dateStr: string;
  dayName: string;
  dayNum: number;
  startTime: string;
  endTime: string;
  room: string;
  rawText: string;
  sourceSlots: number[];
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        row.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    row.push(cur);
    return row;
  });
}

const DAY_NAME_TO_NUM: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  minggu: 7,
};

function parseIndonesianDate(dateStr: string): { date: Date; formattedStr: string } | null {
  // e.g. "19 Okt 2026" or "13 Okt 2026" or "19-10-2026"
  const clean = dateStr.trim();
  const match = clean.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) {
    return null;
  }

  const day = match[1].padStart(2, "0");
  const monthKey = match[2].slice(0, 3).toLowerCase();
  const month = ID_MONTHS[monthKey] ?? "10";
  const year = match[3];

  const iso = `${year}-${month}-${day}T00:00:00.000Z`;
  const dateObj = new Date(iso);
  return {
    date: dateObj,
    formattedStr: `${match[1]} ${match[2]} ${year}`,
  };
}

export function parseExamCsv(
  csvContent: string,
  prodi: Prodi = "INFORMATIKA",
  examType: "UTS" | "UAS" = "UTS",
): ParsedExamRecord[] {
  const matrix = parseCsv(csvContent);
  if (matrix.length < 3) {
    return [];
  }

  // 1. Identify header row with rooms (typically row 1, having B4-11, Pasca, etc.)
  let headerRowIndex = 1;
  for (let r = 0; r < Math.min(5, matrix.length); r++) {
    const row = matrix[r];
    const roomCandidateCount = row.filter((cell) => /(B4|Pasca|UPT|Lab|B\.4)/i.test(cell)).length;
    if (roomCandidateCount >= 3) {
      headerRowIndex = r;
      break;
    }
  }

  const headerRow = matrix[headerRowIndex];
  // Rooms start at col 2 up to col 12
  const roomColumns: { colIndex: number; roomName: string }[] = [];
  for (let c = 2; c < headerRow.length; c++) {
    const val = headerRow[c]?.trim();
    if (val && !/^(Sesi|Hari|Jam)/i.test(val)) {
      roomColumns.push({ colIndex: c, roomName: val });
    }
  }

  // 2. Identify Day blocks
  interface DayBlock {
    dayName: string;
    dayNum: number;
    date: Date;
    dateStr: string;
    startRow: number;
    endRow: number;
  }

  const dayBlocks: DayBlock[] = [];
  let currentDayName = "";
  let currentDate: Date | null = null;
  let currentDateStr = "";
  let blockStartRow = -1;

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const col0 = matrix[r][0]?.trim() || "";
    const lower0 = col0.toLowerCase();

    // Check if col0 is a day name
    if (DAY_NAME_TO_NUM[lower0]) {
      if (currentDayName && currentDate && blockStartRow !== -1) {
        dayBlocks.push({
          dayName: currentDayName,
          dayNum: DAY_NAME_TO_NUM[currentDayName.toLowerCase()] ?? 1,
          date: currentDate,
          dateStr: currentDateStr,
          startRow: blockStartRow,
          endRow: r - 1,
        });
      }
      currentDayName = col0;
      currentDate = null;
      currentDateStr = "";
      blockStartRow = r;
      continue;
    }

    // Check if col0 is a date string (e.g. "19 Okt 2026")
    const parsedDate = parseIndonesianDate(col0);
    if (parsedDate && currentDayName && !currentDate) {
      currentDate = parsedDate.date;
      currentDateStr = parsedDate.formattedStr;
    }
  }

  // Push last block
  if (currentDayName && currentDate && blockStartRow !== -1) {
    dayBlocks.push({
      dayName: currentDayName,
      dayNum: DAY_NAME_TO_NUM[currentDayName.toLowerCase()] ?? 1,
      date: currentDate,
      dateStr: currentDateStr,
      startRow: blockStartRow,
      endRow: matrix.length - 1,
    });
  }

  // 3. Extract raw slot entries per day
  interface RawSlotEntry {
    dayName: string;
    dayNum: number;
    date: Date;
    dateStr: string;
    slot: number;
    room: string;
    startTime: string;
    endTime: string;
    rawText: string;
    courseName: string;
    semester: number;
    classes: Kelas[];
  }

  const rawSlotEntries: RawSlotEntry[] = [];

  for (const block of dayBlocks) {
    const isFriday = block.dayNum === 5 || /jum'?at/i.test(block.dayName);
    const sessionTimes = isFriday ? SESSION_TIMES_FRIDAY : SESSION_TIMES_NORMAL;

    for (let r = block.startRow; r <= block.endRow; r++) {
      const row = matrix[r];
      if (!row) continue;

      const slot = parseInt(row[1]?.trim() || "", 10);
      if (!slot || !sessionTimes[slot]) continue;

      for (const { colIndex, roomName } of roomColumns) {
        const cellText = row[colIndex]?.trim() || "";
        if (!cellText || cellText.toUpperCase() === "SD") continue;

        // Parse cell text: e.g. "Statistika & Proba...(1) (D)"
        const match = cellText.match(/^(.+?)\s*\((\d+)\)\s*(.+)?$/);
        if (!match) continue;

        const rawCourseName = match[1].trim();
        const semester = parseInt(match[2], 10);
        const classPart = match[3] ? match[3].trim() : "";

        // Extract class letters: A, B, C, D, E or MKU tokens A1, A2, B1, B2
        // Remove connectives like "dan" so they don't accidentally match letters
        const sanitizedClassPart = classPart.replace(/\bdan\b/gi, " ").trim();
        const classMatches = sanitizedClassPart.match(/[A-E][12]?/gi) || [];
        const rombelsSet = new Set<Kelas>();
        for (const rawToken of classMatches) {
          const token = rawToken.toUpperCase();
          if (MKU_CLASS_MAPPING[token]) {
            rombelsSet.add(MKU_CLASS_MAPPING[token]);
          } else if (["A", "B", "C", "D", "E"].includes(token)) {
            rombelsSet.add(token as Kelas);
          }
        }
        const rombels: Kelas[] = Array.from(rombelsSet);

        if (rombels.length === 0) continue;

        const cleanCourseName = CLEAN_EXAM_COURSE_NAMES[rawCourseName] || rawCourseName;

        rawSlotEntries.push({
          dayName: block.dayName,
          dayNum: block.dayNum,
          date: block.date,
          dateStr: block.dateStr,
          slot,
          room: roomName,
          startTime: sessionTimes[slot].start,
          endTime: sessionTimes[slot].end,
          rawText: cellText,
          courseName: cleanCourseName,
          semester,
          classes: rombels,
        });
      }
    }
  }

  // 4. Merge contiguous slots for the same exam in the same room on the same day
  const groupedSlots = new Map<string, RawSlotEntry[]>();
  for (const entry of rawSlotEntries) {
    const key = `${entry.date.toISOString()}|${entry.room}|${entry.rawText}`;
    if (!groupedSlots.has(key)) {
      groupedSlots.set(key, []);
    }
    groupedSlots.get(key)!.push(entry);
  }

  const finalRecords: ParsedExamRecord[] = [];

  groupedSlots.forEach((slots) => {
    slots.sort((a, b) => a.slot - b.slot);

    // Group contiguous slot chunks
    let currentBlock: RawSlotEntry[] = [slots[0]];
    for (let i = 1; i < slots.length; i++) {
      const prev = currentBlock[currentBlock.length - 1];
      const curr = slots[i];
      if (curr.slot === prev.slot + 1) {
        currentBlock.push(curr);
      } else {
        emitMergedRecords(currentBlock);
        currentBlock = [curr];
      }
    }
    emitMergedRecords(currentBlock);
  });

  function emitMergedRecords(block: RawSlotEntry[]) {
    const first = block[0];
    const last = block[block.length - 1];
    const sourceSlots = block.map((b) => b.slot);

    // Emit a record for each class (rombels)
    for (const kelas of first.classes) {
      finalRecords.push({
        type: examType,
        prodi,
        semester: first.semester,
        kelas,
        courseName: first.courseName,
        date: first.date,
        dateStr: first.dateStr,
        dayName: first.dayName,
        dayNum: first.dayNum,
        startTime: first.startTime,
        endTime: last.endTime,
        room: first.room,
        rawText: first.rawText,
        sourceSlots,
      });
    }
  }

  // Sort chronologically by date, then startTime, then kelas
  finalRecords.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = a.startTime.localeCompare(b.startTime);
    if (timeDiff !== 0) return timeDiff;
    return a.kelas.localeCompare(b.kelas);
  });

  return finalRecords;
}


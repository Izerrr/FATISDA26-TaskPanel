import type { Prodi } from "@/types";

import { DAY_MAP, DEFAULT_FRIDAY_SESSION_TIMES, DEFAULT_WEEKDAY_SESSION_TIMES, KNOWN_DAYS, ROOM_START_COLUMN, SCHEDULE_HEADER_ROW } from "./constants";

import { parseScheduleCell } from "./parse-cell";

import type { ParsedScheduleEntry } from "./types";

interface SessionTime {
  start: string;
  end: string;
}

type SessionTimeMap = Record<number, SessionTime>;

interface CsvRow {
  cells: string[];
  index: number;
}

type SourceDay = keyof typeof DAY_MAP;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);

  return result;
}

function parseCsv(csv: string): CsvRow[] {
  return csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line, index) => ({
      cells: parseCsvLine(line),
      index: index + 1,
    }));
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseTime(value: string): string {
  const normalized = clean(value).replace(".", ":");

  if (!normalized) {
    return "";
  }

  const [hour, minute] = normalized.split(":");

  if (!hour || !minute) {
    return normalized;
  }

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function isDay(value: string): value is SourceDay {
  return KNOWN_DAYS.includes(value as (typeof KNOWN_DAYS)[number]);
}

function parseSessionTimes(rows: CsvRow[]): {
  weekday: SessionTimeMap;
  friday: SessionTimeMap;
} {
  const weekday: SessionTimeMap = { ...DEFAULT_WEEKDAY_SESSION_TIMES };
  const friday: SessionTimeMap = { ...DEFAULT_FRIDAY_SESSION_TIMES };

  let mode: "WEEKDAY" | "FRIDAY" | null = null;

  for (const row of rows) {
    const cells = row.cells;

    const joined = cells.map(clean).join(" ").toLowerCase();

    if (joined.includes("hari senin - kamis")) {
      mode = "WEEKDAY";
      continue;
    }

    if (joined.includes("khusus hari jum")) {
      mode = "FRIDAY";
      continue;
    }

    if (!mode) {
      continue;
    }

    for (let c = 0; c < cells.length - 2; c++) {
      const session = Number(clean(cells[c]));
      const start = parseTime(cells[c + 1] ?? "");
      const end = parseTime(cells[c + 2] ?? "");

      if (Number.isInteger(session) && session > 0 && session <= 16 && start && end && start.includes(":") && end.includes(":")) {
        const target = mode === "FRIDAY" ? friday : weekday;
        target[session] = {
          start,
          end,
        };
        break;
      }
    }
  }

  return {
    weekday,
    friday,
  };
}

function getRoomHeaders(headerRow: string[]): Map<number, string> {
  const rooms = new Map<number, string>();

  for (let column = ROOM_START_COLUMN; column < headerRow.length; column++) {
    const room = clean(headerRow[column]);

    if (!room) {
      // Room columns are contiguous; stop on first empty column if rooms already found
      if (rooms.size > 0) {
        break;
      }
      continue;
    }

    // Stop if header contains non-room headers
    if (/keterangan|semester|catatan/i.test(room)) {
      break;
    }

    rooms.set(column, room);
  }

  return rooms;
}

export function parseScheduleCsv(csv: string, prodi: Prodi): ParsedScheduleEntry[] {
  const rows = parseCsv(csv);

  // Dynamically find first row where column 0 is a known day (e.g. "Senin")
  const firstDayRowIndex = rows.findIndex((row) => isDay(clean(row.cells[0])));

  let headerRowIndex = SCHEDULE_HEADER_ROW - 1;
  let dataStartIndex = SCHEDULE_HEADER_ROW;

  if (firstDayRowIndex > 0) {
    headerRowIndex = firstDayRowIndex - 1;
    dataStartIndex = firstDayRowIndex;
  }

  const headerRow = rows[headerRowIndex]?.cells;

  if (!headerRow) {
    throw new Error("Header ruangan tidak ditemukan.");
  }

  const rooms = getRoomHeaders(headerRow);

  if (rooms.size === 0) {
    throw new Error("Tidak ada ruangan yang ditemukan pada header timetable.");
  }

  const { weekday, friday } = parseSessionTimes(rows);

  const result: ParsedScheduleEntry[] = [];

  let currentDay: SourceDay | null = null;

  for (const row of rows.slice(dataStartIndex)) {
    const dayCell = clean(row.cells[0]);

    if (isDay(dayCell)) {
      currentDay = dayCell;
    }

    if (!currentDay) {
      continue;
    }

    const sessionValue = clean(row.cells[1]);
    const session = Number(sessionValue);

    if (!Number.isInteger(session) || session <= 0 || session > 16) {
      // Empty or note row; do not abort, just skip
      continue;
    }

    const day = DAY_MAP[currentDay];
    const sessionTimes = currentDay === "Jumat" ? friday[session] : weekday[session];

    rooms.forEach((room, column) => {
      const rawValue = clean(row.cells[column]);

      if (!rawValue) {
        return;
      }

      const parsed = parseScheduleCell(rawValue, prodi);

      if (!parsed) {
        return;
      }

      result.push({
        prodi,
        day,
        session,
        startTime: sessionTimes?.start ?? null,
        endTime: sessionTimes?.end ?? null,
        room,
        rawValue,
        courseName: parsed.courseName,
        semester: parsed.semester,
        rawClassCode: parsed.rawClassCode,
        classCode: parsed.classCode,
        markers: parsed.markers,
        lecturer: parsed.lecturer,
      });
    });
  }

  return result;
}

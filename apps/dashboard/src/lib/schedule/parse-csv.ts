import type { Prodi } from "@/types";

import { DAY_MAP, KNOWN_DAYS, ROOM_END_COLUMN, ROOM_START_COLUMN, SCHEDULE_HEADER_ROW } from "./constants";

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

/**
 * Membaca tabel waktu yang tersedia di spreadsheet.
 *
 * Parser sengaja tidak meng-hardcode jam kuliah.
 */
function parseSessionTimes(rows: CsvRow[]): {
  weekday: SessionTimeMap;
  friday: SessionTimeMap;
} {
  const weekday: SessionTimeMap = {};
  const friday: SessionTimeMap = {};

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

    const session = Number(clean(cells[9]));
    const start = parseTime(cells[10] ?? "");
    const end = parseTime(cells[11] ?? "");

    if (!Number.isInteger(session) || session <= 0 || !start || !end) {
      continue;
    }

    const target = mode === "FRIDAY" ? friday : weekday;

    target[session] = {
      start,
      end,
    };
  }

  return {
    weekday,
    friday,
  };
}

function getRoomHeaders(headerRow: string[]): Map<number, string> {
  const rooms = new Map<number, string>();

  for (let column = ROOM_START_COLUMN; column <= ROOM_END_COLUMN; column++) {
    const room = clean(headerRow[column]);

    if (!room) {
      continue;
    }

    rooms.set(column, room);
  }

  return rooms;
}

export function parseScheduleCsv(csv: string, prodi: Prodi): ParsedScheduleEntry[] {
  const rows = parseCsv(csv);

  const headerRow = rows[SCHEDULE_HEADER_ROW - 1]?.cells;

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
  let timetableStarted = false;
  let timetableEnded = false;

  for (const row of rows.slice(SCHEDULE_HEADER_ROW)) {
    if (timetableEnded) {
      break;
    }

    const dayCell = clean(row.cells[0]);

    if (isDay(dayCell)) {
      currentDay = dayCell;
      timetableStarted = true;
    }

    if (!timetableStarted || !currentDay) {
      continue;
    }

    const sessionValue = clean(row.cells[1]);
    const session = Number(sessionValue);

    if (!Number.isInteger(session) || session <= 0) {
      if (row.index > SCHEDULE_HEADER_ROW) {
        timetableEnded = true;
      }

      continue;
    }

    const day = DAY_MAP[currentDay];

    const sessionTimes = currentDay === "Jumat" ? friday[session] : weekday[session];

    for (let column = ROOM_START_COLUMN; column <= ROOM_END_COLUMN; column++) {
      const room = rooms.get(column);

      if (!room) {
        continue;
      }

      const rawValue = clean(row.cells[column]);

      if (!rawValue) {
        continue;
      }

      const parsed = parseScheduleCell(rawValue);

      if (!parsed) {
        continue;
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
      });
    }
  }

  return result;
}

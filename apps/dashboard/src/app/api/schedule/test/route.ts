import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { normalizeScheduleEntries, parseScheduleCsv } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), "schedule-informatika.csv");

    const csv = await readFile(csvPath, "utf8");

    const rawEntries = parseScheduleCsv(csv, "INFORMATIKA");

    const normalizedEntries = normalizeScheduleEntries(rawEntries);

    const classB = normalizedEntries.filter((entry) => entry.semester === 1 && entry.classCode === "B");

    return NextResponse.json({
      success: true,

      rawEntries: rawEntries.length,

      normalizedEntries: normalizedEntries.length,

      semester1ClassB: {
        total: classB.length,
        entries: classB,
      },

      examples: {
        fisika: normalizedEntries.filter((entry) => entry.courseName === "Fisika" && entry.semester === 1 && entry.classCode === "B"),

        bahasaIndonesia: normalizedEntries.filter((entry) => entry.courseName === "Bahasa Indonesia" && entry.semester === 1 && entry.classCode === "B"),

        konsepPemrograman: normalizedEntries.filter((entry) => entry.courseName === "Konsep Pemrograman" && entry.semester === 1 && entry.classCode === "B"),
      },
    });
  } catch (error) {
    console.error("[GET /api/schedule/test]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Parser test gagal.",
      },
      {
        status: 500,
      },
    );
  }
}

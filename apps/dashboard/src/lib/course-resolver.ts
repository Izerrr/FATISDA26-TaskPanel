import { prisma } from "@/lib/prisma";
import type { Kelas, Prodi } from "@prisma/client";

/**
 * Resolves or safely creates a course record from a course identifier or synthetic ID.
 * Prevents @@unique([code, prodi, kelas]) constraint violations by generating unique codes
 * based on the course name initials + numeric suffix.
 */
export async function resolveCourseId(courseIdInput: string | null | undefined, targetProdi: Prodi = "INFORMATIKA", targetKelas: Kelas | null = null): Promise<string | null> {
  if (!courseIdInput || typeof courseIdInput !== "string") {
    return null;
  }

  const input = courseIdInput.trim();
  if (!input) {
    return null;
  }

  // 1. Direct ID lookup in the Course table
  try {
    const byId = await prisma.course.findUnique({
      where: { id: input },
    });
    if (byId) {
      return byId.id;
    }
  } catch {
    // If input is not a valid UUID/CUID, findUnique may fail safely
  }

  // 2. Decode synthetic schedule IDs (e.g., "sched-Algoritma%20Pemrograman")
  let targetName = input;
  if (input.startsWith("sched-")) {
    targetName = decodeURIComponent(input.replace(/^sched-/, "")).trim();
  }

  if (!targetName) {
    return null;
  }

  // 3. Search for an existing course by name (case-insensitive) in target prodi
  let existing = await prisma.course.findFirst({
    where: {
      name: { equals: targetName, mode: "insensitive" },
      prodi: targetProdi,
    },
  });

  // 4. Fallback search across any prodi if not found in current prodi
  if (!existing) {
    existing = await prisma.course.findFirst({
      where: {
        name: { equals: targetName, mode: "insensitive" },
      },
    });
  }

  if (existing) {
    return existing.id;
  }

  // 5. Generate a unique, readable course code based on the course name
  // e.g., "Algoritma Pemrograman" -> "AP", "Fisika Dasar" -> "FD", "Kalkulus" -> "KAL"
  const words = targetName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let baseCode = "";
  if (words.length > 1) {
    baseCode = words
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 6);
  } else if (words.length === 1) {
    baseCode = words[0].slice(0, 4).toUpperCase();
  }

  if (!baseCode || baseCode.length < 2) {
    baseCode = "MK";
  }

  // Ensure unique code for the given [prodi, kelas] composite key
  let candidateCode = baseCode;
  let suffix = 1;

  while (true) {
    const conflict = await prisma.course.findFirst({
      where: {
        code: candidateCode,
        prodi: targetProdi,
        kelas: targetKelas,
      },
    });

    if (!conflict) {
      break;
    }

    suffix++;
    candidateCode = `${baseCode}${suffix}`;
  }

  try {
    const created = await prisma.course.create({
      data: {
        code: candidateCode,
        name: targetName,
        prodi: targetProdi,
        kelas: targetKelas,
      },
    });
    return created.id;
  } catch (err) {
    console.error("[resolveCourseId] Gagal membuat course baru:", err);

    // Final attempt to find by name in case of concurrent insert
    const fallback = await prisma.course.findFirst({
      where: {
        name: { equals: targetName, mode: "insensitive" },
      },
    });

    return fallback ? fallback.id : null;
  }
}

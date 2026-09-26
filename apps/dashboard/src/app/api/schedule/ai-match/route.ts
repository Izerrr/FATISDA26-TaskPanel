import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prodi } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeScheduleAndFreeTime, parseQueryEntities } from "@/lib/schedule/ai-matcher";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prodi: true, semester: true, kelas: true },
    });

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({ success: false, error: "Pertanyaan atau query tidak boleh kosong." }, { status: 400 });
    }

    const requestedProdi: Prodi = (body.prodi as Prodi) || user?.prodi || "INFORMATIKA";
    const requestedSemester: number = typeof body.semester === "number" ? body.semester : (user?.semester ?? 1);

    // Parse entitas terlebih dahulu untuk menentukan semua prodi yang terlibat (termasuk lintas prodi)
    const initialParsed = parseQueryEntities(query, requestedProdi, requestedSemester);
    const targetProdis = Array.from(new Set(initialParsed.targetGroups.map((g) => g.prodi)));

    // Pastikan prodi yang terlibat sudah memiliki data di database (auto-sync jika masih kosong)
    for (const p of targetProdis) {
      const count = await prisma.schedule.count({ where: { prodi: p } });
      if (count === 0) {
        try {
          const { syncSchedule } = await import("@/lib/schedule");
          await syncSchedule(p);
        } catch (err) {
          console.warn(`[POST /api/schedule/ai-match] Auto-sync gagal untuk prodi ${p}:`, err);
        }
      }
    }

    // Ambil seluruh jadwal untuk semua prodi yang terlibat
    const schedules = await prisma.schedule.findMany({
      where: {
        prodi: { in: targetProdis },
      },
      select: {
        prodi: true,
        kelas: true,
        semester: true,
        day: true,
        startTime: true,
        endTime: true,
        room: true,
        courseName: true,
        sourceSlots: true,
      },
    });

    // Ambil tugas aktif untuk korelasi deadline
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"] },
        prodi: { in: targetProdis },
      },
      select: {
        title: true,
        dueDate: true,
        kelas: true,
        course: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    const mappedTasks = tasks.map((t) => ({
      title: t.title,
      dueDate: t.dueDate,
      kelas: t.kelas,
      courseName: t.course?.name ?? null,
    }));

    const result = analyzeScheduleAndFreeTime(query, schedules, mappedTasks, requestedProdi, requestedSemester);

    // Coba tingkatkan dengan Gemini AI jika GEMINI_API_KEY disetel di env
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && result.freeSlots.length > 0) {
      try {
        const geminiPrompt = `Kamu adalah asisten akademik AI cerdas untuk FATISDA UNS 2026.
Pertanyaan pengguna: "${query}"

Berdasarkan perhitungan jadwal kuliah aktual yang valid:
- Program Studi: ${result.prodi}
- Semester: ${result.targetSemester}
- Kelas diteliti: ${result.targetClasses.join(", ")}
- Jam kosong bersama yang ditemukan:
${result.freeSlots.map((s) => `  * ${s.dayName}: ${s.startTime} - ${s.endTime} WIB (${s.label}, durasi ${s.durationMinutes} menit)`).join("\n")}
- Rekomendasi: ${result.recommendations.join(". ")}

Tolong berikan jawaban yang ramah, ringkas, jelas, dan memotivasi mahasiswa dalam bahasa Indonesia dengan formatting markdown yang rapi.`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            result.markdownAnswer = generatedText;
          }
        }
      } catch (geminiErr) {
        // Fallback ke built-in NLP engine output
        console.warn("[AI Matcher] Gemini enhancement skipped:", geminiErr);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[POST /api/schedule/ai-match]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memproses analisis jadwal.",
      },
      { status: 500 },
    );
  }
}

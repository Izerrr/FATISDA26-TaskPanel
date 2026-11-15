import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export const dynamic = "force-dynamic";

interface MemberInput {
  nim?: string;
  name: string;
  role?: string;
}

function normalizeStr(str?: string | null): string {
  return (str ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractWords(str?: string | null): string[] {
  return (str ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
    });

    const currentUserId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!currentUserId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const body = await req.json();
    const members: MemberInput[] = Array.isArray(body?.members) ? body.members : [];

    if (members.length === 0) {
      return NextResponse.json({ matched: [], unmatched: [] });
    }

    // 1. Kumpulkan semua NIM yang valid
    const cleanNims = members
      .map((m) => m.nim?.trim().toUpperCase())
      .filter((n): n is string => Boolean(n && n.length >= 4));

    // 2. Cari calon user berdasarkan NIM atau prefix email
    const usersByNim = cleanNims.length > 0
      ? await prisma.user.findMany({
          where: {
            OR: [
              { nim: { in: cleanNims, mode: "insensitive" } },
              ...cleanNims.map((n) => ({ email: { startsWith: n, mode: "insensitive" as const } })),
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            nim: true,
            avatar: true,
            email: true,
          },
        })
      : [];

    const matchedUsers: Array<{
      id: string;
      name?: string | null;
      username: string;
      nim?: string | null;
      avatar: string | null;
      sourceName: string;
      sourceNim?: string;
    }> = [];

    const unmatchedMembers: Array<{
      name: string;
      nim?: string;
      reason: string;
    }> = [];

    // Ambil daftar user dalam prodi/kelas jika relevan untuk pencarian nama
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, nim: true, prodi: true, kelas: true },
    });

    for (const member of members) {
      const sourceNim = member.nim?.trim().toUpperCase();
      const sourceName = member.name.trim();

      // Jika member adalah diri sendiri (berdasarkan NIM atau currentUserId), lewati karena pembuat sudah otomatis jadi ketua
      if (currentUser?.nim && sourceNim && currentUser.nim.toUpperCase() === sourceNim) {
        continue;
      }

      // Prioritas 1: Kecocokan Persis NIM
      type ResolvedCandidate = {
        id: string;
        name: string | null;
        username: string;
        nim: string | null;
        avatar: string | null;
        email?: string | null;
      };
      let foundUser: ResolvedCandidate | undefined = usersByNim.find(
        (u) =>
          Boolean(sourceNim) &&
          ((u.nim && u.nim.trim().toUpperCase() === sourceNim) ||
            (u.email && sourceNim ? u.email.toUpperCase().startsWith(sourceNim) : false)),
      );

      // Prioritas 2: Kecocokan Nama / Username jika NIM tidak ketemu
      if (!foundUser && sourceName.length >= 3) {
        const normSourceName = normalizeStr(sourceName);
        const sourceWords = extractWords(sourceName);

        // Cari kandidat berdasarkan nama atau username
        const candidates = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: sourceName, mode: "insensitive" } },
              ...sourceWords.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
              ...sourceWords.map((w) => ({ username: { contains: w, mode: "insensitive" as const } })),
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            nim: true,
            avatar: true,
          },
          take: 5,
        });

        // Pilih yang paling mirip
        for (const cand of candidates) {
          const normCandName = normalizeStr(cand.name);
          const normCandUser = normalizeStr(cand.username);

          // Full match atau substring match
          if (
            normCandName === normSourceName ||
            normCandUser === normSourceName ||
            normCandName.includes(normSourceName) ||
            normSourceName.includes(normCandName)
          ) {
            foundUser = cand;
            break;
          }

          // Cek apakah minimal 2 kata signifikan cocok
          const candWords = extractWords(cand.name);
          const matchedWordsCount = sourceWords.filter((sw) => candWords.includes(sw)).length;
          if (matchedWordsCount >= 2 || (sourceWords.length === 1 && matchedWordsCount === 1)) {
            foundUser = cand;
            break;
          }
        }
      }

      if (foundUser) {
        // Jangan masukkan user yang sedang login atau duplikat
        if (foundUser.id !== currentUserId && !matchedUsers.some((u) => u.id === foundUser.id)) {
          matchedUsers.push({
            id: foundUser.id,
            name: foundUser.name,
            username: foundUser.username,
            nim: foundUser.nim,
            avatar: foundUser.avatar,
            sourceName,
            sourceNim,
          });
        }
      } else {
        unmatchedMembers.push({
          name: sourceName,
          nim: sourceNim,
          reason: "Belum terdeteksi di akun TaskPanel",
        });
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchedUsers,
      unmatched: unmatchedMembers,
      totalRequested: members.length,
    });
  } catch (error) {
    console.error("[POST /api/groups/resolve-members]", error);
    return NextResponse.json({ error: "Gagal mencocokkan anggota kelompok" }, { status: 500 });
  }
}

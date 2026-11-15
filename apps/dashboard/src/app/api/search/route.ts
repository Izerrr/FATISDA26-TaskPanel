import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = token.userId ?? token.discordId;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const prodi = searchParams.get("prodi");
    const kelas = searchParams.get("kelas");

    if (q.length < 2) {
      return NextResponse.json({ tasks: [], courses: [] });
    }

    const userKey = userId as string;
    const visibilityConditions: any[] = [
      { scope: "PERSONAL", createdById: userKey },
      { scope: "PERSONAL", assignedTo: userKey },
      {
        scope: "GROUP",
        OR: [{ createdById: userKey }, { members: { some: { userId: userKey } } }],
      },
    ];

    if (prodi && kelas) {
      visibilityConditions.push({ scope: "CLASS", prodi, kelas });
    }

    const tasksWhere: any = {
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        { OR: visibilityConditions },
      ],
    };

    const coursesWhere: any = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ],
      ...(prodi ? { AND: [{ prodi }] } : {}),
    };

    const [tasks, courses] = await Promise.all([
      prisma.task.findMany({
        where: tasksWhere,
        take: 5,
        include: { course: true },
      }),
      prisma.course.findMany({
        where: coursesWhere,
        take: 5,
      }),
    ]);

    return NextResponse.json({ tasks, courses });
  } catch (error) {
    console.error("[Search GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

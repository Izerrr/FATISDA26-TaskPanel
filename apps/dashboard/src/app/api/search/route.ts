import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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

    const tasksWhere: any = {
      AND: [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        }
      ]
    };

    if (prodi && kelas) {
      tasksWhere.AND.push({
        OR: [
          { scope: 'PERSONAL', createdById: userId as string },
          { scope: 'CLASS', prodi, kelas }
        ]
      });
    } else {
      tasksWhere.AND.push({ scope: 'PERSONAL', createdById: userId as string });
    }

    const tasks = await prisma.task.findMany({
      where: tasksWhere,
      take: 5,
      include: { course: true }
    });

    let coursesWhere: any = {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } }
      ]
    };

    if (prodi) {
      coursesWhere.AND = [{ prodi }];
    }

    const courses = await prisma.course.findMany({
      where: coursesWhere,
      take: 5
    });

    return NextResponse.json({ tasks, courses });
  } catch (error) {
    console.error("[Search GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

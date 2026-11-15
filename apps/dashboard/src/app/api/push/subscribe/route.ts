import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { getPublicVapidKey, isWebPushConfigured } from "@/lib/notifications";
import { isMissingTableError } from "@/lib/task-access";
import { normalizeSafeHttpUrl } from "@/lib/url-safety";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let subscriptionCount = 0;
    try {
      subscriptionCount = await prisma.pushSubscription.count({ where: { userId } });
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }

    return NextResponse.json({
      configured: isWebPushConfigured(),
      publicKey: getPublicVapidKey(),
      subscriptionCount,
    });
  } catch (error) {
    console.error("[GET /api/push/subscribe]", error);
    return NextResponse.json({ error: "Gagal memeriksa status notifikasi push" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Konfigurasi VAPID server belum diaktifkan oleh administrator." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const safeEndpoint = normalizeSafeHttpUrl(typeof body.endpoint === "string" ? body.endpoint : null);
    const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
    const auth = typeof body?.keys?.auth === "string" ? body.keys.auth.trim() : "";

    if (!safeEndpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Data langganan push tidak lengkap atau tidak valid" }, { status: 400 });
    }

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: safeEndpoint },
      update: {
        userId,
        p256dh,
        auth,
        userAgent: req.headers.get("user-agent")?.slice(0, 240) ?? null,
      },
      create: {
        userId,
        endpoint: safeEndpoint,
        p256dh,
        auth,
        userAgent: req.headers.get("user-agent")?.slice(0, 240) ?? null,
      },
    });

    return NextResponse.json({ success: true, id: sub.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/push/subscribe]", error);
    return NextResponse.json({ error: "Gagal menyimpan langganan notifikasi push" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";

    try {
      if (endpoint) {
        await prisma.pushSubscription.deleteMany({
          where: { userId, endpoint },
        });
      } else {
        await prisma.pushSubscription.deleteMany({
          where: { userId },
        });
      }
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/push/subscribe]", error);
    return NextResponse.json({ error: "Gagal menghapus langganan push" }, { status: 500 });
  }
}

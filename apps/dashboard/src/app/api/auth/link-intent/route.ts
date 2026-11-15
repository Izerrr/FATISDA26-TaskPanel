import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signLinkIntent } from "@/lib/link-token";
import { getAuthSecret } from "@/lib/auth-secret";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = getAuthSecret();
    const token = await getToken({
      req,
      secret,
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Sesi login aktif diperlukan untuk menautkan akun." }, { status: 401 });
    }

    const signedToken = signLinkIntent(userId, secret);

    const response = NextResponse.json({ success: true });

    response.cookies.set("fatisda_link_intent", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300, // 5 menit
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/link-intent]", error);
    return NextResponse.json({ error: "Gagal membuat sesi penautan akun" }, { status: 500 });
  }
}

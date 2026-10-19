import { NextResponse } from "next/server";
import { getExamModeSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const examMode = await getExamModeSetting();
  return NextResponse.json({
    success: true,
    examMode,
  });
}


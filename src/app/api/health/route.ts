import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  await prisma.platformSetting.count();
  return NextResponse.json({ ok: true, service: "venzorah" });
}

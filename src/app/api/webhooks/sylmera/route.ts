import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySylmeraSession } from "@/lib/kyc";
import { verifySylmeraSignature, type SylmeraSession } from "@/lib/sylmera";

export async function POST(request: Request) {
  const secret = process.env.SYLMERA_WEBHOOK_SECRET;
  const raw = await request.text();
  if (secret) {
    const header = request.headers.get("x-sylmera-signature") ?? "";
    if (!verifySylmeraSignature(raw, header, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }
  let event: {
    id?: string;
    type?: string;
    data?: { session?: SylmeraSession };
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (event.id) {
    try {
      await prisma.webhookReceipt.create({ data: { id: event.id, source: "sylmera" } });
    } catch {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }
  const session = event.data?.session;
  if (!session?.id) return NextResponse.json({ ok: true });
  const submission = await prisma.kycSubmission.findUnique({
    where: { providerSessionId: session.id },
  });
  if (submission) await applySylmeraSession(submission.id, session);
  return NextResponse.json({ ok: true });
}

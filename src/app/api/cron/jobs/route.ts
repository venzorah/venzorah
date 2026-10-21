import { NextResponse } from "next/server";
import { processExpiredSubscriptions, processSubscriptionReminders } from "@/lib/billing";
import { releaseEligibleEarnings } from "@/lib/commerce";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reminders = await processSubscriptionReminders();
  const expired = await processExpiredSubscriptions();
  const settled = await releaseEligibleEarnings();
  return NextResponse.json({ reminders, expired, settled });
}

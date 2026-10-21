import { prisma } from "./db";
import { applySubscriptionDowngrade, getActivePlanForVendor } from "./commerce";
import { notify, sendTemplatedEmail } from "./audit";

export async function processSubscriptionReminders(now = new Date()) {
  const rules = await prisma.reminderRule.findMany({ where: { enabled: true } });
  const subs = await prisma.vendorSubscription.findMany({
    where: { status: { in: ["ACTIVE", "GRACE"] } },
    include: { vendor: true, plan: true },
  });
  let sent = 0;
  for (const sub of subs) {
    for (const rule of rules) {
      const target = new Date(sub.currentPeriodEnd);
      target.setDate(target.getDate() + rule.offsetDays);
      const sameDay =
        target.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      if (!sameDay) continue;
      const key = `remind_${sub.id}_${rule.id}_${now.toISOString().slice(0, 10)}`;
      const existing = await prisma.billingEvent.findUnique({ where: { idempotencyKey: key } });
      if (existing) continue;
      await prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "REMINDER",
          idempotencyKey: key,
          payload: rule.name,
        },
      });
      await notify(
        sub.vendor.userId,
        rule.name,
        sub.plan.autoRenew
          ? `An automatic debit of ${(sub.plan.pricePence / 100).toFixed(2)} GBP is scheduled.`
          : "Renew from your vendor dashboard to keep paid listing privileges.",
        "/vendor/subscription",
      );
      sent += 1;
    }
  }
  return sent;
}

export async function processExpiredSubscriptions(now = new Date()) {
  const expired = await prisma.vendorSubscription.findMany({
    where: { status: "ACTIVE", currentPeriodEnd: { lt: now }, plan: { key: { not: "free" } } },
  });
  for (const sub of expired) {
    await prisma.vendorSubscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    });
    const free = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
    const end = new Date();
    end.setFullYear(end.getFullYear() + 10);
    await prisma.vendorSubscription.create({
      data: {
        vendorId: sub.vendorId,
        planId: free.id,
        status: "ACTIVE",
        currentPeriodEnd: end,
        provider: "none",
      },
    });
    await applySubscriptionDowngrade(sub.vendorId);
    const plan = await getActivePlanForVendor(sub.vendorId);
    const vendor = await prisma.vendorProfile.findUniqueOrThrow({ where: { id: sub.vendorId } });
    await notify(
      vendor.userId,
      "Subscription expired",
      `You are now on the ${plan.name} plan. Excess listings were moved to draft, not deleted.`,
      "/vendor/subscription",
    );
    await sendTemplatedEmail(
      (await prisma.user.findUniqueOrThrow({ where: { id: vendor.userId } })).email,
      "verify-email",
      { name: "Vendor", link: "/vendor/subscription" },
    ).catch(() => undefined);
  }
  return expired.length;
}

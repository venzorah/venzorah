import { prisma } from "./db";

export async function audit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? undefined,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
  });
}

export async function notify(userId: string, title: string, body: string, href?: string) {
  await prisma.notification.create({ data: { userId, title, body, href } });
}

export async function logDelivery(to: string, templateKey: string, status: string, error?: string) {
  await prisma.notificationDelivery.create({
    data: {
      channel: "EMAIL",
      toAddress: to,
      templateKey,
      status,
      error,
    },
  });
}

export async function sendTemplatedEmail(to: string, templateKey: string, vars: Record<string, string>) {
  const template = await prisma.notificationTemplate.findUnique({ where: { key: templateKey } });
  const subject = template?.subject ?? templateKey;
  let body = template?.body ?? templateKey;
  for (const [k, v] of Object.entries(vars)) {
    body = body.replaceAll(`{{${k}}}`, v);
  }
  if (process.env.SMTP_HOST) {
    // Production SMTP is configured via env. Until then, record the payload.
    await logDelivery(to, templateKey, "QUEUED");
  } else {
    console.info(`[email:${templateKey}] to=${to} subject=${subject}\n${body}`);
    await logDelivery(to, templateKey, "LOGGED_DEV");
  }
  return { subject, body };
}

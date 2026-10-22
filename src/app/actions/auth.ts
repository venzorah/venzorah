"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  consumeAuthToken,
  createAuthToken,
  createDemoSession,
  createSession,
  destroySession,
  hashPassword,
  rateLimitLogin,
  verifyPassword,
} from "@/lib/auth";
import { isDatabaseFailure, matchDemoAccount, sessionDestination } from "@/lib/demo-access";
import { clearAuthReturn, peekAuthReturn, takeAuthReturn } from "@/lib/auth-return";
import { ROLE_KEYS } from "@/lib/permissions";
import { audit, notify, sendTemplatedEmail } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { getSetting, truthy } from "@/lib/settings";

async function adoptGuestBasket(userId: string) {
  try {
    const { mergeGuestCart } = await import("@/lib/store-checkout");
    await mergeGuestCart(userId);
  } catch (error) {
    console.error("[cart] guest basket was not merged", error instanceof Error ? error.message : error);
  }
}

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(100),
});

export async function registerCustomer(formData: FormData) {
  if (!truthy(await getSetting("customerRegistrationOpen"))) {
    return { error: "Customer registration is currently closed." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Check your name, email and a 10+ character password." };
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "An account already exists for that email." };
  let userId: string | null = null;
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        customer: { create: {} },
        roles: { create: { role: { connect: { key: ROLE_KEYS.CUSTOMER } } } },
      },
    });
    const token = await createAuthToken(user.id, "VERIFY_EMAIL");
    await sendTemplatedEmail(user.email, "verify-email", {
      name: user.name,
      link: `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`,
    }).catch(() => undefined);
    await notify(user.id, "Verify your email", "Please confirm your email to keep your account secure.").catch(
      () => undefined,
    );
    await createSession(user.id);
    userId = user.id;
  } catch {
    return { error: "Could not create that account on the live database. Try again in a moment." };
  }
  if (userId) await adoptGuestBasket(userId);
  redirect((await takeAuthReturn(formData.get("next"))) ?? "/account");
}

export async function registerVendor(formData: FormData) {
  if (!truthy(await getSetting("vendorRegistrationOpen"))) {
    return { error: "Vendor registration is currently closed." };
  }
  const storeName = String(formData.get("storeName") ?? "").trim();
  const country = String(formData.get("country") ?? "GB");
  const allowed = (await getSetting("vendorRegistrationCountries")).split(",");
  if (!allowed.includes(country)) return { error: "Vendor registration is not open for that country yet." };
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: formData.get("password"),
  });
  if (!parsed.success || storeName.length < 2) return { error: "Complete all vendor registration fields." };
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "An account already exists for that email." };
  try {
    const free = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        customer: { create: {} },
        roles: {
          create: [
            { role: { connect: { key: ROLE_KEYS.CUSTOMER } } },
            { role: { connect: { key: ROLE_KEYS.VENDOR } } },
          ],
        },
        vendor: {
          create: {
            storeName,
            storeSlug: slugify(storeName) + "-" + Math.random().toString(36).slice(2, 6),
            country,
            subscriptions: {
              create: {
                planId: free.id,
                status: "ACTIVE",
                currentPeriodEnd: periodEnd,
                provider: "none",
              },
            },
          },
        },
      },
    });
    await createSession(user.id);
  } catch {
    return { error: "Could not create that seller account on the live database. Try again in a moment." };
  }
  redirect("/vendor/kyc");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!rateLimitLogin(email)) return { error: "Too many attempts. Try again in 15 minutes." };
  const remember = String(formData.get("remember") ?? "") === "on";
  const portal = String(formData.get("portal") ?? "buyer");
  const days = remember ? 30 : 7;
  const next = await peekAuthReturn(formData.get("next"));

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Incorrect email or password." };
    if (!user.passwordHash) {
      return { error: "This account uses Google, Facebook or Apple. Continue with that provider." };
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return { error: "Incorrect email or password." };
    }
    if (user.status === "SUSPENDED") return { error: "This account is suspended." };
    const roles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
    const keys = roles.map((r) => r.role.key);
    if (portal === "admin" && !keys.includes(ROLE_KEYS.ADMIN)) {
      return { error: "This sign-in is for Venzorah staff only. Use the customer or seller login." };
    }
    await createSession(user.id, days);
    await adoptGuestBasket(user.id);
    await clearAuthReturn();
    redirect(next ?? sessionDestination(keys, portal));
  } catch (error) {
    unstable_rethrow(error);
    if (!isDatabaseFailure(error)) {
      console.error("[auth] sign-in failed", error instanceof Error ? error.message : error);
      return { error: "Sign-in is unavailable right now. Try again in a moment." };
    }
  }

  const demo = matchDemoAccount(email, password);
  if (!demo) return { error: "Incorrect email or password." };
  if (portal === "admin" && !demo.roles.includes(ROLE_KEYS.ADMIN)) {
    return { error: "This sign-in is for Venzorah staff only. Use the customer or seller login." };
  }
  await createDemoSession(demo.id, days);
  await clearAuthReturn();
  redirect(next ?? sessionDestination(demo.roles, portal));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createAuthToken(user.id, "RESET_PASSWORD");
    await sendTemplatedEmail(user.email, "reset-password", {
      name: user.name,
      link: `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`,
    });
  }
  return { ok: true };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  const record = await consumeAuthToken(token, "RESET_PASSWORD");
  if (!record) return { error: "This reset link is invalid or expired." };
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(password) },
  });
  await prisma.session.deleteMany({ where: { userId: record.userId } });
  await audit({ actorId: record.userId, action: "auth.password_reset", entity: "User", entityId: record.userId });
  redirect("/login");
}

export async function verifyEmailAction(token: string) {
  const record = await consumeAuthToken(token, "VERIFY_EMAIL");
  if (!record) return { error: "Invalid or expired verification link." };
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });
  return { ok: true };
}

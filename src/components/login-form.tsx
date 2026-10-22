"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { SocialLoginButtons } from "@/components/social-login";
import { DemoAccessNote } from "@/components/demo-access-note";
import { Button, Field, Input, TextLink } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AuthPortal } from "@/lib/oauth";

const ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  facebook_not_configured: "Facebook sign-in is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.",
  apple_not_configured:
    "Apple sign-in is not configured. Add APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY.",
  oauth_denied: "Social sign-in was cancelled.",
  oauth_failed: "Social sign-in failed. Try again, or use email and password.",
  oauth_email: "That provider did not share an email address, so we cannot create an account.",
  oauth_suspended: "This account is suspended.",
};

export function LoginForm({
  error,
  initialPortal,
  next,
}: {
  error?: string;
  initialPortal: AuthPortal;
  next?: string;
}) {
  const [portal, setPortal] = useState<AuthPortal>(initialPortal);
  const seller = portal === "seller";

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-card p-1 shadow-sm ring-1 ring-border">
        <button
          type="button"
          onClick={() => setPortal("buyer")}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-semibold transition",
            !seller ? "bg-navy text-white" : "text-muted hover:text-ink",
          )}
        >
          Buyer Portal
        </button>
        <button
          type="button"
          onClick={() => setPortal("seller")}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-semibold transition",
            seller ? "bg-gold text-navy" : "text-muted hover:text-ink",
          )}
        >
          Seller Portal
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">
        {seller ? "Access your seller portal, orders and store tools." : "Access your buyer account, orders and saved items."}
      </p>
      {next === "/checkout" ? <p className="mb-4 text-sm text-ink">Sign in to continue to checkout.</p> : null}
      {error ? (
        <p className="mb-4 rounded-xl bg-error/10 px-3 py-2 text-sm text-error">{ERRORS[error] ?? ERRORS.oauth_failed}</p>
      ) : null}
      <ActionForm action={loginAction} successMessage={null} className="grid gap-4">
        <input type="hidden" name="portal" value={portal} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" autoComplete="current-password" required />
        </Field>
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-ink">
            <input type="checkbox" name="remember" className="h-4 w-4 accent-[#002168]" />
            Remember Me
          </label>
          <TextLink href="/forgot-password">Forgot Password</TextLink>
        </div>
        <Button type="submit" className="w-full rounded-full">
          Sign In to Account
        </Button>
      </ActionForm>
      <SocialLoginButtons portal={portal} />
      <p className="mt-6 text-center text-sm text-muted">
        {seller ? (
          <>
            New seller?{" "}
            <Link href="/sell-on-venzorah" className="font-semibold text-ink underline-offset-2 hover:underline">
              Create New Account
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-ink underline-offset-2 hover:underline">
              Create New Account
            </Link>
          </>
        )}
      </p>
      <DemoAccessNote />
    </div>
  );
}

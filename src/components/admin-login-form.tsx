"use client";

import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { DemoAccessNote } from "@/components/demo-access-note";
import { Button, Field, Input, TextLink } from "@/components/ui";

export function AdminLoginForm() {
  return (
    <div>
      <ActionForm action={loginAction} successMessage={null} className="grid gap-4">
        <input type="hidden" name="portal" value="admin" />
        <Field label="Staff email">
          <Input name="email" type="email" autoComplete="username" required />
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
        <Button type="submit" variant="navy" className="w-full rounded-full">
          Sign in to admin
        </Button>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-muted">
        Customer or seller?{" "}
        <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          Use the storefront login
        </Link>
      </p>
      <DemoAccessNote staff />
    </div>
  );
}

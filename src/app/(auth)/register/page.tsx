import { registerCustomer } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { AuthScreen } from "@/components/auth-screen";
import { PasswordInput } from "@/components/password-input";
import { SocialLoginButtons } from "@/components/social-login";
import { Button, Field, Input, TextLink } from "@/components/ui";
import { safeNextPath } from "@/lib/safe-next";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  return (
    <AuthScreen
      title="Create your account"
      description="Shop African products from trusted UK vendors."
      footer={
        <p>
          Already have an account? <TextLink href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Sign in</TextLink>
        </p>
      }
    >
      <ActionForm action={registerCustomer} successMessage={null} className="grid gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Full name">
          <Input name="name" autoComplete="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <PasswordInput name="password" autoComplete="new-password" minLength={10} required />
        </Field>
        <Button type="submit" className="w-full rounded-full">
          Create New Account
        </Button>
      </ActionForm>
      <SocialLoginButtons portal="buyer" />
    </AuthScreen>
  );
}

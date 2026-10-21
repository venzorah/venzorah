import { resetPasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { AuthScreen } from "@/components/auth-screen";
import { PasswordInput } from "@/components/password-input";
import { Button, Field } from "@/components/ui";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthScreen title="Choose a new password" description="Use at least 10 characters.">
      <ActionForm action={resetPasswordAction} successMessage="Password updated. You can sign in." className="grid gap-4">
        <input type="hidden" name="token" value={token ?? ""} />
        <Field label="New password">
          <PasswordInput name="password" minLength={10} required autoComplete="new-password" />
        </Field>
        <Button type="submit" className="w-full rounded-full">
          Update password
        </Button>
      </ActionForm>
    </AuthScreen>
  );
}

import { requestPasswordReset } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { AuthScreen } from "@/components/auth-screen";
import { Button, Field, Input, TextLink } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Reset password"
      description="We’ll send a reset link if that email is on Venzorah."
      footer={
        <p>
          Remembered it? <TextLink href="/login">Back to sign in</TextLink>
        </p>
      }
    >
      <ActionForm action={requestPasswordReset} successMessage="If an account exists, a reset link is on its way." className="grid gap-4">
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <Button type="submit" className="w-full rounded-full">
          Send reset link
        </Button>
      </ActionForm>
    </AuthScreen>
  );
}

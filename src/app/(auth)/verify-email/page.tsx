import { verifyEmailAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth-screen";
import { Alert, TextLink } from "@/components/ui";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { error: "Missing token." };
  const failed = Boolean(result && "error" in result && result.error);
  return (
    <AuthScreen title="Email verification">
      {failed ? (
        <Alert tone="error">{result.error}</Alert>
      ) : (
        <Alert tone="success">Your email is verified. You can continue shopping.</Alert>
      )}
      <p className="mt-6 text-sm">
        <TextLink href="/">{failed ? "Back home" : "Continue shopping"}</TextLink>
      </p>
    </AuthScreen>
  );
}

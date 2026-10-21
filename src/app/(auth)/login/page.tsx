import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; portal?: string }>;
}) {
  const query = await searchParams;
  const portal = query.portal === "seller" ? "seller" : "buyer";
  return (
    <AuthScreen title="Sign In">
      <LoginForm error={query.error} initialPortal={portal} />
    </AuthScreen>
  );
}

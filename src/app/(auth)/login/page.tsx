import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; portal?: string; next?: string }>;
}) {
  const query = await searchParams;
  const portal = query.portal === "seller" ? "seller" : "buyer";
  const next = safeNextPath(query.next) ?? undefined;
  return (
    <AuthScreen title="Sign In">
      <LoginForm error={query.error} initialPortal={portal} next={next} />
    </AuthScreen>
  );
}

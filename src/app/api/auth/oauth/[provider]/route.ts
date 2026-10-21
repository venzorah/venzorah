import { redirect } from "next/navigation";
import { isOAuthProvider, startOAuth, type AuthPortal } from "@/lib/oauth";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) redirect("/login?error=oauth_failed");
  const portal: AuthPortal =
    new URL(request.url).searchParams.get("portal") === "seller" ? "seller" : "buyer";
  await startOAuth(provider, portal);
}

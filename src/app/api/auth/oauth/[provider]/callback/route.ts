import { redirect } from "next/navigation";
import { finishOAuth, isOAuthProvider } from "@/lib/oauth";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) redirect("/login?error=oauth_failed");
  const url = new URL(request.url);
  if (url.searchParams.get("error")) redirect("/login?error=oauth_denied");
  await finishOAuth(provider, url.searchParams.get("code"), url.searchParams.get("state"));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) redirect("/login?error=oauth_failed");
  const form = await request.formData();
  if (String(form.get("error") ?? "")) redirect("/login?error=oauth_denied");
  await finishOAuth(
    provider,
    String(form.get("code") ?? "") || null,
    String(form.get("state") ?? "") || null,
    String(form.get("user") ?? "") || null,
  );
}

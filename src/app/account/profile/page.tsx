import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLE_KEYS } from "@/lib/permissions";
import { updateProfile } from "@/app/actions/marketplace";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input } from "@/components/ui";

export default async function ProfilePage() {
  const session = await requireUser();
  let profile = {
    name: session.name,
    email: session.email,
    phone: "",
    image: session.image,
  };
  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (user) {
      profile = { name: user.name, email: user.email, phone: user.phone ?? "", image: user.image };
    }
  } catch (error) {
    console.error("[profile] account record unavailable", error instanceof Error ? error.message : error);
  }
  const initial = profile.name.trim().charAt(0).toUpperCase() || "V";
  const vendor = Boolean(session.vendorId) || session.roles.includes(ROLE_KEYS.VENDOR);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <BrandMark href="/" size={36} />
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/products" className="text-ink">
              Continue shopping
            </Link>
            <Link href={vendor ? "/vendor" : "/account"} className="rounded-full bg-navy px-3 py-1.5 text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-dark">Buyer profile</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">Your details</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Update the photo, mobile number and email on your buyer profile. Orders and saved items stay on the dashboard.
        </p>
        <ActionForm action={updateProfile} className="mt-6 grid gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-center gap-4">
            {profile.image ? (
              <img src={profile.image} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-gold" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-2xl font-extrabold text-gold">
                {initial}
              </span>
            )}
            <Field label="Profile picture" hint="JPG, PNG or WebP. This is shown on your profile only.">
              <Input name="picture" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
            </Field>
          </div>
          <Field label="Name">
            <Input name="name" defaultValue={profile.name} autoComplete="name" required />
          </Field>
          <Field label="Mobile">
            <Input name="phone" defaultValue={profile.phone} type="tel" autoComplete="tel" placeholder="07…" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={profile.email} autoComplete="email" required />
          </Field>
          <Button type="submit" className="rounded-full">
            Save profile
          </Button>
        </ActionForm>
        <form action={logoutAction} className="mt-6">
          <Button type="submit" variant="secondary" className="rounded-full">
            Sign out
          </Button>
        </form>
      </main>
    </div>
  );
}

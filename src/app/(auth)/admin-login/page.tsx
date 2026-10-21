import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user?.permissions.includes("admin.dashboard.view")) redirect("/admin");
  return (
    <AuthScreen
      title="Staff sign in"
      description="This page is for Venzorah administrators only. Customers and sellers should use the storefront login."
    >
      <AdminLoginForm />
    </AuthScreen>
  );
}

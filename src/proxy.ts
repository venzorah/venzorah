import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_RETURN_COOKIE, safeNextPath } from "@/lib/safe-next";

export function proxy(request: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === "true";
  if (maintenance && !request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/offline") {
    return NextResponse.rewrite(new URL("/offline", request.url));
  }
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  if (path === "/login" || path === "/register") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    if (next) {
      response.cookies.set(AUTH_RETURN_COOKIE, next, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 30,
      });
    } else {
      response.cookies.set(AUTH_RETURN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|logo-wordmark.png|sw.js|.*\\.svg$).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === "true";
  if (maintenance && !request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/offline") {
    return NextResponse.rewrite(new URL("/offline", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|logo-wordmark.png|sw.js|.*\\.svg$).*)"],
};

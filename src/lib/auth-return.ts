import { cookies } from "next/headers";
import { AUTH_RETURN_COOKIE, safeNextPath } from "@/lib/safe-next";

export { AUTH_RETURN_COOKIE };

/** Prefer the form value, then the short-lived return cookie set from the login URL. */
export async function peekAuthReturn(formValue?: unknown) {
  const jar = await cookies();
  return safeNextPath(formValue) ?? safeNextPath(jar.get(AUTH_RETURN_COOKIE)?.value);
}

export async function clearAuthReturn() {
  const jar = await cookies();
  if (jar.get(AUTH_RETURN_COOKIE)) jar.delete(AUTH_RETURN_COOKIE);
}

export async function takeAuthReturn(formValue?: unknown) {
  const next = await peekAuthReturn(formValue);
  await clearAuthReturn();
  return next;
}

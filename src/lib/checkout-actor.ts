import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE, type AuthUser } from "./auth";
import { isDemoToken, readDemoToken } from "./demo-access";

/** A database session or a verified demo. cookie. A missing cookie is a guest. */
export async function checkoutActor(): Promise<AuthUser | null> {
  const user = await getSessionUser();
  if (user) return user;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || !isDemoToken(token)) return null;
  return readDemoToken(token);
}

export function isDemoActor(user: AuthUser) {
  return user.id.startsWith("demo-");
}

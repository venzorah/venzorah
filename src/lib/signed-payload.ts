import { createHmac, timingSafeEqual } from "crypto";

const SECRET = "venzorah-demo-checkout-v1";

export function signPayload(kind: string, data: unknown, ttlMs: number, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ kind, exp: now + ttlMs, data })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readPayload<T>(token: string, kind: string, now = Date.now()): T | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      kind?: string;
      exp?: number;
      data?: T;
    };
    if (parsed.kind !== kind || typeof parsed.exp !== "number" || parsed.exp <= now || parsed.data == null) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

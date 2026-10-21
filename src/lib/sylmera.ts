import { createHmac, timingSafeEqual } from "crypto";

export const SYLMERA_BASE = (process.env.SYLMERA_BASE_URL ?? "https://sylmera.com").replace(/\/$/, "");

export type SylmeraKind = "person" | "business";

export type SylmeraSession = {
  id: string;
  url?: string;
  kind?: string;
  checks?: string[];
  status?: string;
  decision?: string;
  client_reference?: string;
  person?: { name?: string; date_of_birth?: string; document_country?: string };
  business?: { name?: string; registration_number?: string; country?: string };
  reasons?: { code?: string; message?: string }[];
  completed_at?: string;
};

export function isSylmeraConfigured() {
  return Boolean(process.env.SYLMERA_API_KEY);
}

function headers() {
  const key = process.env.SYLMERA_API_KEY ?? "";
  return {
    "X-Sylmera-Key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function createSylmeraSession(input: {
  clientReference: string;
  kind: SylmeraKind;
  returnUrl: string;
}) {
  const checks = input.kind === "business" ? ["company", "document", "face"] : ["document", "face", "address"];
  const res = await fetch(`${SYLMERA_BASE}/api/verify/sessions.php`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      client_reference: input.clientReference,
      kind: input.kind,
      checks,
      documents: ["passport", "id_card", "driving_licence"],
      capture: "both",
      locale: "en",
      return_url: input.returnUrl,
    }),
  });
  const body = (await res.json()) as { success?: boolean; session?: SylmeraSession; error?: string; message?: string };
  if (!res.ok || !body.success || !body.session?.id || !body.session.url) {
    throw new Error(body.message || body.error || "Sylmera could not start verification.");
  }
  return body.session;
}

export async function getSylmeraSession(id: string) {
  const res = await fetch(`${SYLMERA_BASE}/api/verify/sessions.php?id=${encodeURIComponent(id)}`, {
    headers: headers(),
    cache: "no-store",
  });
  const body = (await res.json()) as { success?: boolean; session?: SylmeraSession; error?: string; message?: string };
  if (!res.ok || !body.success || !body.session) {
    throw new Error(body.message || body.error || "Sylmera session was not found.");
  }
  return body.session;
}

export function verifySylmeraSignature(rawBody: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((chunk) => {
      const index = chunk.indexOf("=");
      return [chunk.slice(0, index).trim(), chunk.slice(index + 1)];
    }),
  );
  const t = Number(parts.t);
  const v1 = String(parts.v1 ?? "");
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(v1);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function mapSylmeraStatus(session: SylmeraSession) {
  const status = (session.decision || session.status || "").toLowerCase();
  if (status === "approved") return "APPROVED";
  if (status === "rejected" || status === "cancelled") return "REJECTED";
  if (status === "expired") return "EXPIRED";
  return "PENDING";
}

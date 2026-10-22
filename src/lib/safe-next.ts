/** Same-site path only. Rejects protocol-relative and backslash redirects. */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
  if (path.includes("://") || path.includes("\\") || path.includes("@")) return null;
  if (/[\u0000-\u001f\u007f]/.test(path)) return null;
  return path;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string) {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${slugify(base)}-${rand}`;
}

export function normalisePostcode(postcode: string) {
  return postcode.replace(/\s+/g, "").toUpperCase();
}

export function postcodePrefix(postcode: string) {
  const compact = normalisePostcode(postcode);
  const match = compact.match(/^[A-Z]{1,2}/);
  return match?.[0] ?? compact.slice(0, 2);
}

export function methodServesPostcode(prefixesCsv: string, postcode: string) {
  const prefix = postcodePrefix(postcode);
  const allowed = prefixesCsv.split(",").map((p) => p.trim().toUpperCase()).filter(Boolean);
  if (allowed.includes("*") || allowed.includes("GB")) return true;
  return allowed.some((p) => prefix.startsWith(p) || p.startsWith(prefix));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function orderNumber() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VZ-${n}-${r}`;
}

export function ticketNumber() {
  return `TCK-${Date.now().toString(36).toUpperCase()}`;
}

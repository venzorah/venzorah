import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_PUBLIC_BYTES = 8 * 1024 * 1024;
const MAX_PRIVATE_BYTES = 12 * 1024 * 1024;
const ALLOWED_PUBLIC = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_PRIVATE = new Set([...ALLOWED_PUBLIC, "application/pdf"]);

function safeExt(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && /^\.[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "application/pdf") return ".pdf";
  return ".jpg";
}

async function persist(file: File, dir: string, allowed: Set<string>, maxBytes: number) {
  if (!allowed.has(file.type)) {
    throw new Error("That file type is not allowed.");
  }
  if (file.size > maxBytes) {
    throw new Error("That file is too large.");
  }
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${safeExt(file)}`;
  const full = path.join(dir, name);
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return name;
}

export async function savePublicUpload(file: File, folder: string) {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  const name = await persist(file, dir, ALLOWED_PUBLIC, MAX_PUBLIC_BYTES);
  return `/uploads/${folder}/${name}`;
}

export async function savePrivateUpload(file: File, folder: string) {
  const dir = path.join(process.cwd(), "storage", "private", folder);
  const name = await persist(file, dir, ALLOWED_PRIVATE, MAX_PRIVATE_BYTES);
  return `storage/private/${folder}/${name}`;
}

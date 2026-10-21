import { prisma } from "./db";
import { audit } from "./audit";

export const DEFAULT_SETTINGS: Record<string, string> = {
  marketplaceName: "Venzorah",
  tagline: "African products from trusted vendors — food, fashion, beauty, art and more.",
  currency: "GBP",
  supportedCountries: "GB",
  vendorRegistrationCountries: "GB",
  defaultCommissionBps: "500",
  productsRequireApproval: "true",
  maintenanceMode: "false",
  vatMode: "RECORD_ONLY",
  vatBps: "2000",
  cancellationWindowHours: "2",
  returnWindowDays: "14",
  settlementDelayDays: "7",
  freePlanMaxProducts: "5",
  reviewsRequirePurchase: "true",
  customerRegistrationOpen: "true",
  vendorRegistrationOpen: "true",
  defaultLocale: "en-GB",
};

export async function getSetting(key: string) {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getSettings() {
  const rows = await prisma.platformSetting.findMany();
  const map = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string, actorId?: string) {
  const current = await prisma.platformSetting.findUnique({ where: { key } });
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value, updatedBy: actorId },
    update: { value, updatedBy: actorId },
  });
  await prisma.settingChange.create({
    data: { key, oldValue: current?.value, newValue: value, actorId },
  });
  await audit({
    actorId,
    action: "setting.update",
    entity: "PlatformSetting",
    entityId: key,
    metadata: { oldValue: current?.value, newValue: value },
  });
}

export function truthy(value: string | undefined) {
  return value === "true" || value === "1" || value === "yes";
}

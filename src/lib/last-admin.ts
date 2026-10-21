import { prisma } from "./db";
import { ROLE_KEYS } from "./permissions";

export async function countActiveAdmins(exceptUserId?: string) {
  return prisma.userRole.count({
    where: {
      role: { key: ROLE_KEYS.ADMIN },
      user: {
        status: "ACTIVE",
        ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
      },
    },
  });
}

export async function assertNotLastAdmin(userId: string, action: string) {
  const remaining = await countActiveAdmins(userId);
  if (remaining < 1) {
    throw new Error(
      `Refusing to ${action}: this would leave the marketplace with no active administrator.`,
    );
  }
}

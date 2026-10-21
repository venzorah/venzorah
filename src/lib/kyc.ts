import { prisma } from "./db";
import { ROLE_KEYS } from "./permissions";
import { mapSylmeraStatus, type SylmeraSession } from "./sylmera";

export async function applyKycDecision(vendorId: string, status: string, reviewerId?: string) {
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      kycStatus: status,
      payoutEligible: status === "APPROVED",
    },
  });
  if (status !== "APPROVED") return;
  const vendor = await prisma.vendorProfile.findUnique({ where: { id: vendorId } });
  const role = await prisma.role.findUnique({ where: { key: ROLE_KEYS.VERIFIED_VENDOR } });
  if (!vendor || !role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: vendor.userId, roleId: role.id } },
    update: {},
    create: { userId: vendor.userId, roleId: role.id },
  });
  if (reviewerId) {
    await prisma.kycSubmission.updateMany({
      where: { vendorId, status: "PENDING" },
      data: { reviewedAt: new Date(), reviewerId },
    });
  }
}

export async function applySylmeraSession(submissionId: string, session: SylmeraSession) {
  const mapped = mapSylmeraStatus(session);
  const submission = await prisma.kycSubmission.update({
    where: { id: submissionId },
    data: {
      providerStatus: session.status ?? session.decision,
      decision: session.decision ?? session.status,
      hostedUrl: session.url,
      resultJson: JSON.stringify(session),
      status: mapped === "EXPIRED" ? "REJECTED" : mapped,
    },
  });
  const vendorPatch = {
    companyNumber: session.business?.registration_number,
    businessName: session.business?.name,
  };
  if (mapped === "APPROVED" || mapped === "REJECTED" || mapped === "EXPIRED") {
    await applyKycDecision(submission.vendorId, mapped === "EXPIRED" ? "REJECTED" : mapped);
    await prisma.vendorProfile.update({
      where: { id: submission.vendorId },
      data: vendorPatch,
    });
  } else {
    await prisma.vendorProfile.update({
      where: { id: submission.vendorId },
      data: { kycStatus: "PENDING", ...vendorPatch },
    });
  }
  return submission;
}

import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { SellLanding } from "@/components/sell-landing";

export default async function SellOnVenzorahPage() {
  await connection();
  const [vendorCount, paid] = await Promise.all([
    prisma.vendorProfile.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalPence: true },
    }),
  ]);

  return <SellLanding vendorCount={vendorCount} payoutPence={paid._sum.totalPence ?? 0} />;
}

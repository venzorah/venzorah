import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { SellLanding } from "@/components/sell-landing";

export default async function SellOnVenzorahPage() {
  await connection();
  let vendorCount = 0;
  let payoutPence = 0;
  try {
    const [count, paid] = await Promise.all([
      prisma.vendorProfile.count(),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalPence: true },
      }),
    ]);
    vendorCount = count;
    payoutPence = paid._sum.totalPence ?? 0;
  } catch (error) {
    console.error("Sell page skipped the database:", error instanceof Error ? error.message : error);
  }

  return <SellLanding vendorCount={vendorCount} payoutPence={payoutPence} />;
}

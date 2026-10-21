import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const o = await p.order.findFirst({ orderBy: { placedAt: "desc" } });
console.log(JSON.stringify({ id: o?.id, number: o?.number, paymentStatus: o?.paymentStatus }));
await p.$disconnect();

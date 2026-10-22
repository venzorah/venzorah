import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const WALLET_TOP_UP = "TOP_UP";
export const WALLET_PURCHASE = "PURCHASE";
export const WALLET_REFUND = "REFUND";
export const WALLET_PAYOUT = "PAYOUT";

const CREDIT = new Set([WALLET_TOP_UP, WALLET_REFUND]);
const DEBIT = new Set([WALLET_PURCHASE, WALLET_PAYOUT]);

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletError";
  }
}

export function buyerBalancePence(entries: { type: string; amountPence: number }[]) {
  return entries.reduce((balance, entry) => {
    if (CREDIT.has(entry.type)) return balance + entry.amountPence;
    if (DEBIT.has(entry.type)) return balance - entry.amountPence;
    return balance;
  }, 0);
}

/** UK sort code (6 digits) and account number (8 digits). Spaces and dashes are ignored. */
export function normaliseUkBank(sortCode: string, accountNumber: string) {
  const sort = sortCode.replace(/\D/g, "");
  const account = accountNumber.replace(/\D/g, "");
  if (!/^\d{6}$/.test(sort) || !/^\d{8}$/.test(account)) return null;
  return {
    sortCode: `${sort.slice(0, 2)}-${sort.slice(2, 4)}-${sort.slice(4)}`,
    accountNumber: account,
    last4: account.slice(-4),
  };
}

export function maskAccount(accountNumber: string) {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length < 4) return "saved account";
  return `account ending ${digits.slice(-4)}`;
}

type Tx = Prisma.TransactionClient;

export async function postWalletEntry(
  tx: Tx,
  input: {
    userId: string;
    type: string;
    amountPence: number;
    orderId?: string;
    idempotencyKey?: string;
    note?: string;
  },
) {
  if (!Number.isInteger(input.amountPence) || input.amountPence <= 0) {
    throw new WalletError("Enter a positive amount.");
  }
  if (input.idempotencyKey) {
    const existing = await tx.buyerWalletEntry.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
  }
  if (DEBIT.has(input.type)) {
    const entries = await tx.buyerWalletEntry.findMany({ where: { userId: input.userId } });
    if (input.amountPence > buyerBalancePence(entries)) {
      throw new WalletError("Your wallet does not have enough for that.");
    }
  }
  return tx.buyerWalletEntry.create({
    data: {
      userId: input.userId,
      type: input.type,
      amountPence: input.amountPence,
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      note: input.note,
    },
  });
}

export async function buyerWallet(userId: string) {
  const [entries, detail, payouts] = await Promise.all([
    prisma.buyerWalletEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.buyerPayoutDetail.findUnique({ where: { userId } }),
    prisma.buyerPayout.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return {
    balancePence: buyerBalancePence(entries),
    entries,
    detail,
    payouts,
  };
}

export async function creditBuyerRefund(input: {
  userId: string;
  amountPence: number;
  orderId: string;
  idempotencyKey: string;
  note: string;
}) {
  if (input.amountPence <= 0) return null;
  return prisma.$transaction((tx) =>
    postWalletEntry(tx, {
      userId: input.userId,
      type: WALLET_REFUND,
      amountPence: input.amountPence,
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      note: input.note,
    }),
  );
}

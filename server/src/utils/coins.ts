// Coin wallet helpers. Every credit/deduction is logged as a Transaction
// inside a DB transaction so balance and ledger never drift.
import { PrismaClient, TxnType, Prisma } from '@prisma/client';

export class InsufficientCoinsError extends Error {
  constructor() {
    super('Insufficient coin balance');
    this.name = 'InsufficientCoinsError';
  }
}

/**
 * Atomically deduct coins from a user and write a COIN_SPEND transaction.
 * Throws InsufficientCoinsError if the balance would go negative.
 */
export async function spendCoins(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  description: string,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const run = async (db: Prisma.TransactionClient) => {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.coinBalance < amount) throw new InsufficientCoinsError();
    const updated = await db.user.update({
      where: { id: userId },
      data: { coinBalance: { decrement: amount } },
    });
    await db.transaction.create({
      data: { userId, type: TxnType.COIN_SPEND, coinAmount: -amount, description },
    });
    return updated.coinBalance;
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/** Atomically credit coins (top-up or reward) and log the transaction. */
export async function creditCoins(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  type: TxnType,
  description: string,
  paymentMethodType?: string,
  cashCents = 0,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const run = async (db: Prisma.TransactionClient) => {
    const updated = await db.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: amount } },
    });
    await db.transaction.create({
      data: { userId, type, coinAmount: amount, cashCents, paymentMethodType, description },
    });
    return updated.coinBalance;
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

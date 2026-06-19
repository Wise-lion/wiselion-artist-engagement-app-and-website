import { spendCoins, creditCoins, InsufficientCoinsError } from './coins';
import { TxnType } from '@prisma/client';

// Minimal in-memory Prisma mock: one user + a transaction log. $transaction runs
// the callback with the same mock as the tx client (single-connection model).
function makeMockPrisma(startBalance: number) {
  const user = { id: 'u1', coinBalance: startBalance };
  const txns: any[] = [];

  const client: any = {
    user: {
      findUniqueOrThrow: async ({ where }: any) => {
        if (where.id !== user.id) throw new Error('not found');
        return { ...user };
      },
      update: async ({ data }: any) => {
        if (data.coinBalance?.decrement != null) user.coinBalance -= data.coinBalance.decrement;
        if (data.coinBalance?.increment != null) user.coinBalance += data.coinBalance.increment;
        return { ...user };
      },
    },
    transaction: {
      create: async ({ data }: any) => {
        txns.push(data);
        return data;
      },
    },
    $transaction: async (cb: any) => cb(client),
  };

  return { client, user, txns };
}

describe('spendCoins', () => {
  it('deducts coins and logs a COIN_SPEND transaction', async () => {
    const { client, user, txns } = makeMockPrisma(500);
    const balance = await spendCoins(client, 'u1', 50, 'Bingo card');
    expect(balance).toBe(450);
    expect(user.coinBalance).toBe(450);
    expect(txns).toHaveLength(1);
    expect(txns[0]).toMatchObject({ type: TxnType.COIN_SPEND, coinAmount: -50, description: 'Bingo card' });
  });

  it('throws InsufficientCoinsError and does not mutate balance', async () => {
    const { client, user, txns } = makeMockPrisma(30);
    await expect(spendCoins(client, 'u1', 50, 'Bingo card')).rejects.toBeInstanceOf(InsufficientCoinsError);
    expect(user.coinBalance).toBe(30); // unchanged
    expect(txns).toHaveLength(0); // no ledger entry written
  });

  it('allows spending the exact balance to zero', async () => {
    const { client, user } = makeMockPrisma(50);
    const balance = await spendCoins(client, 'u1', 50, 'all in');
    expect(balance).toBe(0);
    expect(user.coinBalance).toBe(0);
  });
});

describe('creditCoins', () => {
  it('increments balance and logs the transaction with method + cash', async () => {
    const { client, user, txns } = makeMockPrisma(100);
    const balance = await creditCoins(client, 'u1', 1200, TxnType.COIN_TOPUP, 'Top up', 'cashapp', 1200);
    expect(balance).toBe(1300);
    expect(user.coinBalance).toBe(1300);
    expect(txns[0]).toMatchObject({
      type: TxnType.COIN_TOPUP,
      coinAmount: 1200,
      cashCents: 1200,
      paymentMethodType: 'cashapp',
      description: 'Top up',
    });
  });

  it('credits a bingo prize as COIN_REWARD', async () => {
    const { client, user } = makeMockPrisma(0);
    const balance = await creditCoins(client, 'u1', 1000, TxnType.COIN_REWARD, 'Bingo win');
    expect(balance).toBe(1000);
    expect(user.coinBalance).toBe(1000);
  });
});

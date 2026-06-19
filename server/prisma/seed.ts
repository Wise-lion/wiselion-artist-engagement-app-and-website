// Demo seed data: a user, a live stream + bingo game (with cards), a lotto draw,
// and a couple of merch products.
import { PrismaClient } from '@prisma/client';
import { generateUniqueCards } from '../src/utils/bingo';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@wiselion.app' },
    update: { coinBalance: 5000 },
    create: {
      firebaseUid: 'demo-uid',
      email: 'demo@wiselion.app',
      username: 'demo_fan',
      coinBalance: 5000,
    },
  });

  const stream = await prisma.stream.create({
    data: {
      title: 'Friday Night Wiselion Live',
      description: 'Bingo, lotto & vibes with the Wiselion King.',
      status: 'LIVE',
      scheduledAt: new Date(),
      muxPlaybackId: 'DEMO_PLAYBACK_ID',
    },
  });

  const game = await prisma.game.create({
    data: {
      streamId: stream.id,
      title: 'Opening Bingo Round',
      ticketPrice: 50,
      prize: 1000,
      status: 'LIVE',
      autoDrawSecs: 15,
    },
  });
  const cards = generateUniqueCards(1000);
  await prisma.card.createMany({
    data: cards.map((g) => ({ gameId: game.id, gridJson: g as any })),
  });

  await prisma.lottoDraw.create({
    data: {
      title: 'Weekly Mega Lotto',
      drawDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      ticketPrice: 100,
      prize: 50000,
    },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Wiselion Tee', description: 'Official gold-lion tee', priceCents: 2999, stock: 100, imageUrl: 'https://cdn.wiselion.app/tee.png' },
      { name: 'King Crown Hoodie', description: 'Premium members exclusive', priceCents: 5999, stock: 40, premiumOnly: true, imageUrl: 'https://cdn.wiselion.app/hoodie.png' },
    ],
  });

  console.log('✅ Seeded. Demo user:', user.email);
}

main().finally(() => prisma.$disconnect());

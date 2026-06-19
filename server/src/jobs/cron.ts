// Scheduled tasks: fire due lotto draws and auto-draw bingo numbers.
import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { runLottoDraw } from '../services/lotto';
import { drawNextNumber } from '../utils/bingo';
import { broadcastNewNumber } from '../socket';

export function startCronJobs() {
  // Every minute: run any lotto draws whose drawDate has passed and are still scheduled.
  cron.schedule('* * * * *', async () => {
    const due = await prisma.lottoDraw.findMany({
      where: { status: 'SCHEDULED', drawDate: { lte: new Date() } },
    });
    for (const d of due) {
      try {
        await runLottoDraw(d.id);
      } catch (e) {
        console.error(`Lotto draw ${d.id} failed`, e);
      }
    }
  });

  // Every 10s: auto-draw the next number for LIVE games that have autoDrawSecs set.
  // We track last-draw timing in-memory; good enough for a single drawing tick.
  const lastDraw = new Map<string, number>();
  cron.schedule('*/10 * * * * *', async () => {
    const games = await prisma.game.findMany({
      where: { status: 'LIVE', autoDrawSecs: { not: null } },
    });
    const now = Date.now();
    for (const g of games) {
      const interval = (g.autoDrawSecs || 0) * 1000;
      const last = lastDraw.get(g.id) || 0;
      if (now - last < interval) continue;

      const next = drawNextNumber(g.numbersDrawn);
      if (next == null) {
        await prisma.game.update({ where: { id: g.id }, data: { status: 'FINISHED' } });
        continue;
      }
      await prisma.game.update({
        where: { id: g.id },
        data: { numbersDrawn: { push: next } },
      });
      lastDraw.set(g.id, now);
      broadcastNewNumber(g.id, next);
    }
  });

  console.log('⏰ Cron jobs scheduled (lotto draws + bingo auto-draw)');
}

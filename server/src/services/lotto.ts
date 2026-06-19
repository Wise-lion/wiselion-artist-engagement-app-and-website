// Lotto draw execution. Winner is chosen with crypto.randomInt for an
// unbiased, unpredictable selection.
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { creditCoins } from '../utils/coins';
import { TxnType } from '@prisma/client';
import { broadcastLottoWinner } from '../socket';

/**
 * Pick the winning ticket index unbiasedly from [0, total).
 * Extracted as a pure function so the selection logic is unit-testable.
 */
export function selectWinnerIndex(total: number): number {
  if (total <= 0) throw new Error('selectWinnerIndex requires total > 0');
  return crypto.randomInt(0, total);
}

/**
 * Run a single lotto draw: pick a random ticket, credit the prize, persist,
 * and broadcast `lotto_winner` (drives the avatar announcement on clients).
 * Idempotent: a draw already FINISHED is skipped.
 */
export async function runLottoDraw(drawId: string) {
  const draw = await prisma.lottoDraw.findUnique({ where: { id: drawId } });
  if (!draw || draw.status === 'FINISHED') return;

  const tickets = await prisma.lottoTicket.findMany({
    where: { drawId },
    include: { user: true },
  });

  if (tickets.length === 0) {
    await prisma.lottoDraw.update({ where: { id: drawId }, data: { status: 'FINISHED' } });
    return;
  }

  // Unbiased index in [0, totalTickets).
  const winnerIndex = selectWinnerIndex(tickets.length);
  const winningTicket = tickets[winnerIndex];

  await prisma.$transaction(async (tx) => {
    await tx.lottoDraw.update({
      where: { id: drawId },
      data: { status: 'FINISHED', winningTicketId: winningTicket.id },
    });
    await creditCoins(
      prisma,
      winningTicket.userId,
      draw.prize,
      TxnType.COIN_REWARD,
      `Lotto win — ${draw.title}`,
      undefined,
      0,
      tx
    );
  });

  broadcastLottoWinner({
    drawId,
    winnerId: winningTicket.userId,
    winnerName: winningTicket.user.username,
    ticketNumber: winningTicket.number,
    prize: draw.prize,
  });
}

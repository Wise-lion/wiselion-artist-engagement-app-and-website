// Socket.io real-time layer: bingo number broadcasts, claim validation, chat,
// avatar triggers. Uses a Redis adapter so it scales across multiple instances.
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { resolveDevUser } from '../middleware/auth';
import { checkBingoWin, Grid } from '../utils/bingo';
import { creditCoins } from '../utils/coins';
import { TxnType } from '@prisma/client';

interface AuthedSocket extends Socket {
  userId?: string;
}

let io: Server;

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // Horizontal scaling: every node publishes/subscribes through Redis.
  const pub = new Redis(env.redisUrl);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  // Authenticate the socket handshake with a Firebase ID token (or dev stub).
  io.use(async (socket: AuthedSocket, next) => {
    try {
      // DEV_MODE: resolve a dev user, optionally keyed by handshake auth.uid.
      if (env.devMode) {
        const uid = (socket.handshake.auth?.uid as string) || 'dev-uid';
        const user = await resolveDevUser(uid);
        socket.userId = user.id;
        return next();
      }
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('No auth token'));
      const decoded = await firebaseAuth.verifyIdToken(token);
      const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
      if (!user) return next(new Error('Unknown user'));
      socket.userId = user.id;
      next();
    } catch {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    // ---- Room management ----
    socket.on('join_game', (gameId: string) => socket.join(`game:${gameId}`));
    socket.on('leave_game', (gameId: string) => socket.leave(`game:${gameId}`));
    socket.on('join_stream', (streamId: string) => socket.join(`stream:${streamId}`));
    socket.on('join_lotto', (drawId: string) => socket.join(`lotto:${drawId}`));

    // ---- Live chat (with custom emotes resolved client-side) ----
    socket.on('chat_message', async ({ streamId, text }: { streamId: string; text: string }) => {
      const user = await prisma.user.findUnique({ where: { id: socket.userId! } });
      if (!user || !text?.trim()) return;
      io.to(`stream:${streamId}`).emit('chat_message', {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        text: text.slice(0, 280),
        ts: Date.now(),
      });
    });

    /**
     * claim_bingo — the player thinks one of their cards is a winner.
     * The server is the source of truth: we re-validate every owned card in
     * this game against the official drawnNumbers list. Never trust the client.
     */
    socket.on('claim_bingo', async ({ gameId }: { gameId: string }) => {
      const userId = socket.userId!;
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game || game.status !== 'LIVE') return;

      const playerCards = await prisma.playerCard.findMany({
        where: { gameId, userId },
        include: { card: true },
      });

      const winning = playerCards.find((pc) =>
        checkBingoWin(pc.card.gridJson as Grid, game.numbersDrawn)
      );

      if (!winning) {
        socket.emit('claim_rejected', { gameId, reason: 'No valid line yet' });
        return;
      }

      // Determine if a winner already exists (split-prize support).
      const existingWinners = await prisma.playerCard.count({
        where: { gameId, isWinner: true },
      });

      // Mark this card a winner.
      await prisma.playerCard.update({ where: { id: winning.id }, data: { isWinner: true } });

      // Award prize. If there were already winners this is a split; we recompute
      // the per-winner share and top everyone up to the fair share.
      const totalWinners = existingWinners + 1;
      const share = Math.floor(game.prize / totalWinners);

      // Credit the new winner their share.
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await creditCoins(
        prisma,
        userId,
        share,
        TxnType.COIN_REWARD,
        `Bingo win — ${game.title}`
      );

      // Broadcast the win → triggers avatar 'cheering' + confetti on all clients.
      io.to(`game:${gameId}`).emit('bingo_win', {
        gameId,
        winnerId: userId,
        winnerName: user?.username,
        share,
        totalWinners,
      });
    });
  });

  return io;
}

// Called by the bingo route/cron when a number is drawn.
export function broadcastNewNumber(gameId: string, number: number) {
  getIO().to(`game:${gameId}`).emit('new_number', { gameId, number, drawType: 'bingo' });
}

// Called by the lotto job when a winner is selected.
export function broadcastLottoWinner(payload: {
  drawId: string;
  winnerId: string;
  winnerName: string;
  ticketNumber: string;
  prize: number;
}) {
  getIO().to(`lotto:${payload.drawId}`).emit('lotto_winner', payload);
}

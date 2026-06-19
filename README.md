# Wiselionlikeking 🦁👑

A mobile fan-engagement platform where fans watch exclusive live streams, play **live bingo** and **lotto** hosted by a branded **Wiselion avatar**, buy official merch, and manage paid memberships. Payments (Visa, Mastercard, Venmo, PayPal, Cash App Pay, Chime debit) are unified through **Stripe**, with in-app coin purchases via **RevenueCat**.

## Monorepo Layout

```
wiselionlikeking/
├── mobile/        # React Native (Expo) app — fans
├── server/        # Node.js + Express + Prisma API + Socket.io + cron
└── admin-web/     # React admin panel — schedule streams/games/draws, inventory, analytics
```

## Architecture Overview

```
                      ┌──────────────────────────┐
                      │     Mobile (RN/Expo)      │
                      │  Zustand · Socket.io · RC  │
                      │  Stripe RN · Lottie · AV   │
                      └────────────┬──────────────┘
                                   │ REST + WS
                      ┌────────────▼──────────────┐
   Firebase Auth ◄────┤        Express API        ├────► Stripe (PaymentIntents,
   (verify ID token)  │  Prisma · Socket.io · cron │      Billing, Webhooks)
                      └──────┬───────────┬────────┘
                             │           │
                      ┌──────▼──┐   ┌────▼─────┐   ┌──────────┐
                      │ Postgres│   │  Redis   │   │   Mux    │
                      │ (Prisma)│   │ (pub/sub │   │ (live    │
                      └─────────┘   │  + socket│   │ streams) │
                                    │  adapter)│   └──────────┘
                                    └──────────┘
```

### Real-time event flow (bingo)
1. Admin/cron draws a number → `POST /bingo/:gameId/draw`.
2. Server persists number, broadcasts `new_number` (`{ number, drawType: 'bingo' }`) to the game room.
3. Mobile receives `new_number` → auto-daubs cards, sets `WiselionAvatar` to `talking`, plays audio via `useAvatarAudio`.
4. Player taps **BINGO!** → emits `claim_bingo`. Server validates with `checkBingoWin`. First valid claim(s) win → broadcasts `bingo_win` → avatar `cheering` + confetti.

### Payment flow (merch / coins / subscriptions)
- Server creates a Stripe **PaymentIntent** with `payment_method_types: ['card','paypal','venmo','cashapp']`.
- Mobile calls `initPaymentSheet` + `presentPaymentSheet()`. The sheet adapts and shows cards (incl. Chime debit), PayPal, Venmo, Cash App Pay. **No separate SDKs.**
- Stripe webhook `payment_intent.succeeded` fulfils the order, records `Transaction.paymentMethodType`, and credits coins / activates membership.

## Setup

### Prerequisites
- Node 20+, pnpm/npm, PostgreSQL 15+, Redis 7+
- Stripe account, Firebase project, Mux account, RevenueCat account

### 1. Server
```bash
cd server
cp .env.example .env       # fill in secrets
npm install
npx prisma migrate dev --name init
npm run seed               # optional demo data
npm run dev                # http://localhost:4000
```
Run the Stripe webhook listener in another shell:
```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

### 2. Mobile
```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

### 3. Admin Web
```bash
cd admin-web
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## Key Implementation Notes
- **Bingo cards**: 1000 unique 5×5 cards generated at game creation (`generateUniqueCards`), columns B-I-N-G-O constrained to 1-15, 16-30, 31-45, 46-60, 61-75; center is free.
- **Bingo validation**: `checkBingoWin(cardGrid, drawnNumbers)` checks all rows, columns, and both diagonals. Always validated server-side on `claim_bingo`.
- **Lotto draw**: `node-cron` job fires at `drawDate`; winner chosen with `crypto.randomInt(0, totalTickets)` for unbiased selection.
- **Avatar state machine**: `idle → talking → idle` per number; `→ cheering (5s) → idle` on win. See `mobile/src/components/WiselionAvatar`.
- **Coins**: every credit/deduction writes a `Transaction` row (type + description) inside a DB transaction to stay consistent.

## Replace before production
- Lottie placeholder JSON in `mobile/src/components/WiselionAvatar/animations/*`.
- Avatar audio files on the CDN at `AVATAR_AUDIO_BASE_URL` (`bingo_1.mp3`…`bingo_75.mp3`, `lotto_1.mp3`…, `drawing.mp3`, `winner.mp3`).
- All API keys / secrets in the `.env` files.

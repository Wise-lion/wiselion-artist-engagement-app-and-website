# Wiselionlikeking — System Architecture

A mobile fan-engagement platform: exclusive live streams, live **bingo** and
**lotto** hosted by a branded Wiselion avatar, a media library (songs / audio
messages / videos), official merch, and paid memberships. Payments are unified
through **Stripe** (+ RevenueCat for in-app coins); prize settlement uses the
**XRP Ledger**.

> Status: development. `DEV_MODE` stubs auth + payments so the system runs
> locally with no external accounts. Real keys + the compliance gate (regulated
> gambling) are required before production. See `ARCHITECTURE.md#risks`.

---

## 1. Component map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                       │
│                                                                            │
│   Mobile app (React Native / Expo)            Admin web (React + Vite)     │
│   ─ Zustand state                             ─ schedule streams           │
│   ─ Socket.io client (bingo/chat/avatar)      ─ bingo games / lotto draws  │
│   ─ Stripe RN + RevenueCat (payments/IAP)     ─ merch + media management   │
│   ─ expo-av (audio/video) · Lottie (avatar)   ─ DEMO_MODE for offline use  │
└───────────────┬───────────────────────────────────────┬───────────────────┘
                │ REST (HTTPS) + WebSocket                │ REST
                ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      API SERVER  (Node + Express + TS)                     │
│                                                                            │
│  Routes: users · streams · bingo · lotto(+status) · merch · wallet ·       │
│          subscriptions · media(+kick) · webhooks                           │
│  Middleware: Firebase auth (DEV_MODE stub) · admin allowlist               │
│  Socket.io: new_number · claim_bingo (server-validated) · chat · lotto_win │
│  Cron: lotto draws · bingo auto-draw · (AMM deploy/harvest)                │
│  Services: lotto (RNG) · kick (HLS) · chain (XRPL AMM)                     │
└──┬───────┬───────────┬───────────┬───────────┬───────────┬─────────────────┘
   │       │           │           │           │           │
   ▼       ▼           ▼           ▼           ▼           ▼
Postgres  Redis      Firebase    Stripe      Mux        XRPL / Kick
(Prisma)  (socket    (Auth +     (Payments,  (live      (settlement,
          adapter)   push)       Billing,    streams)   live HLS)
                                 webhooks)
```

---

## 2. Tech stack

| Layer | Choice | Why |
|------|--------|-----|
| Mobile | React Native (Expo SDK 51), TypeScript | one codebase, OTA updates, EAS builds |
| Mobile state | Zustand | tiny, no boilerplate; stores for auth, cart, bingo, player |
| Realtime | Socket.io (client + server) | rooms per game/stream/draw; Redis adapter scales it |
| Audio/Video | expo-av, expo-speech | track playback, mp4/HLS, TTS fallback for avatar calls |
| Avatar | Lottie + branded PNG | idle/talking/cheering state machine |
| Payments | Stripe (PaymentIntents, Billing) + RevenueCat (IAP) | one sheet for card/PayPal/Venmo/Cash App/Chime; IAP for coins |
| Server | Node + Express + TypeScript | simple, well-understood |
| ORM/DB | Prisma + PostgreSQL | typed schema + migrations |
| Cache/PubSub | Redis | Socket.io adapter, future rate-limit/session |
| Auth | Firebase Auth (Admin SDK verifies ID tokens) | email + social, push via FCM |
| Live video | Mux (primary) + Kick HLS (fallback/alt) | managed streaming + platform-independent feed |
| Settlement | XRP Ledger (xrpl.js) | fast/cheap payouts, native Escrow + AMM |
| Admin | React + Vite | lightweight internal panel |
| Tests/CI | Jest + ts-jest, GitHub Actions | unit tests + typecheck gate |
| Builds | EAS (dev client / preview / production) | native modules need real builds |

---

## 3. Data model (Prisma)

Core entities and the key relationships:

- **User** `(firebaseUid, email, username, tier, coinBalance, stripeCustomerId)`
  → has one **Membership**, many **PlayerCard / LottoTicket / Order / Transaction**.
- **Stream** `(status, scheduledAt, muxPlaybackId, kickChannel, premiumOnly)`
  → has many **Game**.
- **Game** (bingo) `(streamId, ticketPrice, prize, status, autoDrawSecs, numbersDrawn[])`
  → has many **Card** (1000 generated templates) and **PlayerCard** (owned cards).
- **Card** `(gameId, gridJson)` — a 5×5 template. **PlayerCard** links a User to a Card in a Game (`isWinner`).
- **LottoDraw** `(drawDate, ticketPrice, prize, status, winningTicketId)` plus the
  **Prize Growth Engine** fields: `initialPotXrp, ammYieldEarnedXrp, aiBoosterInjectedXrp, isRolledOver, ammLpBalance, ammStatus`.
  → has many **LottoTicket**.
- **Product / Order / OrderItem** — merch; `Order.paymentMethodType` records the
  actual method used (card/paypal/venmo/cashapp).
- **Transaction** `(type, coinAmount, cashCents, paymentMethodType, description)` —
  the immutable ledger for every coin/cash movement.
- **MediaItem** `(kind: SONG|AUDIO_MESSAGE|VIDEO, url, artworkUrl, platformLinks,
  ownedBackupUrl, platformStatus, kickChannel, premiumOnly)` — media library +
  deplatforming resilience.

**Money invariant:** coin balance and the `Transaction` ledger are always written
together inside one DB transaction (`spendCoins` / `creditCoins`), so they never drift.

---

## 4. Key flows

### 4.1 Authentication
1. Client signs in with Firebase (email/Google/Apple) → gets an ID token.
2. Every REST call sends `Authorization: Bearer <token>`; sockets send it in the handshake.
3. Server middleware verifies via Firebase Admin and **lazily provisions** a local
   `User` keyed by `firebaseUid`. `DEV_MODE` bypasses verification with a stub user.

### 4.2 Live bingo (realtime, server-authoritative)
```
admin/cron draws ──► POST /bingo/:id/draw ──► persist numbersDrawn
        │                                            │
        └────────────── Socket: new_number ──────────┘  (drawType:'bingo')
                                  │
   mobile: auto-daub cards · WiselionAvatar→'talking' · useAvatarAudio plays call
                                  │
   player taps BINGO! ──► Socket: claim_bingo ──► server re-runs checkBingoWin
                                  │                against official numbersDrawn
                          valid? ─┤── no ─► claim_rejected
                                  └── yes ─► mark winner, creditCoins(prize share)
                                            Socket: bingo_win ──► avatar 'cheering' + confetti
```
The client never decides wins. `checkBingoWin(grid, drawn)` (rows/cols/diagonals,
free center) is validated on the server. Multiple simultaneous winners split the prize.

### 4.3 Lotto + Prize Growth Engine
- Tickets bought with coins (`spendCoins`).
- **Pot growth (3 engines):** `displayedPot = initialPot + ammYield + aiBooster`.
  - *Rollover*: unwon pot folds into the next round's `initialPot` (`isRolledOver`).
  - *AMM yield*: between draws the pot is single-sided-deposited into the XRPL XRP/USDC
    AMM (`chain.deployPotToAMM`); swap fees accrue; harvested pre-draw (`harvestPrizePool`).
  - *AI booster*: house wallet injects funds if the pot stalls below a threshold.
- **Draw:** `node-cron` fires at `drawDate` → `selectWinnerIndex(total)` =
  `crypto.randomInt(0, total)` (unbiased) → credit prize → Socket `lotto_winner`
  → avatar "drawing" suspense, then cheer + confetti.
- `GET /lotto/status` exposes the composed pot + rollover tag to the app.

### 4.4 Payments (unified)
```
Merch / coins / subscription
        │ server creates Stripe PaymentIntent
        │   payment_method_types: ['card','paypal','cashapp', (venmo when enabled)]
        ▼
mobile presentPaymentSheet()  ── sheet adapts: cards (incl. Chime debit), PayPal,
        │                          Venmo, Cash App, Apple/Google Pay wallets
        ▼
Stripe webhook payment_intent.succeeded / invoice.paid
        │  ─ merch: mark order PAID, decrement stock, record paymentMethodType
        │  ─ coins: creditCoins (idempotent guard on PI id)
        │  ─ subscription: flip tier→PREMIUM, upsert Membership
```
In-app coin purchases go through **RevenueCat** (device wallet → Chime included),
credited via the RevenueCat webhook. Chime needs **no special handling** — it rides
in as a Visa debit / wallet card.

### 4.5 Media + deplatforming resilience
Source priority the app enforces: **(1) owned content** (`url`/`ownedBackupUrl`,
always preferred) → **(2) native Kick live** (HLS via `/media/kick/:slug`) →
**(3) external platform links**, minus any an admin marks `removed` in
`platformStatus`. So a ban on YouTube/IG/TikTok is a data flip, not an app update.
The same Kick HLS fallback powers the Live tab when Mux is absent.

---

## 5. Realtime & scaling
- Socket.io rooms: `game:<id>`, `stream:<id>`, `lotto:<id>`.
- The **Redis adapter** lets multiple API instances broadcast consistently → the
  server scales horizontally behind a load balancer.
- Cron currently runs in-process; at multi-instance scale move it to a single
  worker (or a leader-locked job) to avoid duplicate draws.

---

## 6. Security model
- All API/socket access requires a verified Firebase token (except the Stripe
  webhook, which is verified by signature with the raw body).
- Admin routes gated by an email allowlist (`ADMIN_EMAILS`); harden to a custom
  claim before production.
- Server is authoritative for all wins, prices, and balances — clients are never trusted.
- Secrets via env / EAS secrets; never committed. `DEV_MODE` must be `false` in prod.
- Webhook idempotency guards prevent double credits on redelivery.

---

## 7. Environments & config
| | Local dev | Production |
|---|---|---|
| Auth | `DEV_MODE` stub (`x-dev-uid`) | Firebase Admin verify |
| Payments | Stripe stub returns fake clientSecret | live Stripe + RevenueCat |
| DB / cache | local Postgres + Redis | managed Postgres + Redis |
| XRPL | testnet (or unset) | mainnet, funded treasury |
| Mobile | Expo Go (payments stubbed) | EAS dev client / store build |
| Admin | `VITE_DEMO_MODE=true` | real API + Firebase login |

Config is read from `EXPO_PUBLIC_*` (mobile), `VITE_*` (admin), and `.env` (server,
via `lib/env.ts`). See each package's `.env.example` and `BUILD.md`.

---

## 8. Testing & CI
- **Unit tests (Jest):** bingo card generation + `checkBingoWin` + `drawNextNumber`;
  lotto `selectWinnerIndex` (range + uniformity); coin `spend/credit` ledger atomicity
  and `InsufficientCoinsError`.
- **CI (GitHub Actions):** `server-tests` (jest) + `typecheck` (`tsc --noEmit`) on every push/PR.
- **Next:** integration tests for webhooks → fulfilment against a test DB; device E2E
  on the EAS dev client; Socket.io load tests for concurrent bingo.

---

## 9. Deployment topology (target)
- **API**: container on Render/Railway/Fly/AWS, autoscaled, behind HTTPS + domain.
- **Postgres + Redis**: managed instances; `prisma migrate deploy` on release.
- **Webhooks**: Stripe + RevenueCat endpoints with live signing secrets.
- **Mux**: live credentials; **XRPL**: funded treasury wallet + AMM cron worker.
- **Mobile**: EAS builds → TestFlight / Play internal → production; OTA via `eas update`.
- **Admin**: static build (Vite) on any static host.

---

## 10. Risks & open items  {#risks}
1. **Regulatory (blocking):** real-money bingo/lotto is regulated gambling — needs
   licensing, geo-restriction, AML/KYC, and store-specific gambling approval. Pooling
   user prize funds into an AMM and a dynamic AI house edge add securities / money-
   transmitter scrutiny. **Resolve with counsel before production.**
2. **AMM impermanent loss:** if `initialPotXrp` is fully deployed, an adverse XRP/USDC
   move can return less than principal — the treasury must guarantee advertised pots
   (capitalize a buffer or deploy only a slice).
3. **Kick public endpoint** is Cloudflare-fronted and may 403 from servers — use the
   official API (`KICK_CLIENT_ID/SECRET`) in production.
4. **Cron at scale** must be single-writer to avoid duplicate draws.
5. **Placeholders to replace:** avatar PNG + Lottie rigs, avatar audio on the CDN,
   media URLs, all API keys.
6. **`chain.ts` not yet wired** to a cron — yield is currently seeded, not live.

---

## 11. Repo layout
```
wiselionlikeking/
├── mobile/      React Native app (screens, components, stores, services, hooks)
│   └── BUILD.md, eas.json, app.json
├── server/      Express API (routes, services, socket, jobs, lib, utils, prisma)
│   └── src/**/*.test.ts (Jest), db/migrations/*.sql
├── admin-web/   React + Vite admin panel
├── .github/workflows/ci.yml
├── ARCHITECTURE.md  (this file)
├── README.md · DEV_RUN.md
```

# Wiselionlikeking — Pre-Flight Checklist

The living checklist to verify everything works **before going online**. Work top
to bottom: Phase 1 needs no accounts; later phases add real services. Tick boxes
as you go (`- [x]`).

> Surfaces & ports
> | Surface | Start | URL |
> |---|---|---|
> | Server (API) | `cd server && npm run dev` | http://localhost:4000 |
> | Admin panel | `cd admin-web && npm run dev -- --port 5174` | http://localhost:5174 |
> | Website | `cd website && npm run dev` | http://localhost:5175 |
> | Mobile app | `cd mobile && npx expo start` | Expo Go on phone |
> | War Room | `cd ~/Desktop/Code/claudeclaw/warroom && python server.py` | ws://localhost:7860 |
>
> Prereqs: `brew services start postgresql@16 redis`

---

## Phase 0 — Compliance gate (BLOCKING — resolve before store submission)
- [ ] Legal opinion on real-money bingo/lotto (licensing per jurisdiction)
- [ ] Decide model: regulated lottery vs sweepstakes/promotion
- [ ] Geo-restriction plan for unlicensed regions
- [ ] AML/KYC on payouts; money-transmitter analysis for coin wallet + XRP cash-out
- [ ] Apple real-money-gaming requirements (licensed entity, geo-limited, free download)
- [ ] Google Play gambling-app application + per-country allowlist
- [ ] Securities/yield review of the XRPL AMM prize-growth model

---

## Phase 1 — Local testing, FREE (DEV_MODE, no accounts)

### Infrastructure
- [ ] `brew services start postgresql@16 redis`
- [ ] `pg_isready` → accepting connections
- [ ] `redis-cli ping` → PONG
- [ ] `cd server && npx prisma migrate dev && npm run seed`

### Automated
- [ ] `cd server && npm test` → 20/20 pass
- [ ] `cd server && npx tsc -p tsconfig.json --noEmit` → exit 0
- [ ] Mobile bundle compiles: `npx expo start` then load on device (no red screen)

### Server API (DEV_MODE=true)
- [ ] `GET /health` → `{ ok: true }`
- [ ] `GET /api/users/me` (header `x-dev-uid: dev-uid`) → user with coins
- [ ] Buy bingo card → coins deducted, grid returned
- [ ] Draw number → `numbersDrawn` grows
- [ ] Merch checkout → returns a (stub) clientSecret + order created
- [ ] `GET /api/lotto/status` → composed pot + rollover tag
- [ ] `GET /api/media?kind=SONG` → seeded media
- [ ] `GET /api/visibility/warroom/status` → `{ online: false }` (War Room off)

### Admin panel (DEMO_MODE)
- [ ] Dashboard counts render
- [ ] Create a stream, set LIVE
- [ ] Create a bingo game (+1000 cards), start, draw a number
- [ ] Schedule a lotto draw; run it
- [ ] Add a product; bump stock
- [ ] Add media (song / message / video with platform links)
- [ ] Visibility: generate drafts, Approve and Reject one

### Website (localhost:5175)
- [ ] All sections render: hero, music, tours, merch, reel, mission, pride
- [ ] MP3 player plays "Dust Trails and Neon Vibes" (scrubber works)
- [ ] Drop Reel animates with real tee images
- [ ] Merch shows the 8 real tee designs
- [ ] No console errors

### Mobile app (Expo Go)
- [ ] Lands in app (dev auth, no login)
- [ ] Bingo: buy card → avatar calls numbers → BINGO! → confetti + prize
- [ ] Lotto: buy ticket → prize-growth pot card shows
- [ ] Media tab: play a song (mini-player), open a video + platform links
- [ ] Store: browse, add to cart, Watch the Drop (reel), checkout (dev)
- [ ] Wallet: balance + transaction history
- [ ] Profile → Mission screen (conservation content)

✅ Passing Phase 1 = all UX, game logic, and data flows are correct.

---

## Phase 2 — Configure real services
Copy each `.env.example` → `.env` and fill in. Then set `DEV_MODE=false` (server)
and `EXPO_PUBLIC_DEV_MODE=false` (mobile).

- [ ] **Firebase** — project + service account → `server/.env` (FIREBASE_*); web config → `mobile/.env` (EXPO_PUBLIC_FIREBASE_*)
- [ ] **Stripe (TEST keys first)** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs → `server/.env`; `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `mobile/.env`
- [ ] **RevenueCat** — iOS/Android public keys → `mobile/.env`; webhook secret → `server/.env`
- [ ] **Mux** — `MUX_TOKEN_ID/SECRET` → `server/.env`
- [ ] **Kick** — `KICK_CLIENT_ID/SECRET` → `server/.env`
- [ ] **Postgres + Redis** — managed instances → `server/.env` (DATABASE_URL, REDIS_URL)
- [ ] **XRPL (testnet first)** — `XRPL_RPC_URL`, `XRPL_TREASURY_SEED` → `server/.env`
- [ ] **War Room** — `GOOGLE_API_KEY` → `claudeclaw/.env`; `WARROOM_URL`, `AUTO_PROMOTE` → `server/.env`
- [ ] **Admin** — `ADMIN_EMAILS` allowlist → `server/.env`; real Firebase config + `VITE_DEMO_MODE=false` → `admin-web/.env`
- [ ] **CDN** — host avatar audio, drop-reel WebP, hero image; set `EXPO_PUBLIC_DROP_REEL_BASE_URL`, `EXPO_PUBLIC_AVATAR_AUDIO_BASE_URL`

---

## Phase 3 — Test with real services (staging)

### Payments (REQUIRES an EAS dev-client build — Expo Go can't run Stripe/RevenueCat)
- [ ] `cd mobile && npx expo install expo-dev-client && eas build --profile development`
- [ ] Install the dev build on a device; `npx expo start --dev-client`
- [ ] Merch checkout with a **Stripe test card** → webhook → order PAID → stock decremented
- [ ] Coin top-up (RevenueCat sandbox) → coins credited
- [ ] Premium subscribe → tier flips to PREMIUM (via webhook)
- [ ] Cash App / PayPal options appear in the sheet

### Auth & realtime
- [ ] Real Firebase login (email + Google + Apple)
- [ ] Socket.io: two devices in one bingo game both see `new_number`; claim validated server-side
- [ ] Live chat works across devices

### Streaming & media
- [ ] Mux live stream plays; premium-only gating works
- [ ] Kick channel returns live HLS (with real `KICK_CLIENT_ID/SECRET`)
- [ ] Media plays from CDN URLs

### XRPL (testnet)
- [ ] Fund a testnet treasury wallet
- [ ] Run a lotto payout → confirm tx hash on testnet
- [ ] (Optional) AMM deploy/harvest cycle returns yield

### War Room automation
- [ ] Start War Room with Gemini key
- [ ] Admin Visibility status → ONLINE
- [ ] Generate drafts → real AI copy returns
- [ ] Approve → @comms publish path fires
- [ ] `AUTO_PROMOTE=true` → scheduling a draw auto-creates drafts

---

## Phase 4 — Production deploy & go-live

### Backend
- [ ] Deploy API (Render/Railway/Fly/AWS) behind HTTPS + domain
- [ ] Managed Postgres + Redis; `prisma migrate deploy`
- [ ] Live Stripe webhook → deployed `/api/webhooks/stripe`
- [ ] Live RevenueCat webhook
- [ ] XRPL mainnet treasury funded; AMM cron (single-writer) running
- [ ] CI re-activated (restore `CI_WORKFLOW.yml.txt` → `.github/workflows/ci.yml` with a `workflow`-scoped token)

### Mobile store submission
- [ ] `eas build --profile production` (iOS + Android)
- [ ] TestFlight + Play Internal beta with real users
- [ ] Load-test Socket.io for concurrent bingo
- [ ] App icons, splash, screenshots, privacy policy + App Privacy labels
- [ ] Account-deletion flow (Apple requirement), 17+/18+ age rating
- [ ] `eas submit` with gambling-license docs + geo-restriction config

### Website
- [ ] `npm run build`; deploy to static host (Vercel/Netlify)
- [ ] Hosted hero image / Higgsfield video at `public/hero-lion.*`
- [ ] Point merch/reel images at the shared CDN (WebP)

### Operations
- [ ] Error tracking (Sentry) on app + server
- [ ] Analytics, on-call for payment/payout failures
- [ ] Rollback plan; secrets in a vault (never in git)
- [ ] **Revoke any tokens/keys ever pasted in chat or committed**

---

## Replace-before-production (placeholders)
- [ ] `mobile/assets/wiselion-avatar.png` — real golden lion-king art
- [ ] Lottie rigs in `mobile/src/components/WiselionAvatar/animations/*`
- [ ] Avatar audio on CDN (`bingo_1.mp3`…`lotto_99.mp3`, `drawing.mp3`, `winner.mp3`)
- [ ] `website/public/hero-lion.png` — real hero art / video
- [ ] All API keys / secrets in every `.env`

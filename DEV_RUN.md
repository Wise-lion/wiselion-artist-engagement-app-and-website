# Running Wiselionlikeking locally (DEV_MODE — no Firebase/Stripe needed)

DEV_MODE stubs auth (any request = a dev user with 5000 coins) and payments,
so everything runs offline. Postgres + Redis must be running.

## One-time
```bash
brew services start postgresql@16
brew services start redis
createdb wiselion              # if not already created
cd server && npm install && npx prisma migrate dev && npm run seed
cd ../mobile && npm install
cd ../admin-web && npm install
```

## Start everything (3 terminals)

**1 — API server** (http://localhost:4000)
```bash
cd server && npm run dev
```

**2 — Mobile app** (Expo)
```bash
cd mobile && npx expo start --lan
# Open Expo Go on your phone (same Wi-Fi) and scan the QR,
# or enter:  exp://<your-LAN-IP>:8081
```
If Metro crashes with EMFILE: `ulimit -n 65536` before `expo start`,
or `EXPO_USE_WATCHMAN=0 npx expo start`.

**3 — Admin panel** (http://localhost:5174)
```bash
cd admin-web && npm run dev -- --port 5174
```

## What works in DEV_MODE / Expo Go
- ✅ Streams list & detail, live chat (Socket.io)
- ✅ **Bingo**: buy cards, auto-draw, Wiselion avatar calls numbers (TTS until
  you add real audio files), auto-daub, claim → win → confetti
- ✅ **Lotto**: buy tickets, run draw, avatar announces winner + confetti
- ✅ Store browsing, cart, dev checkout (order created via API)
- ✅ Wallet balance & transaction history, Profile
- ⚠️ Real Payment Sheet (Stripe) & RevenueCat IAP need a dev-client build
  (`npx expo run:ios`) — they are stubbed in Expo Go.

## Switch to real services later
Set `DEV_MODE=false` in `server/.env` and `EXPO_PUBLIC_DEV_MODE=false` in
`mobile/.env`, then fill in the Firebase / Stripe / Mux keys in both `.env` files.

## Replace placeholders
- `mobile/assets/wiselion-avatar.png` — currently a gold placeholder; drop in the
  real golden lion-king art (same filename).
- Avatar audio on your CDN at `EXPO_PUBLIC_AVATAR_AUDIO_BASE_URL`.

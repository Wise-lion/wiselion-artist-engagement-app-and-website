# Building & Shipping the Wiselionlikeking app (EAS)

Expo Go can't run the native payment SDKs (Stripe, RevenueCat). To test payments
and ship to TestFlight / Play, you need **EAS builds** with a **dev client**.

## Prerequisites
- An [Expo account](https://expo.dev) (free).
- **Apple Developer Program** ($99/yr) for iOS, **Google Play Developer** ($25 once) for Android.
- `EXPO_PUBLIC_DEV_MODE=false` for any real build (set per-profile in `eas.json`).

## 0. One-time setup
```bash
cd mobile
npm i -g eas-cli
npx expo install expo-dev-client   # enables the development build
eas login
eas init                           # creates the project + fills extra.eas.projectId in app.json
```

## 1. Provide real secrets (EAS env / secrets)
The app reads `EXPO_PUBLIC_*` at build time. Set them as EAS secrets so they're
baked into each build (never commit real keys):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.wiselion.app/api
eas secret:create --scope project --name EXPO_PUBLIC_SOCKET_URL --value https://api.wiselion.app
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value ...
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value ...
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value ...
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value ...
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_live_...
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_...
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_...
eas secret:create --scope project --name EXPO_PUBLIC_AVATAR_AUDIO_BASE_URL --value https://cdn.wiselion.app/audio
```

## 2. Development build (test payments on a real device)
```bash
eas build --profile development --platform ios       # or android
# Install the resulting build on your device (QR / link), then:
npx expo start --dev-client
```
Now the Stripe Payment Sheet, RevenueCat IAP, and subscriptions actually run.
Test: merch checkout, coin top-up, Premium subscribe, bingo/lotto, media, Kick.

## 3. Preview build (share with testers, no dev server)
```bash
eas build --profile preview --platform all
```

## 4. Production build + store submission
```bash
eas build --profile production --platform all
eas submit --profile production --platform ios       # fill appleId/ascAppId/appleTeamId in eas.json
eas submit --profile production --platform android   # add play-service-account.json
```

## 5. OTA updates (JS-only changes, no rebuild)
```bash
npx expo install expo-updates
eas update --branch production --message "copy + bug fixes"
```
(Native changes — new native deps, permissions — always require a new build.)

## ⚠️ Before store review
- **Gambling/licensing**: real-money bingo/lotto requires licenses + geo-restriction.
  Apple requires the dev account hold the licenses; Google needs a per-country
  gambling-app application. Resolve with counsel BEFORE submitting.
- Privacy policy + App Privacy labels, account-deletion flow, 17+/18+ age rating,
  screenshots, support URL.
- Replace placeholder assets: `assets/wiselion-avatar.png`, avatar audio on the CDN.

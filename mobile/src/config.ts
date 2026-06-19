// Centralized runtime config sourced from Expo public env vars.
// DEV_MODE: skip Firebase auth + native payment SDKs so the app runs in Expo Go.
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export const config = {
  devMode: DEV_MODE,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:4000',
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  },
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeMerchantId: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID || 'merchant.app.wiselion',
  revenueCat: {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
  },
  avatarAudioBaseUrl: process.env.EXPO_PUBLIC_AVATAR_AUDIO_BASE_URL || 'https://cdn.wiselion.app/audio',
};

// Brand palette inspired by the golden Wiselion King avatar.
export const theme = {
  gold: '#D4A026',
  goldLight: '#F2C94C',
  bronze: '#8C5A1E',
  deepBlue: '#0B1E3F',
  bg: '#0A0F1F',
  card: '#13203B',
  text: '#F5F3EC',
  textDim: '#9AA6BF',
  red: '#E2483A',
  green: '#28C76F',
};

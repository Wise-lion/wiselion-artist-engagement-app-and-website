import dotenv from 'dotenv';
dotenv.config();

// DEV_MODE relaxes external-service requirements so the server boots locally
// without Firebase/Stripe accounts: auth is stubbed and Stripe is mocked.
export const DEV_MODE = process.env.DEV_MODE === 'true';

function req(name: string): string {
  const v = process.env[name];
  if (!v) {
    if (DEV_MODE) return ''; // tolerated in dev; consumers guard on DEV_MODE
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  devMode: DEV_MODE,
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  databaseUrl: req('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  firebase: {
    projectId: req('FIREBASE_PROJECT_ID'),
    clientEmail: req('FIREBASE_CLIENT_EMAIL'),
    // Render \n escapes from .env into real newlines for the PEM key.
    privateKey: req('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  stripe: {
    secretKey: req('STRIPE_SECRET_KEY'),
    webhookSecret: req('STRIPE_WEBHOOK_SECRET'),
    pricePremiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    pricePremiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
  },
  mux: {
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
  },
  coinUsdRate: parseFloat(process.env.COIN_USD_RATE || '0.01'),
};

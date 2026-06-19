import Stripe from 'stripe';
import { env, DEV_MODE } from './env';

// In DEV_MODE without a key, expose a stub that returns fake PaymentIntents /
// customers / subscriptions so payment endpoints work end-to-end offline.
function makeStripe(): Stripe {
  if (DEV_MODE && !env.stripe.secretKey) {
    const fakeId = (p: string) => `${p}_dev_${Math.random().toString(36).slice(2, 10)}`;
    const stub: any = {
      customers: {
        create: async (args: any) => ({ id: fakeId('cus'), ...args }),
      },
      paymentIntents: {
        create: async (args: any) => ({
          id: fakeId('pi'),
          client_secret: `${fakeId('pi')}_secret_dev`,
          ...args,
        }),
      },
      subscriptions: {
        create: async (args: any) => ({
          id: fakeId('sub'),
          latest_invoice: { payment_intent: { client_secret: `${fakeId('pi')}_secret_dev` } },
          ...args,
        }),
        update: async (id: string, args: any) => ({ id, ...args }),
        retrieve: async (id: string) => ({ id, metadata: {}, current_period_end: Math.floor(Date.now() / 1000) + 2592000 }),
      },
      webhooks: {
        constructEvent: () => {
          throw new Error('Stripe webhooks are disabled in DEV_MODE');
        },
      },
    };
    return stub as Stripe;
  }
  return new Stripe(env.stripe.secretKey, { apiVersion: '2024-06-20' });
}

export const stripe = makeStripe();

// The unified set of methods the Payment Sheet should offer.
// Cards include Visa, Mastercard, and Chime (a Visa debit card) automatically.
export const PAYMENT_METHOD_TYPES: NonNullable<Stripe.PaymentIntentCreateParams['payment_method_types']> = [
  'card',
  'paypal',
  'cashapp',
  // 'venmo' is enabled per-account; Stripe surfaces it inside the PayPal/wallet flow
  // where eligible. Add it explicitly if your account has the capability:
  // 'venmo' as any,
];

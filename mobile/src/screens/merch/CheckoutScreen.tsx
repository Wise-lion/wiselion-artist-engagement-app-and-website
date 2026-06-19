// CheckoutScreen — unified payment via Stripe Payment Sheet.
//
// The server creates a PaymentIntent with payment_method_types
// ['card','paypal','venmo','cashapp']; the sheet renders every method eligible
// for the device/region. Cards include Visa, Mastercard, and Chime (Visa debit)
// automatically — no per-method code here. Order fulfilment happens server-side
// in the Stripe webhook on payment_intent.succeeded.
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Endpoints } from '../../services/api';
import { theme, DEV_MODE } from '../../config';

// In Expo Go (DEV_MODE) the native Stripe SDK is unavailable, so we render a
// variant that skips useStripe. A dev-client/production build uses the real one.
export default function CheckoutScreen() {
  return DEV_MODE ? <DevCheckout /> : <StripeCheckout />;
}

function StripeCheckout() {
  const nav = useNavigation<any>();
  const { useStripe } = require('@stripe/stripe-react-native');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { items, totalCents, clear } = useCartStore();
  const profile = useAuthStore((s) => s.profile);
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      // 1. Ask the server to create the Order + PaymentIntent.
      const { clientSecret, customerId } = await Endpoints.checkout(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );

      // 2. Initialise the Payment Sheet. enabling Apple/Google Pay surfaces the
      //    device wallet (which includes Chime and other linked debit cards).
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Wiselionlikeking',
        paymentIntentClientSecret: clientSecret,
        customerId,
        allowsDelayedPaymentMethods: true, // required for Cash App Pay / PayPal
        applePay: { merchantCountryCode: 'US' },
        googlePay: { merchantCountryCode: 'US', testEnv: true },
        defaultBillingDetails: { email: profile?.email },
      });
      if (initError) throw new Error(initError.message);

      // 3. Present it. The user picks card / PayPal / Venmo / Cash App Pay.
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') Alert.alert('Payment failed', payError.message);
        return;
      }

      // 4. Success. The webhook fulfils the order; clear the local cart.
      clear();
      Alert.alert('🎉 Order placed!', 'Thanks for supporting the Wiselion King.');
      nav.navigate('Tabs');
    } catch (e: any) {
      Alert.alert('Checkout error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const shipping = profile?.tier === 'PREMIUM' ? 0 : 599;

  return (
    <Screen>
      <Title>Checkout</Title>
      <Card style={{ marginTop: 16 }}>
        {items.map((i) => (
          <View key={i.productId} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
            <Body>{i.name} × {i.quantity}</Body>
            <Body>${((i.priceCents * i.quantity) / 100).toFixed(2)}</Body>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: theme.bronze, marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body>Shipping</Body>
          <Body>{shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}</Body>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Title style={{ fontSize: 16 }}>Total</Title>
          <Title style={{ fontSize: 16, color: theme.goldLight }}>
            ${((totalCents() + shipping) / 100).toFixed(2)}
          </Title>
        </View>
      </Card>

      <Body style={{ marginTop: 16 }}>
        Pay with card (incl. Chime debit), PayPal, Venmo, or Cash App Pay.
      </Body>
      <Button title="Pay Now" loading={loading} onPress={pay} disabled={items.length === 0} style={{ marginTop: 8 }} />
    </Screen>
  );
}

// DEV_MODE checkout: places the order through the API (Stripe stubbed server-side)
// without the native Payment Sheet, so the flow is demoable in Expo Go.
function DevCheckout() {
  const nav = useNavigation<any>();
  const { items, totalCents, clear } = useCartStore();
  const profile = useAuthStore((s) => s.profile);
  const [loading, setLoading] = useState(false);
  const shipping = profile?.tier === 'PREMIUM' ? 0 : 599;

  const pay = async () => {
    setLoading(true);
    try {
      await Endpoints.checkout(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      clear();
      Alert.alert('🎉 Order placed! (dev)', 'Payment Sheet is skipped in Expo Go; order created via API.');
      nav.navigate('Tabs');
    } catch (e: any) {
      Alert.alert('Checkout error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Checkout</Title>
      <Card style={{ marginTop: 16 }}>
        {items.map((i) => (
          <View key={i.productId} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
            <Body>{i.name} × {i.quantity}</Body>
            <Body>${((i.priceCents * i.quantity) / 100).toFixed(2)}</Body>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: theme.bronze, marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Title style={{ fontSize: 16 }}>Total</Title>
          <Title style={{ fontSize: 16, color: theme.goldLight }}>
            ${((totalCents() + shipping) / 100).toFixed(2)}
          </Title>
        </View>
      </Card>
      <Body style={{ marginTop: 16, color: theme.goldLight }}>
        🎬 Dev build: the unified Payment Sheet (card/PayPal/Venmo/Cash App) appears in a real dev-client build.
      </Body>
      <Button title="Place Order (dev)" loading={loading} onPress={pay} disabled={items.length === 0} style={{ marginTop: 8 }} />
    </Screen>
  );
}

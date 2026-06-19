// MembershipScreen — subscribe to Premium via Stripe Billing. The subscription's
// first invoice PaymentIntent is paid through the same unified Payment Sheet
// (card / PayPal / Cash App). Tier flips to PREMIUM via the webhook.
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { theme, DEV_MODE } from '../../config';

export default function MembershipScreen() {
  return DEV_MODE ? <DevMembership /> : <StripeMembership />;
}

function StripeMembership() {
  const nav = useNavigation<any>();
  const { useStripe } = require('@stripe/stripe-react-native');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const profile = useAuthStore((s) => s.profile);
  const [loading, setLoading] = useState<'MONTHLY' | 'YEARLY' | null>(null);

  const subscribe = async (plan: 'MONTHLY' | 'YEARLY') => {
    setLoading(plan);
    try {
      const { clientSecret, customerId } = await Endpoints.subscribe(plan);
      const { error: initErr } = await initPaymentSheet({
        merchantDisplayName: 'Wiselionlikeking',
        paymentIntentClientSecret: clientSecret,
        customerId,
        allowsDelayedPaymentMethods: true,
      });
      if (initErr) throw new Error(initErr.message);

      const { error: payErr } = await presentPaymentSheet();
      if (payErr) {
        if (payErr.code !== 'Canceled') Alert.alert('Payment failed', payErr.message);
        return;
      }
      // Webhook flips tier → poll the profile.
      setTimeout(refreshProfile, 2500);
      Alert.alert('Welcome to Premium 👑', 'Your perks are unlocking now.');
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Subscription error', e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen>
      <Title>Wiselion Premium 👑</Title>
      <Card style={{ marginTop: 16 }}>
        <Body style={{ color: theme.text }}>• Exclusive premium-only streams</Body>
        <Body style={{ color: theme.text }}>• Free merch shipping</Body>
        <Body style={{ color: theme.text }}>• Exclusive merch drops</Body>
        <Body style={{ color: theme.text }}>• Premium tier badge</Body>
      </Card>

      {profile?.tier === 'PREMIUM' ? (
        <Body style={{ marginTop: 20, color: theme.goldLight }}>You're already Premium. Thank you! 🦁</Body>
      ) : (
        <>
          <Button title="Monthly" loading={loading === 'MONTHLY'} onPress={() => subscribe('MONTHLY')} style={{ marginTop: 20 }} />
          <Button variant="ghost" title="Yearly (save 20%)" loading={loading === 'YEARLY'} onPress={() => subscribe('YEARLY')} />
        </>
      )}
    </Screen>
  );
}

// DEV_MODE: subscription billing needs the native Payment Sheet (not in Expo Go).
function DevMembership() {
  const profile = useAuthStore((s) => s.profile);
  return (
    <Screen>
      <Title>Wiselion Premium 👑</Title>
      <Card style={{ marginTop: 16 }}>
        <Body style={{ color: theme.text }}>• Exclusive premium-only streams</Body>
        <Body style={{ color: theme.text }}>• Free merch shipping</Body>
        <Body style={{ color: theme.text }}>• Exclusive merch drops</Body>
        <Body style={{ color: theme.text }}>• Premium tier badge</Body>
      </Card>
      <Body style={{ marginTop: 20, color: theme.goldLight }}>
        🎬 Dev build: subscribe with the unified Payment Sheet in a real dev-client/production build.
        {profile?.tier === 'PREMIUM' ? ' You are currently Premium.' : ''}
      </Body>
    </Screen>
  );
}

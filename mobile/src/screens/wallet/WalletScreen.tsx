// WalletScreen — coin balance, top-up via RevenueCat IAP (device wallet → Chime
// debit included automatically), and transaction history.
import React, { useCallback, useState } from 'react';
import { FlatList, Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { theme, DEV_MODE } from '../../config';

export default function WalletScreen() {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [txns, setTxns] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setTxns(await Endpoints.transactions().catch(() => []));
    await refreshProfile();
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Purchase a coin pack through RevenueCat. The server credits coins on the
  // RevenueCat webhook. Payment runs through the device wallet (Apple/Google
  // Pay), which natively supports Chime and other linked debit cards.
  const buyCoins = async (productId: string) => {
    // Expo Go has no RevenueCat native module; simulate a top-up via the API
    // so the wallet flow is demoable. Real IAP runs in a dev-client build.
    if (DEV_MODE) {
      Alert.alert(
        'Dev top-up',
        'RevenueCat IAP needs a dev-client build. Coins can be granted via the server in dev.'
      );
      return;
    }
    const Purchases = require('react-native-purchases').default;
    setBusy(true);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
      if (!pkg) throw new Error('Coin pack not available');
      await Purchases.purchasePackage(pkg);
      Alert.alert('Purchase complete', 'Coins will appear shortly.');
      setTimeout(load, 2000); // webhook credit lands async
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center', marginBottom: 16 }}>
        <Body>Coin Balance</Body>
        <Title style={{ fontSize: 40, color: theme.goldLight }}>{profile?.coinBalance ?? 0} 🪙</Title>
      </Card>

      <Title style={{ fontSize: 16, marginBottom: 8 }}>Top Up</Title>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="500 🪙" loading={busy} onPress={() => buyCoins('coins_500')} style={{ flex: 1 }} />
        <Button title="1,200 🪙" loading={busy} onPress={() => buyCoins('coins_1200')} style={{ flex: 1 }} />
        <Button title="3,000 🪙" loading={busy} onPress={() => buyCoins('coins_3000')} style={{ flex: 1 }} />
      </View>

      <Title style={{ fontSize: 16, marginTop: 16, marginBottom: 8 }}>History</Title>
      <FlatList
        data={txns}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<Body>No transactions yet.</Body>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Body style={{ color: theme.text }}>{item.description}</Body>
              <Body style={{ fontSize: 11 }}>{new Date(item.createdAt).toLocaleString()}</Body>
            </View>
            <Title style={{ fontSize: 16, color: item.coinAmount >= 0 ? theme.green : theme.red }}>
              {item.coinAmount >= 0 ? '+' : ''}{item.coinAmount} 🪙
            </Title>
          </Card>
        )}
      />
    </Screen>
  );
}

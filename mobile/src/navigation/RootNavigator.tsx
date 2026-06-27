import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../config';
import AuthScreen from '../screens/auth/AuthScreen';
import TabNavigator from './TabNavigator';
import StreamDetailScreen from '../screens/streams/StreamDetailScreen';
import BingoScreen from '../screens/bingo/BingoScreen';
import LottoDetailScreen from '../screens/lotto/LottoDetailScreen';
import ProductDetailScreen from '../screens/merch/ProductDetailScreen';
import CartScreen from '../screens/merch/CartScreen';
import CheckoutScreen from '../screens/merch/CheckoutScreen';
import MembershipScreen from '../screens/profile/MembershipScreen';
import VideoScreen from '../screens/media/VideoScreen';
import DropReelScreen from '../screens/drop/DropReelScreen';
import MissionScreen from '../screens/mission/MissionScreen';

export type RootStackParams = {
  Tabs: undefined;
  StreamDetail: { streamId: string };
  Bingo: { gameId: string; streamId: string };
  LottoDetail: { drawId: string };
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  Membership: undefined;
  Video: { item: any };
  DropReel: undefined;
  Mission: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();

const navTheme = {
  dark: true,
  colors: {
    primary: theme.gold,
    background: theme.bg,
    card: theme.card,
    text: theme.text,
    border: theme.bronze,
    notification: theme.red,
  },
};

export default function RootNavigator() {
  const { firebaseUser, initializing } = useAuthStore();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.gold} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme as any}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.goldLight,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        {!firebaseUser ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="StreamDetail" component={StreamDetailScreen} options={{ title: 'Live' }} />
            <Stack.Screen name="Bingo" component={BingoScreen} options={{ title: 'Wiselion Bingo' }} />
            <Stack.Screen name="LottoDetail" component={LottoDetailScreen} options={{ title: 'Lotto Draw' }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
            <Stack.Screen name="Membership" component={MembershipScreen} options={{ title: 'Go Premium' }} />
            <Stack.Screen name="Video" component={VideoScreen} options={{ title: 'Watch' }} />
            <Stack.Screen name="DropReel" component={DropReelScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Mission" component={MissionScreen} options={{ title: 'The Mission' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../config';
import StreamListScreen from '../screens/streams/StreamListScreen';
import LottoListScreen from '../screens/lotto/LottoListScreen';
import StoreScreen from '../screens/merch/StoreScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MediaScreen from '../screens/media/MediaScreen';

const Tab = createBottomTabNavigator();

// Simple emoji icons keep the tree dependency-free; swap for vector icons later.
const icon = (e: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{e}</Text>;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.goldLight,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.bronze },
        tabBarActiveTintColor: theme.goldLight,
        tabBarInactiveTintColor: theme.textDim,
      }}
    >
      <Tab.Screen name="Live" component={StreamListScreen} options={{ tabBarIcon: icon('📺') }} />
      <Tab.Screen name="Media" component={MediaScreen} options={{ tabBarIcon: icon('🎵') }} />
      <Tab.Screen name="Lotto" component={LottoListScreen} options={{ tabBarIcon: icon('🎰') }} />
      <Tab.Screen name="Store" component={StoreScreen} options={{ tabBarIcon: icon('🛍️') }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ tabBarIcon: icon('🪙') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👑') }} />
    </Tab.Navigator>
  );
}

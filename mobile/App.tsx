import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { config, DEV_MODE } from './src/config';
import { useAuthStore } from './src/store/useAuthStore';
import RootNavigator from './src/navigation/RootNavigator';
import { MiniPlayer } from './src/components/MiniPlayer';
import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Cinzel_500Medium, Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

// Native payment SDKs (@stripe/stripe-react-native, react-native-purchases) do
// NOT run in Expo Go. In DEV_MODE we skip them entirely so the core app runs on
// a phone via Expo Go. For a production/dev-client build, set EXPO_PUBLIC_DEV_MODE
// to false and these initialize normally.
function PaymentsProvider({ children }: { children: React.ReactNode }) {
  if (DEV_MODE) return <>{children}</>;
  // Lazy require so the native module isn't loaded under Expo Go.
  const { StripeProvider } = require('@stripe/stripe-react-native');
  return (
    <StripeProvider publishableKey={config.stripePublishableKey} merchantIdentifier={config.stripeMerchantId}>
      {children}
    </StripeProvider>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  // Drop Reel brand fonts. Don't block app launch on them — render either way;
  // the reel falls back to system fonts until these load.
  useFonts({
    Anton_400Regular,
    Cinzel_500Medium,
    Cinzel_700Bold,
    Cinzel_900Black,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    init();
    if (!DEV_MODE) {
      // RevenueCat in-app purchases (device wallet → Chime included automatically).
      const Purchases = require('react-native-purchases').default;
      const apiKey = Platform.OS === 'ios' ? config.revenueCat.ios : config.revenueCat.android;
      if (apiKey) Purchases.configure({ apiKey });
    }
  }, []);

  return (
    <PaymentsProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <RootNavigator />
          <GlobalPlayer />
        </View>
      </SafeAreaProvider>
    </PaymentsProvider>
  );
}

// Floats the audio MiniPlayer above the tab bar on every screen once signed in.
function GlobalPlayer() {
  const user = useAuthStore((s) => s.firebaseUser);
  if (!user) return null;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 60 }} pointerEvents="box-none">
      <MiniPlayer />
    </View>
  );
}

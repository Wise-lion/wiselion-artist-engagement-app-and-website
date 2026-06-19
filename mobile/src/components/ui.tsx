// Tiny shared UI kit so screens stay consistent and concise.
import React from 'react';
import {
  Text,
  TextProps,
  Pressable,
  PressableProps,
  View,
  ViewProps,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { theme } from '../config';

export const Screen: React.FC<ViewProps> = ({ style, ...p }) => (
  <View style={[{ flex: 1, backgroundColor: theme.bg, padding: 16 }, style]} {...p} />
);

export const Title: React.FC<TextProps> = ({ style, ...p }) => (
  <Text style={[{ color: theme.text, fontSize: 22, fontWeight: '800' }, style]} {...p} />
);

export const Body: React.FC<TextProps> = ({ style, ...p }) => (
  <Text style={[{ color: theme.textDim, fontSize: 14 }, style]} {...p} />
);

export const Card: React.FC<ViewProps> = ({ style, ...p }) => (
  <View
    style={[
      { backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E2C4A' },
      style,
    ]}
    {...p}
  />
);

interface BtnProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'gold' | 'ghost';
}
export const Button: React.FC<BtnProps> = ({ title, loading, variant = 'gold', disabled, style, ...p }) => (
  <Pressable
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.btn,
      variant === 'gold' ? styles.gold : styles.ghost,
      (disabled || loading) && { opacity: 0.5 },
      pressed && { opacity: 0.85 },
      style as any,
    ]}
    {...p}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'gold' ? theme.deepBlue : theme.gold} />
    ) : (
      <Text style={[styles.btnText, { color: variant === 'gold' ? theme.deepBlue : theme.goldLight }]}>
        {title}
      </Text>
    )}
  </Pressable>
);

export const TierBadge: React.FC<{ tier: 'FREE' | 'PREMIUM' }> = ({ tier }) => (
  <View style={[styles.badge, { backgroundColor: tier === 'PREMIUM' ? theme.gold : theme.bronze }]}>
    <Text style={{ color: theme.deepBlue, fontWeight: '800', fontSize: 12 }}>
      {tier === 'PREMIUM' ? '👑 PREMIUM' : 'FREE'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 6 },
  gold: { backgroundColor: theme.gold },
  ghost: { borderWidth: 1, borderColor: theme.gold },
  btnText: { fontWeight: '800', fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
});

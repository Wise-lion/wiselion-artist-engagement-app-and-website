// WiselionAvatar — the branded golden lion-king character that hosts bingo & lotto.
//
// AVATAR STATE MACHINE
// --------------------
//        ┌──────────── new_number ─────────────┐
//        ▼                                      │
//     [idle] ── talking() ──► [talking] ──(audio ends / timeout)──► [idle]
//        ▲                                      │
//        └──── (5s timer) ◄── [cheering] ◄── win()
//
// Parent screens set the `state` prop in response to socket events. The
// component renders the branded PNG hero (assets/wiselion-avatar.png) with a
// Lottie animation layer on top driven by the current state. If a real Lottie
// rig is supplied it animates; otherwise the PNG + CSS-style transforms carry it.
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../../config';

import idle from './animations/idle.json';
import talking from './animations/talking.json';
import cheering from './animations/cheering.json';

export type AvatarState = 'idle' | 'talking' | 'cheering';

const ANIMATIONS: Record<AvatarState, any> = { idle, talking, cheering };

interface Props {
  state: AvatarState;
  size?: number;
  caption?: string; // e.g. the number being called: "N 42"
}

export const WiselionAvatar: React.FC<Props> = ({ state, size = 180, caption }) => {
  const lottieRef = useRef<LottieView>(null);
  // Subtle pulse so the static PNG still feels alive when Lottie is a placeholder.
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    lottieRef.current?.reset();
    lottieRef.current?.play();

    // Drive transforms per state: gentle breathing on idle, talk bob, cheer bounce.
    const config =
      state === 'cheering'
        ? { toScale: 1.12, duration: 280, glowTo: 1 }
        : state === 'talking'
        ? { toScale: 1.05, duration: 180, glowTo: 0.8 }
        : { toScale: 1.02, duration: 1400, glowTo: 0.35 };

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: config.toScale, duration: config.duration, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: config.duration, useNativeDriver: true }),
      ])
    );
    Animated.timing(glow, { toValue: config.glowTo, duration: 300, useNativeDriver: false }).start();
    loop.start();
    return () => loop.stop();
  }, [state]);

  const ringColor =
    state === 'cheering' ? theme.goldLight : state === 'talking' ? theme.gold : theme.bronze;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Glowing aura ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
            opacity: glow,
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        {/* Branded hero art (the golden cybernetic lion-king). */}
        <Image
          source={require('../../../assets/wiselion-avatar.png')}
          style={{ width: size * 0.86, height: size * 0.86, borderRadius: (size * 0.86) / 2 }}
          resizeMode="cover"
        />
        {/* Lottie expression layer overlaid on the face. Replace placeholders
            with production rigs and this becomes the primary animation. */}
        <LottieView
          ref={lottieRef}
          source={ANIMATIONS[state]}
          autoPlay
          loop={state !== 'cheering'}
          style={StyleSheet.absoluteFillObject as any}
        />
      </Animated.View>

      {caption ? (
        <View style={styles.caption}>
          <Text style={styles.captionText}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 3 },
  caption: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: theme.deepBlue,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.gold,
  },
  captionText: { color: theme.goldLight, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});

export default WiselionAvatar;

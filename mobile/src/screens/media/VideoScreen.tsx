// VideoScreen — resilient video playback.
//
// SOURCE PRIORITY (deplatforming-safe):
//   1. Owned content we control: item.url || item.ownedBackupUrl (always preferred)
//   2. Native Kick live (HLS) if a kickChannel is set and the channel is live
//   3. External platform deep-links (YouTube/Spotify/etc.), MINUS any platform an
//      admin has marked "removed" in item.platformStatus.
//
// So if a social platform bans the creator, the admin flips that platform to
// "removed" and the app keeps serving owned content + Kick — no app update needed.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRoute } from '@react-navigation/native';
import { Screen, Title, Body } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { theme } from '../../config';

const PLATFORMS: Record<string, { label: string; icon: string }> = {
  youtube: { label: 'YouTube', icon: '▶' },
  spotify: { label: 'Spotify', icon: '♫' },
  apple: { label: 'Apple Music', icon: '' },
  instagram: { label: 'Instagram', icon: '◉' },
  tiktok: { label: 'TikTok', icon: '♪' },
  kick: { label: 'Kick', icon: '◆' },
};

export default function VideoScreen() {
  const { item } = useRoute<any>().params;
  const links: Record<string, string> = item.platformLinks || {};
  const status: Record<string, string> = item.platformStatus || {};

  // Owned source always wins.
  const ownedUri: string | undefined = item.url || item.ownedBackupUrl;
  const [activeUri, setActiveUri] = useState<string | undefined>(ownedUri);
  const [kick, setKick] = useState<any>(null);
  const [loadingKick, setLoadingKick] = useState(false);

  // Resolve Kick live status up front so we can offer native playback.
  useEffect(() => {
    if (!item.kickChannel) return;
    setLoadingKick(true);
    Endpoints.kick(item.kickChannel)
      .then(setKick)
      .catch(() => setKick(null))
      .finally(() => setLoadingKick(false));
  }, [item.kickChannel]);

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  // Only show platform links that aren't marked removed.
  const visibleLinks = Object.entries(links).filter(([k]) => status[k] !== 'removed');

  return (
    <Screen style={{ padding: 0 }}>
      <View style={styles.player}>
        {activeUri ? (
          <Video source={{ uri: activeUri }} style={{ flex: 1 }} resizeMode={ResizeMode.CONTAIN} useNativeControls shouldPlay />
        ) : (
          <View style={styles.placeholder}>
            <Text style={{ fontSize: 40, color: theme.gold }}>▶</Text>
            <Body style={{ marginTop: 8 }}>Pick a source below</Body>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{item.title}</Title>
        {item.description ? <Body style={{ marginTop: 6 }}>{item.description}</Body> : null}

        {/* Owned-content indicator — reassures that playback is platform-independent. */}
        {ownedUri && activeUri === ownedUri && (
          <View style={styles.ownedTag}>
            <Text style={styles.ownedTagText}>● Playing Wiselion-hosted copy</Text>
          </View>
        )}

        {/* Native Kick live (HLS) — works even if other platforms are gone. */}
        {item.kickChannel && (
          <View style={{ marginTop: 16 }}>
            <Body style={{ color: theme.text, marginBottom: 8 }}>Kick live</Body>
            {loadingKick ? (
              <ActivityIndicator color={theme.gold} />
            ) : kick?.isLive && kick?.playbackUrl ? (
              <Pressable style={styles.liveBtn} onPress={() => setActiveUri(kick.playbackUrl)}>
                <Text style={styles.liveDot}>● LIVE</Text>
                <Text style={styles.linkLabel}>Watch {item.kickChannel} on Kick (in-app)</Text>
              </Pressable>
            ) : (
              <Body>Offline right now.</Body>
            )}
          </View>
        )}

        {visibleLinks.length > 0 && (
          <>
            <Body style={{ marginTop: 18, marginBottom: 8, color: theme.text }}>Watch / listen on</Body>
            {visibleLinks.map(([key, url]) => {
              const meta = PLATFORMS[key] || { label: key, icon: '↗' };
              return (
                <Pressable key={key} onPress={() => open(url)} style={styles.linkBtn}>
                  <Text style={styles.linkIcon}>{meta.icon || '↗'}</Text>
                  <Text style={styles.linkLabel}>{meta.label}</Text>
                  <Text style={styles.linkArrow}>↗</Text>
                </Pressable>
              );
            })}
          </>
        )}

        {visibleLinks.length === 0 && !ownedUri && !item.kickChannel && (
          <Body style={{ marginTop: 16 }}>This content is temporarily unavailable.</Body>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { height: 220, backgroundColor: '#000', justifyContent: 'center' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ownedTag: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: theme.deepBlue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.green },
  ownedTagText: { color: theme.green, fontSize: 12, fontWeight: '700' },
  liveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.green },
  liveDot: { color: theme.red, fontWeight: '800', fontSize: 13, marginRight: 10 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.bronze },
  linkIcon: { color: theme.goldLight, fontSize: 18, width: 26 },
  linkLabel: { color: theme.text, fontSize: 15, fontWeight: '700', flex: 1 },
  linkArrow: { color: theme.goldLight, fontSize: 16 },
});

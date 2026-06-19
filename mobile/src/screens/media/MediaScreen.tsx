// MediaScreen — browse Wiselion songs, audio messages, and videos.
// Songs/messages tap to play in the global audio player (MiniPlayer at bottom).
// Videos navigate to the VideoScreen (mp4 + platform links).
import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, Image, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, TierBadge } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { usePlayerStore, Track } from '../../store/usePlayerStore';
import { theme } from '../../config';

type Tab = 'SONG' | 'AUDIO_MESSAGE' | 'VIDEO';
const TABS: { key: Tab; label: string }[] = [
  { key: 'SONG', label: 'Songs' },
  { key: 'AUDIO_MESSAGE', label: 'Messages' },
  { key: 'VIDEO', label: 'Videos' },
];

const mmss = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

export default function MediaScreen() {
  const nav = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('SONG');
  const [items, setItems] = useState<any[]>([]);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentId = usePlayerStore((s) => s.current()?.id);

  const load = useCallback((k: Tab) => {
    Endpoints.media(k).then(setItems).catch(() => setItems([]));
  }, []);

  useFocusEffect(useCallback(() => { load(tab); }, [tab, load]));

  const onPress = (item: any, listIndex: number) => {
    if (tab === 'VIDEO') {
      nav.navigate('Video', { item });
      return;
    }
    // Build an audio queue from the current list and start at the tapped track.
    // Prefer the self-hosted owned copy so playback survives any platform ban.
    const queue: Track[] = items
      .map((i) => ({ ...i, _play: i.url || i.ownedBackupUrl }))
      .filter((i) => i._play)
      .map((i) => ({ id: i.id, title: i.title, artist: i.artist, url: i._play, artworkUrl: i.artworkUrl, durationSec: i.durationSec }));
    const startIndex = queue.findIndex((q) => q.id === item.id);
    playQueue(queue, Math.max(0, startIndex));
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Title>Wiselion Media</Title>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabOn]}>
              <Text style={{ color: tab === t.key ? theme.deepBlue : theme.textDim, fontWeight: '700', fontSize: 13 }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={<Body>Nothing here yet.</Body>}
        renderItem={({ item, index }) => {
          const playing = item.id === currentId;
          return (
            <Pressable onPress={() => onPress(item, index)} style={[styles.row, playing && styles.rowOn]}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.art} />
              ) : (
                <View style={[styles.art, styles.artFallback]}>
                  <Text style={{ color: theme.goldLight, fontSize: 20 }}>{tab === 'VIDEO' ? '▶' : '♪'}</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.sub}>
                  {item.artist || item.description || 'Wiselion'} {item.durationSec ? `· ${mmss(item.durationSec)}` : ''}
                </Text>
                {item.premiumOnly && <View style={{ marginTop: 4 }}><TierBadge tier="PREMIUM" /></View>}
              </View>
              <Text style={styles.cta}>{tab === 'VIDEO' ? '›' : playing ? '♫' : '▶'}</Text>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.bronze },
  tabOn: { backgroundColor: theme.gold, borderColor: theme.gold },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#1E2C4A' },
  rowOn: { borderColor: theme.goldLight },
  art: { width: 52, height: 52, borderRadius: 8, backgroundColor: theme.bg },
  artFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.text, fontSize: 15, fontWeight: '700' },
  sub: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  cta: { color: theme.goldLight, fontSize: 18, paddingHorizontal: 8 },
});

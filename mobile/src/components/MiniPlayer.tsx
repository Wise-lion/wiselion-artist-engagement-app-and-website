// Sticky audio controls shown while a track is loaded. Play/pause, skip, scrub.
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { theme } from '../config';

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const MiniPlayer: React.FC = () => {
  const { queue, isPlaying, positionMs, durationMs, current, toggle, next, prev } = usePlayerStore();
  const track = current();
  if (!track || queue.length === 0) return null;

  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.row}>
        {track.artworkUrl ? (
          <Image source={{ uri: track.artworkUrl }} style={styles.art} />
        ) : (
          <View style={[styles.art, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: theme.goldLight }}>♪</Text>
          </View>
        )}
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.sub}>
            {track.artist || 'Wiselion'} · {mmss(positionMs)} / {mmss(durationMs)}
          </Text>
        </View>
        <Pressable onPress={prev} hitSlop={10}><Text style={styles.ctrl}>⏮</Text></Pressable>
        <Pressable onPress={toggle} hitSlop={10}><Text style={styles.ctrl}>{isPlaying ? '⏸' : '▶'}</Text></Pressable>
        <Pressable onPress={next} hitSlop={10}><Text style={styles.ctrl}>⏭</Text></Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.bronze },
  progressTrack: { height: 3, backgroundColor: theme.bg },
  progressFill: { height: 3, backgroundColor: theme.gold },
  row: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  art: { width: 40, height: 40, borderRadius: 6, backgroundColor: theme.bg },
  title: { color: theme.text, fontSize: 13, fontWeight: '700' },
  sub: { color: theme.textDim, fontSize: 11 },
  ctrl: { color: theme.goldLight, fontSize: 20, paddingHorizontal: 8 },
});

export default MiniPlayer;

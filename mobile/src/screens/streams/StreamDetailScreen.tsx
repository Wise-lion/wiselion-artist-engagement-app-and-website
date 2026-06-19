import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, TextInput, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../config';

interface ChatMsg { userId: string; username: string; text: string; ts: number }

// Resolve custom emote shortcodes to emoji.
const EMOTES: Record<string, string> = { ':lion:': '🦁', ':crown:': '👑', ':fire:': '🔥', ':coin:': '🪙' };
const renderEmotes = (t: string) => t.replace(/:\w+:/g, (m) => EMOTES[m] || m);

export default function StreamDetailScreen() {
  const { streamId } = useRoute<any>().params;
  const nav = useNavigation<any>();
  const profile = useAuthStore((s) => s.profile);
  const [stream, setStream] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<any>(null);

  const [kick, setKick] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await Endpoints.stream(streamId);
        setStream(s);
        // If a Kick channel is configured, resolve its live HLS as a fallback /
        // alternative to Mux — keeps the stream alive if Mux is down or unused.
        if (s.kickChannel) {
          Endpoints.kick(s.kickChannel).then(setKick).catch(() => {});
        }
      } catch (e: any) {
        if (e.body?.premiumOnly) {
          Alert.alert('Premium only', 'Upgrade to watch this stream.', [
            { text: 'Go Premium', onPress: () => nav.navigate('Membership') },
            { text: 'Cancel', style: 'cancel', onPress: () => nav.goBack() },
          ]);
        }
      }

      const socket = await connectSocket();
      socketRef.current = socket;
      socket.emit('join_stream', streamId);
      socket.on('chat_message', (m: ChatMsg) => setMessages((prev) => [...prev.slice(-100), m]));
    })();

    return () => {
      socketRef.current?.off('chat_message');
    };
  }, [streamId]);

  const send = () => {
    if (!text.trim()) return;
    socketRef.current?.emit('chat_message', { streamId, text });
    setText('');
  };

  if (!stream) return <Screen><Body>Loading stream…</Body></Screen>;

  // Playback priority: Mux if configured, otherwise native Kick live (HLS).
  const playbackUri = stream.muxPlaybackId
    ? `https://stream.mux.com/${stream.muxPlaybackId}.m3u8`
    : kick?.isLive && kick?.playbackUrl
    ? kick.playbackUrl
    : null;
  const onKick = !stream.muxPlaybackId && !!kick?.isLive;

  return (
    <Screen style={{ padding: 0 }}>
      <View style={styles.player}>
        {playbackUri ? (
          <Video
            source={{ uri: playbackUri }}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            useNativeControls
          />
        ) : (
          <Body style={{ color: '#fff', alignSelf: 'center' }}>Stream offline</Body>
        )}
        {onKick && (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: theme.deepBlue, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: theme.green }}>
            <Text style={{ color: theme.green, fontWeight: '800', fontSize: 11 }}>● LIVE ON KICK</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Title>{stream.title}</Title>
        {stream.games?.map((g: any) => (
          <Card key={g.id} style={{ marginTop: 10 }}>
            <Title style={{ fontSize: 16 }}>🎱 {g.title}</Title>
            <Body>Card price: {g.ticketPrice} 🪙 · Prize: {g.prize} 🪙</Body>
            <Button
              title="Join Bingo"
              onPress={() => nav.navigate('Bingo', { gameId: g.id, streamId })}
            />
          </Card>
        ))}
      </View>

      {/* Live chat */}
      <FlatList
        style={{ flex: 1, paddingHorizontal: 16 }}
        data={messages}
        keyExtractor={(m) => `${m.userId}-${m.ts}`}
        renderItem={({ item }) => (
          <Text style={{ color: theme.text, marginVertical: 2 }}>
            <Text style={{ color: theme.goldLight, fontWeight: '700' }}>{item.username}: </Text>
            {renderEmotes(item.text)}
          </Text>
        )}
      />

      <View style={styles.chatBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Say something… :lion: :crown:"
          placeholderTextColor={theme.textDim}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={styles.sendBtn}>
          <Text style={{ color: theme.deepBlue, fontWeight: '800' }}>Send</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { height: 220, backgroundColor: '#000', justifyContent: 'center' },
  chatBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: theme.card },
  chatInput: { flex: 1, backgroundColor: theme.bg, color: theme.text, borderRadius: 10, paddingHorizontal: 12 },
  sendBtn: { backgroundColor: theme.gold, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
});

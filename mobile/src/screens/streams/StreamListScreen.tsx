import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, View, Image, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Card, TierBadge } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { theme } from '../../config';

export default function StreamListScreen() {
  const nav = useNavigation<any>();
  const [streams, setStreams] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setStreams(await Endpoints.streams());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <Title style={{ marginBottom: 12 }}>Live & Upcoming</Title>
      <FlatList
        data={streams}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.gold} />}
        ListEmptyComponent={<Body>No streams scheduled. Pull to refresh.</Body>}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('StreamDetail', { streamId: item.id })}>
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title style={{ fontSize: 18, flex: 1 }}>{item.title}</Title>
                {item.status === 'LIVE' ? (
                  <View style={{ backgroundColor: theme.red, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Body style={{ color: '#fff', fontWeight: '800' }}>● LIVE</Body>
                  </View>
                ) : (
                  <Body>{new Date(item.scheduledAt).toLocaleString()}</Body>
                )}
              </View>
              <Body style={{ marginTop: 6 }}>{item.description}</Body>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                {item.premiumOnly && <TierBadge tier="PREMIUM" />}
                {item.games?.length > 0 && <Body>🎱 {item.games.length} bingo game(s)</Body>}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

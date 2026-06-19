import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Card } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { theme } from '../../config';

export default function LottoListScreen() {
  const nav = useNavigation<any>();
  const [draws, setDraws] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setDraws(await Endpoints.lottoDraws()); } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <Title style={{ marginBottom: 12 }}>🎰 Lotto Draws</Title>
      <FlatList
        data={draws}
        keyExtractor={(d) => d.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.gold} />}
        ListEmptyComponent={<Body>No upcoming draws.</Body>}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('LottoDetail', { drawId: item.id })}>
            <Card style={{ marginBottom: 12 }}>
              <Title style={{ fontSize: 18 }}>{item.title}</Title>
              <Body style={{ marginTop: 4 }}>Prize: {item.prize.toLocaleString()} 🪙</Body>
              <Body>Ticket: {item.ticketPrice} 🪙</Body>
              <Body style={{ color: theme.goldLight, marginTop: 4 }}>
                Draws {new Date(item.drawDate).toLocaleString()}
              </Body>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

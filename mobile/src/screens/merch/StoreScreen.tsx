import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Image, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Card, TierBadge, Button } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { useCartStore } from '../../store/useCartStore';
import { theme } from '../../config';

export default function StoreScreen() {
  const nav = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const add = useCartStore((s) => s.add);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  useFocusEffect(
    useCallback(() => {
      Endpoints.products().then(setProducts).catch(() => {});
    }, [])
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>🛍️ Official Merch</Title>
        <Pressable onPress={() => nav.navigate('Cart')}>
          <Body style={{ color: theme.goldLight }}>Cart ({cartCount})</Body>
        </Pressable>
      </View>
      <FlatList
        style={{ marginTop: 12 }}
        data={products}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={<Body>No products yet.</Body>}
        renderItem={({ item }) => (
          <Card style={{ flex: 1, marginBottom: 12 }}>
            <Pressable onPress={() => nav.navigate('ProductDetail', { productId: item.id })}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 120, borderRadius: 8 }} />
              )}
              <Title style={{ fontSize: 15, marginTop: 8 }}>{item.name}</Title>
              <Body style={{ color: theme.goldLight }}>${(item.priceCents / 100).toFixed(2)}</Body>
              {item.premiumOnly && <View style={{ marginTop: 4 }}><TierBadge tier="PREMIUM" /></View>}
            </Pressable>
            <Button
              title="Add to Cart"
              onPress={() => add({ productId: item.id, name: item.name, priceCents: item.priceCents, imageUrl: item.imageUrl })}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

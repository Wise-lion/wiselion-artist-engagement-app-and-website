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

      {/* Cinematic promo for the latest drop (Wiselion × Tribe of Kings). */}
      <Pressable
        onPress={() => nav.navigate('DropReel')}
        style={{ marginTop: 12, backgroundColor: '#080607', borderRadius: 14, borderWidth: 1, borderColor: '#d4af37', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View>
          <Body style={{ color: '#e7c463', fontWeight: '800', fontSize: 16 }}>▶ Watch the Drop</Body>
          <Body style={{ color: theme.textDim, fontSize: 12 }}>Wiselion × Tribe of Kings — Like-King Tee</Body>
        </View>
        <Body style={{ color: '#e7c463', fontSize: 22 }}>→</Body>
      </Pressable>
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

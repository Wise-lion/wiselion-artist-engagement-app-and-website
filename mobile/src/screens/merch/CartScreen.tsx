import React from 'react';
import { View, FlatList, Pressable, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../config';

export default function CartScreen() {
  const nav = useNavigation<any>();
  const { items, setQty, remove, totalCents } = useCartStore();
  const tier = useAuthStore((s) => s.profile?.tier);
  const shipping = tier === 'PREMIUM' ? 0 : 599;

  return (
    <Screen>
      <Title style={{ marginBottom: 12 }}>Your Cart</Title>
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        ListEmptyComponent={<Body>Your cart is empty.</Body>}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56, borderRadius: 8 }} />}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Title style={{ fontSize: 15 }}>{item.name}</Title>
              <Body style={{ color: theme.goldLight }}>${(item.priceCents / 100).toFixed(2)}</Body>
            </View>
            <Pressable onPress={() => setQty(item.productId, item.quantity - 1)}><Text style={qBtn}>−</Text></Pressable>
            <Text style={{ color: theme.text, marginHorizontal: 8 }}>{item.quantity}</Text>
            <Pressable onPress={() => setQty(item.productId, item.quantity + 1)}><Text style={qBtn}>+</Text></Pressable>
            <Pressable onPress={() => remove(item.productId)}><Text style={{ color: theme.red, marginLeft: 12 }}>✕</Text></Pressable>
          </Card>
        )}
      />

      {items.length > 0 && (
        <View>
          <Body>Subtotal: ${(totalCents() / 100).toFixed(2)}</Body>
          <Body>Shipping: {shipping === 0 ? 'FREE (Premium)' : `$${(shipping / 100).toFixed(2)}`}</Body>
          <Title style={{ color: theme.goldLight, marginTop: 4 }}>
            Total: ${((totalCents() + shipping) / 100).toFixed(2)}
          </Title>
          <Button title="Checkout" onPress={() => nav.navigate('Checkout')} />
        </View>
      )}
    </Screen>
  );
}

const qBtn = { color: theme.goldLight, fontSize: 22, fontWeight: '800' as const, paddingHorizontal: 6 };

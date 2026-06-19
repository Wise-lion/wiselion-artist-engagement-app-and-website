import React, { useEffect, useState } from 'react';
import { Image, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, Title, Body, Button, TierBadge } from '../../components/ui';
import { Endpoints } from '../../services/api';
import { useCartStore } from '../../store/useCartStore';
import { theme } from '../../config';

export default function ProductDetailScreen() {
  const { productId } = useRoute<any>().params;
  const nav = useNavigation<any>();
  const [product, setProduct] = useState<any>(null);
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    Endpoints.product(productId).then(setProduct).catch(() => {});
  }, [productId]);

  if (!product) return <Screen><Body>Loading…</Body></Screen>;

  return (
    <Screen>
      <ScrollView>
        {product.imageUrl && (
          <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: 280, borderRadius: 12 }} />
        )}
        <Title style={{ marginTop: 16 }}>{product.name}</Title>
        {product.premiumOnly && <TierBadge tier="PREMIUM" />}
        <Title style={{ color: theme.goldLight, marginTop: 8 }}>${(product.priceCents / 100).toFixed(2)}</Title>
        <Body style={{ marginTop: 12 }}>{product.description}</Body>
        <Body style={{ marginTop: 8 }}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</Body>

        <Button
          title="Add to Cart"
          disabled={product.stock <= 0}
          onPress={() => {
            add({ productId: product.id, name: product.name, priceCents: product.priceCents, imageUrl: product.imageUrl });
            nav.navigate('Cart');
          }}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </Screen>
  );
}

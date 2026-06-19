import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, colors } from '../components/ui';

// Lightweight analytics overview. Aggregates from existing list endpoints;
// swap for a dedicated /admin/analytics endpoint as data grows.
export default function Dashboard() {
  const [stats, setStats] = useState<{ streams: number; lotto: number; products: number }>({
    streams: 0,
    lotto: 0,
    products: 0,
  });

  useEffect(() => {
    (async () => {
      const [streams, lotto, products] = await Promise.all([
        api.get<any[]>('/streams').catch(() => []),
        api.get<any[]>('/lotto').catch(() => []),
        api.get<any[]>('/merch/products').catch(() => []),
      ]);
      setStats({ streams: streams.length, lotto: lotto.length, products: products.length });
    })();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          ['Active Streams', stats.streams],
          ['Upcoming Lotto', stats.lotto],
          ['Products', stats.products],
        ].map(([label, v]) => (
          <Card key={label as string} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: colors.goldLight, fontWeight: 800 }}>{v}</div>
            <div style={{ color: colors.dim }}>{label}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3>Welcome, Wiselion King 🦁👑</h3>
        <p style={{ color: colors.dim }}>
          Schedule streams, run bingo games, set lotto draws, and manage merch from the nav on the left.
        </p>
      </Card>
    </div>
  );
}

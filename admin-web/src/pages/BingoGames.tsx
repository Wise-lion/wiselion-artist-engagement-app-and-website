import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

// Create bingo games (generates 1000 cards server-side), start them, and draw
// numbers manually. Auto-draw runs via the server cron when autoDrawSecs is set.
export default function BingoGames() {
  const [streams, setStreams] = useState<any[]>([]);
  const [form, setForm] = useState({ streamId: '', title: '', ticketPrice: 50, prize: 1000, autoDrawSecs: 15 });
  const [created, setCreated] = useState<any[]>([]);
  const [drawn, setDrawn] = useState<Record<string, number[]>>({});

  useEffect(() => { api.get<any[]>('/streams').then(setStreams).catch(() => {}); }, []);

  const create = async () => {
    const game = await api.post<any>('/bingo', form);
    setCreated((c) => [game, ...c]);
  };

  const start = (id: string) => api.patch(`/bingo/${id}/status`, { status: 'LIVE' });

  const draw = async (id: string) => {
    const res = await api.post<any>(`/bingo/${id}/draw`);
    setDrawn((d) => ({ ...d, [id]: res.numbersDrawn }));
  };

  return (
    <div>
      <h1>Bingo Games</h1>
      <Card>
        <h3>Create Game</h3>
        <Field label="Stream">
          <select
            value={form.streamId}
            onChange={(e) => setForm({ ...form, streamId: e.target.value })}
            style={{ width: '100%', padding: 10, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8 }}
          >
            <option value="">Select a stream…</option>
            {streams.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </Field>
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Ticket price (coins)"><Input type="number" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: +e.target.value })} /></Field>
        <Field label="Prize (coins)"><Input type="number" value={form.prize} onChange={(e) => setForm({ ...form, prize: +e.target.value })} /></Field>
        <Field label="Auto-draw interval (seconds)"><Input type="number" value={form.autoDrawSecs} onChange={(e) => setForm({ ...form, autoDrawSecs: +e.target.value })} /></Field>
        <Button onClick={create} disabled={!form.streamId}>Create + Generate 1000 Cards</Button>
      </Card>

      {created.map((g) => (
        <Card key={g.id}>
          <strong>{g.title}</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button onClick={() => start(g.id)}>Start (LIVE)</Button>
            <Button onClick={() => draw(g.id)}>Draw Number</Button>
          </div>
          <p style={{ color: colors.goldLight }}>{(drawn[g.id] || []).join(', ')}</p>
        </Card>
      ))}
    </div>
  );
}

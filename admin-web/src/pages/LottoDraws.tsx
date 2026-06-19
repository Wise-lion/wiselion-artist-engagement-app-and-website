import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

export default function LottoDraws() {
  const [draws, setDraws] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', drawDate: '', ticketPrice: 100, prize: 50000 });

  const load = () => api.get<any[]>('/lotto').then(setDraws).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    await api.post('/lotto', { ...form, drawDate: new Date(form.drawDate).toISOString() });
    setForm({ title: '', drawDate: '', ticketPrice: 100, prize: 50000 });
    load();
  };

  // Force-run a draw now (also runs automatically at drawDate via cron).
  const run = async (id: string) => { await api.post(`/lotto/${id}/run`); load(); };

  return (
    <div>
      <h1>Lotto Draws</h1>
      <Card>
        <h3>Schedule a Draw</h3>
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Draw date"><Input type="datetime-local" value={form.drawDate} onChange={(e) => setForm({ ...form, drawDate: e.target.value })} /></Field>
        <Field label="Ticket price (coins)"><Input type="number" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: +e.target.value })} /></Field>
        <Field label="Prize (coins)"><Input type="number" value={form.prize} onChange={(e) => setForm({ ...form, prize: +e.target.value })} /></Field>
        <Button onClick={create}>Schedule Draw</Button>
      </Card>

      {draws.map((d) => (
        <Card key={d.id}>
          <strong>{d.title}</strong> — <span style={{ color: colors.dim }}>{new Date(d.drawDate).toLocaleString()}</span>
          <p style={{ color: colors.goldLight }}>Prize: {d.prize.toLocaleString()} coins</p>
          <Button onClick={() => run(d.id)}>Run Draw Now</Button>
        </Card>
      ))}
    </div>
  );
}

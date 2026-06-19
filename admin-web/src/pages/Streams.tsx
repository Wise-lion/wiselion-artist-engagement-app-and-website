import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

export default function Streams() {
  const [streams, setStreams] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', premiumOnly: false, kickChannel: '' });

  const load = () => api.get<any[]>('/streams').then(setStreams).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    await api.post('/streams', {
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      kickChannel: form.kickChannel || undefined,
    });
    setForm({ title: '', description: '', scheduledAt: '', premiumOnly: false, kickChannel: '' });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/streams/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <h1>Streams</h1>
      <Card>
        <h3>Schedule a Stream</h3>
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Kick channel slug (native HLS fallback, optional)"><Input placeholder="wiselion" value={form.kickChannel} onChange={(e) => setForm({ ...form, kickChannel: e.target.value })} /></Field>
        <Field label="Scheduled at"><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></Field>
        <label style={{ color: colors.dim }}>
          <input type="checkbox" checked={form.premiumOnly} onChange={(e) => setForm({ ...form, premiumOnly: e.target.checked })} /> Premium only
        </label>
        <div><Button onClick={create} style={{ marginTop: 8 }}>Create (provisions Mux live stream)</Button></div>
      </Card>

      {streams.map((s) => (
        <Card key={s.id}>
          <strong>{s.title}</strong> — <span style={{ color: colors.dim }}>{s.status}</span>
          <p style={{ color: colors.dim, fontSize: 13 }}>Playback ID: {s.muxPlaybackId || '—'}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setStatus(s.id, 'LIVE')}>Go Live</Button>
            <Button onClick={() => setStatus(s.id, 'ENDED')} style={{ background: colors.dim }}>End</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

// War Room visibility review queue: trigger drafts, then approve/reject each
// before @comms publishes. The human gate for AI-generated marketing.
const CHANNEL_ICON: Record<string, string> = {
  instagram: '◉', tiktok: '♪', x: '✕', email: '✉', youtube: '▶',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: colors.dim, APPROVED: colors.goldLight, PUBLISHED: '#28C76F', REJECTED: '#E2483A',
};

export default function Visibility() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [drawId, setDrawId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get<any[]>('/visibility/drafts').then(setDrafts).catch(() => {});
  useEffect(() => {
    load();
    api.get<{ online: boolean }>('/visibility/warroom/status').then((r) => setOnline(r.online)).catch(() => setOnline(false));
  }, []);

  const generate = async () => {
    if (!drawId.trim()) { setMsg('Enter a draw/drop id first.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await api.post<{ count: number }>(`/visibility/draft/drop/${drawId.trim()}`);
      setMsg(`Generated ${r.count} drafts.`);
      load();
    } catch (e: any) {
      setMsg(e.message || 'Failed (is War Room online?).');
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    await api.patch(`/visibility/drafts/${id}`, { action });
    load();
  };

  return (
    <div>
      <h1>Visibility — War Room</h1>

      <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong>War Room agent</strong>
          <div style={{ color: colors.dim, fontSize: 13 }}>@content drafts · @comms publishes</div>
        </div>
        <span style={{ color: online ? '#28C76F' : '#E2483A', fontWeight: 700 }}>
          ● {online == null ? '…' : online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </Card>

      <Card>
        <h3>Generate drop promo</h3>
        <Field label="Lotto draw / drop id">
          <Input placeholder="cmqfrshyj00..." value={drawId} onChange={(e) => setDrawId(e.target.value)} />
        </Field>
        <Button onClick={generate} disabled={busy}>{busy ? 'Drafting…' : 'Draft posts with @content'}</Button>
        {msg && <span style={{ marginLeft: 12, color: colors.dim }}>{msg}</span>}
      </Card>

      <h3 style={{ marginTop: 8 }}>Review queue</h3>
      {drafts.length === 0 && <Card><span style={{ color: colors.dim }}>No drafts yet. Generate some above.</span></Card>}
      {drafts.map((d) => (
        <Card key={d.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: colors.text }}>
              <span style={{ fontSize: 16, marginRight: 8 }}>{CHANNEL_ICON[d.channel] || '•'}</span>
              <strong style={{ textTransform: 'capitalize' }}>{d.channel}</strong>
              <span style={{ color: colors.dim, fontSize: 12, marginLeft: 8 }}>· {d.trigger}</span>
            </span>
            <span style={{ color: STATUS_COLOR[d.status] || colors.dim, fontWeight: 700, fontSize: 12 }}>{d.status}</span>
          </div>
          {d.subject && <div style={{ color: colors.goldLight, fontSize: 14, marginBottom: 4 }}>Subject: {d.subject}</div>}
          <div style={{ color: colors.text, fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{d.body}</div>
          {d.status === 'DRAFT' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button onClick={() => act(d.id, 'approve')}>✓ Approve &amp; publish</Button>
              <Button onClick={() => act(d.id, 'reject')} style={{ background: 'none', border: `1px solid ${colors.border}`, color: '#E2483A' }}>✕ Reject</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

// Manage the media library: songs, audio messages, and videos (with platform links).
export default function Media() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    kind: 'SONG',
    title: '',
    artist: '',
    description: '',
    url: '',
    artworkUrl: '',
    durationSec: 0,
    premiumOnly: false,
    platformLinksRaw: '', // "youtube=https://...,spotify=https://..."
    ownedBackupUrl: '',   // self-hosted fallback (deplatforming contingency)
    kickChannel: '',      // Kick.com channel slug
    removedRaw: '',       // "youtube,tiktok" → marked removed
  });

  const load = () => api.get<any[]>('/media').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    // Parse "key=url,key=url" into the platformLinks object.
    const platformLinks: Record<string, string> = {};
    form.platformLinksRaw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .forEach((pair: string) => {
        const [k, ...rest] = pair.split('=');
        if (k && rest.length) platformLinks[k.trim()] = rest.join('=').trim();
      });

    // Build platformStatus map: { youtube: 'removed', ... }
    const platformStatus: Record<string, string> = {};
    form.removedRaw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .forEach((k: string) => { platformStatus[k] = 'removed'; });

    const { platformLinksRaw, removedRaw, ...rest } = form;
    await api.post('/media', {
      ...rest,
      durationSec: Number(form.durationSec) || undefined,
      url: form.url || undefined,
      artworkUrl: form.artworkUrl || undefined,
      ownedBackupUrl: form.ownedBackupUrl || undefined,
      kickChannel: form.kickChannel || undefined,
      ...(Object.keys(platformLinks).length ? { platformLinks } : {}),
      ...(Object.keys(platformStatus).length ? { platformStatus } : {}),
    });
    setForm({ ...form, title: '', artist: '', description: '', url: '', artworkUrl: '', platformLinksRaw: '', ownedBackupUrl: '', kickChannel: '', removedRaw: '' });
    load();
  };

  const sel = (v: string, on: boolean) => ({
    width: '100%', padding: 10, background: on ? colors.gold : colors.bg,
    color: on ? '#0B1E3F' : colors.text, border: `1px solid ${colors.border}`,
    borderRadius: 8, cursor: 'pointer', fontWeight: 500,
  } as React.CSSProperties);

  return (
    <div>
      <h1>Media Library</h1>
      <Card>
        <h3>Add Media</h3>
        <Field label="Type">
          <div style={{ display: 'flex', gap: 8 }}>
            {['SONG', 'AUDIO_MESSAGE', 'VIDEO'].map((k) => (
              <button key={k} onClick={() => setForm({ ...form, kind: k })} style={sel(k, form.kind === k)}>
                {k === 'AUDIO_MESSAGE' ? 'MESSAGE' : k}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        {form.kind === 'SONG' && (
          <Field label="Artist"><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></Field>
        )}
        <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label={form.kind === 'VIDEO' ? 'MP4 URL (optional)' : 'MP3 URL'}>
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </Field>
        <Field label="Artwork / thumbnail URL"><Input value={form.artworkUrl} onChange={(e) => setForm({ ...form, artworkUrl: e.target.value })} /></Field>

        {/* Deplatforming contingency: always-preferred self-hosted copy. */}
        <Field label="🛡️ Owned backup URL (self-hosted — survives platform bans)">
          <Input placeholder="https://cdn.wiselion.app/media/..." value={form.ownedBackupUrl} onChange={(e) => setForm({ ...form, ownedBackupUrl: e.target.value })} />
        </Field>
        {form.kind === 'VIDEO' && (
          <Field label="Kick channel slug (native live HLS)">
            <Input placeholder="wiselion" value={form.kickChannel} onChange={(e) => setForm({ ...form, kickChannel: e.target.value })} />
          </Field>
        )}
        {form.kind === 'VIDEO' && (
          <Field label="Mark platforms removed (comma-separated, hides their links)">
            <Input placeholder="youtube,tiktok" value={form.removedRaw} onChange={(e) => setForm({ ...form, removedRaw: e.target.value })} />
          </Field>
        )}

        {form.kind !== 'VIDEO' && (
          <Field label="Duration (seconds)"><Input type="number" value={form.durationSec} onChange={(e) => setForm({ ...form, durationSec: e.target.value })} /></Field>
        )}
        {form.kind === 'VIDEO' && (
          <Field label="Platform links (key=url, comma-separated)">
            <Input placeholder="youtube=https://...,spotify=https://..." value={form.platformLinksRaw} onChange={(e) => setForm({ ...form, platformLinksRaw: e.target.value })} />
          </Field>
        )}
        <label style={{ color: colors.dim }}>
          <input type="checkbox" checked={form.premiumOnly} onChange={(e) => setForm({ ...form, premiumOnly: e.target.checked })} /> Premium only
        </label>
        <div><Button onClick={create} style={{ marginTop: 8 }} disabled={!form.title}>Add to Library</Button></div>
      </Card>

      {items.map((m) => (
        <Card key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{m.title}</strong> {m.premiumOnly && '👑'}
            <div style={{ color: colors.dim, fontSize: 13 }}>
              {m.kind} {m.artist ? `· ${m.artist}` : ''} {m.platformLinks ? `· ${Object.keys(m.platformLinks).join(', ')}` : ''}
            </div>
          </div>
          <span style={{ color: colors.goldLight, fontSize: 12 }}>{m.kind === 'VIDEO' ? '🎬' : '🎵'}</span>
        </Card>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { onAuth, signOut } from './services/firebase';
import { DEMO_MODE } from './services/api';
import { colors } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Streams from './pages/Streams';
import BingoGames from './pages/BingoGames';
import LottoDraws from './pages/LottoDraws';
import Merch from './pages/Merch';
import Media from './pages/Media';
import Visibility from './pages/Visibility';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Demo mode skips Firebase entirely with a fake admin user.
    if (DEMO_MODE) { setUser({ email: 'demo@wiselion.app' }); setReady(true); return; }
    return onAuth((u) => { setUser(u); setReady(true); });
  }, []);

  if (!ready) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <nav style={{ width: 220, background: colors.card, padding: 20, borderRight: `1px solid ${colors.border}` }}>
          <h2 style={{ color: colors.goldLight }}>🦁👑 Admin</h2>
          {[
            ['/', 'Dashboard'],
            ['/streams', 'Streams'],
            ['/bingo', 'Bingo Games'],
            ['/lotto', 'Lotto Draws'],
            ['/merch', 'Merch'],
            ['/media', 'Media'],
            ['/visibility', 'Visibility'],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 0',
                color: isActive ? colors.goldLight : colors.dim,
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
          <button onClick={() => signOut()} style={{ marginTop: 20, background: 'none', border: `1px solid ${colors.border}`, color: colors.dim, borderRadius: 8, padding: 8, cursor: 'pointer' }}>
            Log out
          </button>
        </nav>
        <main style={{ flex: 1, padding: 24, maxWidth: 900 }}>
          {DEMO_MODE && (
            <div style={{ background: colors.gold, color: '#0B1E3F', padding: '6px 12px', borderRadius: 8, marginBottom: 16, fontWeight: 700, fontSize: 13 }}>
              🎬 DEMO MODE — fake in-memory data, no server or login required. Changes reset on reload.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/streams" element={<Streams />} />
            <Route path="/bingo" element={<BingoGames />} />
            <Route path="/lotto" element={<LottoDraws />} />
            <Route path="/merch" element={<Merch />} />
            <Route path="/media" element={<Media />} />
            <Route path="/visibility" element={<Visibility />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

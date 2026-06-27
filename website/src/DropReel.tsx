// DropReel (web) — the same cinematic drop reel from the mobile app, rebuilt for
// the website. A single rAF clock drives a looping timeline; scenes show the real
// tee artwork from /drop-reel/. Sped to ~20s for web.
import { useEffect, useRef, useState } from 'react';

const IMG = (f: string) => `/drop-reel/${f}`;
const CREST = IMG('tribe_of_kings_badge_lions.webp');

const MONTAGE = [
  { src: 'anime_tshirt_design.webp', label: 'ANIME', sub: 'NEO-TOKYO GOLD', accent: '#f5d77a' },
  { src: 'synthwave_tshirt.webp', label: 'SYNTH WAVE', sub: '1986 NEON', accent: '#ff3ea5' },
  { src: 'graffiti_tshirt.webp', label: 'GRAFFITI', sub: 'WALL KING', accent: '#16e0ff' },
  { src: 'ukiyoe_tshirt.webp', label: 'UKIYO-E', sub: 'FLOATING WORLD', accent: '#ff4d3d' },
  { src: 'chalk_drawing_tshirt.webp', label: 'CHALK', sub: 'STREET PASTEL', accent: '#ff8a1e' },
  { src: 'pencil_sketch_tshirt.webp', label: 'PENCIL', sub: 'RAW GRAPHITE', accent: '#e8e8e8' },
  { src: 'minimalist_vector_v2.webp', label: 'VECTOR', sub: 'CLEAN CUT', accent: '#e9c66a' },
  { src: 'spray_paint_stencil.webp', label: 'STENCIL', sub: 'SPRAY ICON', accent: '#ffffff' },
];

const DISP = "'Anton','Orbitron',sans-serif";
const MONO = "'Space Mono',monospace";
const GOLD = '#e7c463';
const SLIDE = 1.3;
const INTRO = 2.4; // cold open + crest reveal
const DROP = 3.6;
const TOTAL = INTRO + MONTAGE.length * SLIDE + DROP;

export default function DropReel() {
  const [t, setT] = useState(0);
  const raf = useRef<number>();
  const start = useRef<number>();

  useEffect(() => {
    const tick = (now: number) => {
      if (start.current == null) start.current = now;
      setT(((now - start.current) / 1000) % TOTAL);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  // Which scene are we in?
  let body: JSX.Element | null = null;
  let flash = 0;

  if (t < INTRO) {
    const op = clamp(t / 0.5, 0, 1) * clamp((INTRO - t) / 0.5, 0, 1);
    body = (
      <div style={{ ...center, opacity: op }}>
        <img src={CREST} alt="crest" style={{ width: 150, height: 150, objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(212,175,55,.5))' }} />
        <div style={{ fontFamily: DISP, fontSize: 46, color: GOLD, letterSpacing: 3, marginTop: 8 }}>WISELION</div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 6, color: '#f6efdc' }}>LIKE A KING</div>
      </div>
    );
  } else if (t < INTRO + MONTAGE.length * SLIDE) {
    const i = Math.floor((t - INTRO) / SLIDE);
    const local = (t - INTRO) - i * SLIDE;
    const m = MONTAGE[i];
    const scale = 1.16 + 0.12 * (local / SLIDE);
    const op = Math.min(clamp(local / 0.18, 0, 1), clamp((SLIDE - local) / 0.22, 0, 1));
    flash = local < 0.16 ? 0.5 * (1 - local / 0.16) : 0;
    body = (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: op }}>
        <img src={IMG(m.src)} alt={m.label} style={{ position: 'absolute', inset: '-8%', width: '116%', height: '116%', objectFit: 'cover', transform: `scale(${scale})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,6,7,.5),transparent 22%,transparent 52%,rgba(8,6,7,.92))' }} />
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, letterSpacing: 3 }}>
          <span style={{ color: '#f6efdc', opacity: 0.85 }}>WISELION</span>
          <span style={{ color: m.accent }}>{String(i + 1).padStart(2, '0')} / 08</span>
        </div>
        <div style={{ position: 'absolute', left: 18, bottom: 34 }}>
          <div style={{ width: 38, height: 5, background: m.accent, boxShadow: `0 0 12px ${m.accent}`, marginBottom: 8 }} />
          <div style={{ fontFamily: DISP, fontSize: 44, lineHeight: 0.9, color: '#f6efdc' }}>{m.label}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: m.accent, marginTop: 6 }}>{m.sub}</div>
        </div>
      </div>
    );
  } else {
    const local = t - INTRO - MONTAGE.length * SLIDE;
    const op = clamp(local / 0.5, 0, 1) * clamp((DROP - local) / 0.5, 0, 1);
    const pulse = 1 + 0.03 * Math.sin(local * 5.5);
    body = (
      <div style={{ ...center, opacity: op, background: 'radial-gradient(80% 55% at 50% 38%,rgba(212,175,55,.18),rgba(8,6,7,.96))' }}>
        <img src={IMG('anime_tshirt_design.webp')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14 }} />
        <div style={{ position: 'relative', fontFamily: MONO, fontSize: 11, letterSpacing: 6, color: '#d4af37' }}>THE DROP · LIMITED RUN · 250 PCS</div>
        <img src={IMG('anime_tshirt_design.webp')} alt="Like-King Tee" style={{ position: 'relative', width: 150, height: 150, objectFit: 'cover', borderRadius: 10, border: '2px solid #d4af37', marginTop: 12, boxShadow: '0 0 36px rgba(212,175,55,.3)' }} />
        <div style={{ position: 'relative', fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, color: '#f6efdc', marginTop: 10 }}>“LIKE-KING” TEE</div>
        <div style={{ position: 'relative', fontFamily: DISP, fontSize: 40, color: GOLD, marginTop: 4 }}>$48</div>
        <a href="#merch" style={{ position: 'relative', marginTop: 12, padding: '10px 26px', borderRadius: 8, background: 'linear-gradient(180deg,#f8e39c,#e7c463 40%,#c9a227)', color: '#1a1206', fontFamily: DISP, fontSize: 18, letterSpacing: 1, transform: `scale(${pulse})`, textDecoration: 'none' }}>COP NOW →</a>
      </div>
    );
  }

  return (
    <div style={frame}>
      {body}
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash, pointerEvents: 'none', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: 'linear-gradient(90deg,transparent,#d4af37,transparent)', opacity: 0.5 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'linear-gradient(90deg,transparent,#d4af37,transparent)', opacity: 0.5 }} />
    </div>
  );
}

const frame: React.CSSProperties = {
  position: 'relative', width: 300, height: 533, background: '#080607',
  border: '6px solid #1E2C4A', borderRadius: 26, overflow: 'hidden', flexShrink: 0,
};
const center: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
};

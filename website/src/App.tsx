// Wiselion — Claude-native cyberpunk artist site (single-page, Manus-free).
// Sections: Hero · Music · Tours · Merch · Mission · Join the Pride.
import { useEffect, useState } from 'react';
import { MUSIC, STREAM_LINKS, TOURS, MERCH, PILLARS, IMPACT, TIERS, SHOP_URL, orderMailto, INSTAGRAM_URL, INSTAGRAM_HANDLE, TIKTOK_URL, TIKTOK_HANDLE } from './data';
import { getLiveProducts, getLiveSongs, LiveProduct, LiveMedia } from './liveData';
import DropReel from './DropReel';
import AudioPlayer from './AudioPlayer';

// Shape the live API data into what the existing card markup expects, so the
// UI is identical whether it's showing real or placeholder data.
const productToCard = (p: LiveProduct) => ({
  name: p.name,
  price: `$${(p.priceCents / 100).toFixed(2)}`,
  tag: p.stock > 0 ? 'IN STOCK' : 'SOLD OUT',
  img: p.imageUrl || MERCH[0].img,
  buyUrl: '',
});
const songToCard = (m: LiveMedia, i: number) => ({
  title: m.title,
  kind: 'Single',
  year: String(new Date().getFullYear()),
  _key: m.id || String(i),
});

// Hero background image. Drop the golden cyber-lion at public/hero-lion.png and
// it blends in automatically (with the neon veil/vignette on top).
const HERO_IMG = '/lion-mask.png';

function Nav() {
  const links = ['music', 'tours', 'merch', 'reel', 'mission', 'pride'];
  return (
    <nav className="nav">
      <a href="#top" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20, color: 'var(--neon-pink)', letterSpacing: 2 }} className="glow-pink">
        WISELION
      </a>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        {links.map((l) => (
          <a key={l} href={`#${l}`}>{l === 'pride' ? 'JOIN THE PRIDE' : l.toUpperCase()}</a>
        ))}
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title={`@${INSTAGRAM_HANDLE}`}
           style={{ color: 'var(--neon-gold)', display: 'inline-flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Instagram">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
        <a href={TIKTOK_URL} target="_blank" rel="noreferrer" title={`@${TIKTOK_HANDLE}`}
           style={{ color: 'var(--neon-gold)', display: 'inline-flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-label="TikTok">
            <path d="M16.5 3c.4 2.3 1.7 3.7 3.9 3.9v2.6c-1.3.1-2.5-.3-3.9-1.1v5.5c0 4-3 6.6-6.6 5.9-3.1-.6-4.4-4-3.2-6.8.9-2 2.9-3 5.3-2.8v2.7c-.4-.1-.9-.2-1.4-.1-1.3.2-2 1.2-1.8 2.5.2 1.3 1.5 2 2.8 1.7 1-.3 1.6-1.2 1.6-2.4V3h3.3z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}

// Embers that rise behind the flaming wordmark (randomized once).
const EMBERS = Array.from({ length: 16 }, () => ({
  left: `${Math.random() * 100}%`,
  '--drift': `${(Math.random() * 24 - 12).toFixed(1)}px`,
  animationDuration: `${(1.8 + Math.random() * 1.6).toFixed(2)}s`,
  animationDelay: `${(Math.random() * 2.4).toFixed(2)}s`,
})) as any[];

function Hero() {
  return (
    <header id="top" className="hero hud">
      <span className="c-bl" /><span className="c-br" />
      {/* Breathing lion mask + amber eye-glow (CSS-animated, no video needed). */}
      <img className="hero-media" src={HERO_IMG} alt="" />
      <div className="eye-glow" />
      <div className="hero-vignette" />
      <div className="hero-veil" />
      <div className="scanlines" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="flame-wrap">
          <h1>WISELION</h1>
          {EMBERS.map((e, i) => (
            <span key={i} className="ember" style={e} />
          ))}
        </div>
        <div className="tagline" style={{ fontFamily: 'var(--mono)', letterSpacing: 6, color: 'var(--neon-pink)', marginTop: 8 }}>
          MUSICIAN · LION ACTIVIST · KING
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <a className="btn btn-pink" href="#music">▶ STREAM NOW</a>
          <a className="btn btn-cyan" href="#pride">JOIN THE PRIDE</a>
        </div>
      </div>
    </header>
  );
}

function Music() {
  // Live songs from the app's media library; falls back to the placeholder
  // list in data.ts if the server isn't deployed yet / unreachable.
  const [songs, setSongs] = useState(MUSIC.map((m, i) => ({ ...m, _key: String(i) })));
  useEffect(() => {
    getLiveSongs([]).then((live) => {
      if (live.length) setSongs(live.map(songToCard));
    });
  }, []);

  return (
    <section id="music" className="section">
      <div className="wrap">
        <div className="eyebrow">// MUSIC</div>
        <h2 style={{ fontSize: 32, marginBottom: 16 }}>Latest Release</h2>
        <div style={{ marginBottom: 12 }}>
          <AudioPlayer
            src="/music/dust-trails-and-neon-vibes.mp3"
            title="Dust Trails and Neon Vibes"
            sub="WISELION · NEW SINGLE"
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <AudioPlayer
            src="/music/dust-trails-and-neon-vibes-vocals.mp3"
            title="Dust Trails and Neon Vibes (Vocals)"
            sub="WISELION · VOCAL MIX"
          />
        </div>
        <h2 style={{ fontSize: 28, marginBottom: 24 }}>EPs &amp; Singles</h2>
        <div className="grid grid-3">
          {songs.map((m) => (
            <div key={m._key} className="card pink">
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--neon-pink)', letterSpacing: 2 }}>{m.kind} · {m.year}</div>
              <div style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: 20, marginTop: 8 }}>{m.title}</div>
              <div style={{ marginTop: 12, color: 'var(--neon-cyan)' }}>▶ ───────────●──</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--display)', color: '#fff' }}>Stream everywhere:</span>
          {STREAM_LINKS.map((s) => (
            <a key={s.label} className="btn btn-cyan" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tours() {
  const color = (s: string) => (s === 'SOLD OUT' ? '#ff006e' : s === 'LOW STOCK' ? '#ffd60a' : '#00d9ff');
  return (
    <section id="tours" className="section" style={{ background: '#0d0d0d' }}>
      <div className="wrap">
        <div className="eyebrow">// TOURS</div>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>The Roar Tour</h2>
        {TOURS.map((t) => (
          <div key={t.city} className="card" style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--display)', color: 'var(--neon-cyan)', fontSize: 20, minWidth: 88 }}>{t.date}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontFamily: 'var(--display)' }}>{t.city}</div>
              <div style={{ fontSize: 12, color: '#00d9ff99' }}>{t.venue}</div>
            </div>
            <span className="btn" style={{ background: 'transparent', color: color(t.status), border: `1px solid ${color(t.status)}` }}>{t.status}</span>
          </div>
        ))}
        <a className="btn btn-cyan" href="#" style={{ marginTop: 8 }}>BOOK A CAMPUS SHOW</a>
      </div>
    </section>
  );
}

function Merch() {
  // Live products from the app's Prisma database; falls back to the
  // placeholder MERCH list in data.ts if the server isn't deployed yet.
  const [items, setItems] = useState(MERCH);
  useEffect(() => {
    getLiveProducts([]).then((live) => {
      if (live.length) setItems(live.map(productToCard));
    });
  }, []);

  return (
    <section id="merch" className="section">
      <div className="wrap">
        <div className="eyebrow">// MERCH</div>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>The Drop</h2>
        <div className="grid grid-3">
          {items.map((m) => (
            <div key={m.name} className="card gold">
              <div style={{ height: 180, overflow: 'hidden', background: '#000' }}>
                <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--neon-gold)', letterSpacing: 2, marginTop: 12 }}>{m.tag}</div>
              <div style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: 16, marginTop: 4 }}>{m.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--neon-gold)' }}>{m.price}</span>
                <a className="btn btn-gold" href={m.buyUrl || SHOP_URL} target="_blank" rel="noreferrer">COP NOW</a>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12, color: '#00d9ff99' }}>
          Store opening soon — can’t wait?{' '}
          <a href={orderMailto('Wiselion tee', '$48')} style={{ color: 'var(--neon-gold)' }}>
            Email your order
          </a>{' '}
          and we’ll sort you out.
        </div>
      </div>
    </section>
  );
}

function Reel() {
  return (
    <section id="reel" className="section" style={{ background: '#060606' }}>
      <div className="wrap" style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <DropReel />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="eyebrow">// THE DROP REEL</div>
          <h2 style={{ fontSize: 34 }}>Wiselion × Tribe of Kings</h2>
          <p style={{ color: '#00d9ffcc', maxWidth: 460 }}>
            Eight designs. One mask, every form. The same cinematic drop reel that runs in the app —
            now here on the web, calling each tee like a king.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <a className="btn btn-gold" href="#merch">SHOP THE DROP</a>
            <a className="btn btn-cyan" href="#pride">JOIN THE PRIDE</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section id="mission" className="section" style={{ background: '#0d0d0d' }}>
      <div className="wrap">
        <div className="eyebrow">// MISSION</div>
        <h2 style={{ fontSize: 32 }}>The Roar Kingdom Story</h2>
        <p style={{ color: '#00d9ffcc', maxWidth: 620 }}>
          Wiselion partners with <span style={{ color: 'var(--neon-gold)' }}>Big Life Foundation</span> — every show, drop, and membership protects wild lions.
        </p>
        <div className="grid grid-2" style={{ marginTop: 20 }}>
          <div className="card purple">
            {PILLARS.map((p) => (
              <div key={p} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ color: 'var(--neon-purple)' }}>◆</span>
                <span style={{ color: '#fff', fontSize: 14 }}>{p}</span>
              </div>
            ))}
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignContent: 'start' }}>
            {IMPACT.map((s) => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--neon-cyan)' }} className="glow-cyan">{s.value}</div>
                <div style={{ fontSize: 10, color: '#00d9ff99', letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
            <a className="btn btn-pink" href="https://biglife.org/donate" target="_blank" rel="noreferrer" style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>MAKE A DIRECT IMPACT</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pride() {
  return (
    <section id="pride" className="section">
      <div className="wrap">
        <div className="eyebrow">// MEMBERSHIP</div>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>Join the Pride</h2>
        <div className="grid grid-3">
          {TIERS.map((t) => (
            <div key={t.name} className={`card ${t.featured ? 'gold' : ''}`} style={t.featured ? { borderWidth: 2, boxShadow: '0 0 30px #ffd60a33' } : undefined}>
              {t.featured && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--neon-gold)', letterSpacing: 2 }}>MOST POPULAR</div>}
              <div style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: 18, marginTop: 4 }}>{t.name}</div>
              <div style={{ margin: '8px 0 14px' }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 32, color: t.featured ? 'var(--neon-gold)' : 'var(--neon-cyan)' }}>{t.price}</span>
                <span style={{ fontSize: 11, color: '#00d9ff99' }}> {t.sub}</span>
              </div>
              {t.perks.map((p) => (
                <div key={p} style={{ fontSize: 13, color: '#fff', marginBottom: 6 }}>✦ {p}</div>
              ))}
              <button className={`btn ${t.featured ? 'btn-gold' : 'btn-cyan'}`} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                {t.price === '$0' ? 'JOIN FREE' : 'SUBSCRIBE'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Music />
      <Tours />
      <Merch />
      <Reel />
      <Mission />
      <Pride />
      <footer style={{ borderTop: '1px solid #00d9ff44', padding: '20px 22px', fontSize: 10, color: '#00d9ff77', letterSpacing: 2, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <span>© WISELION · A TRIBE OF KINGS LINE · built Claude-native</span>
        <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--neon-gold)', letterSpacing: 2 }}>
            INSTAGRAM @{INSTAGRAM_HANDLE.toUpperCase()}
          </a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--neon-gold)', letterSpacing: 2 }}>
            TIKTOK @{TIKTOK_HANDLE.toUpperCase()}
          </a>
        </span>
      </footer>
    </>
  );
}

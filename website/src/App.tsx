// Wiselion — Claude-native cyberpunk artist site (single-page, Manus-free).
// Sections: Hero · Music · Tours · Merch · Mission · Join the Pride.
import { MUSIC, STREAM_LINKS, TOURS, MERCH, PILLARS, IMPACT, TIERS, SHOP_URL, orderMailto } from './data';
import DropReel from './DropReel';
import AudioPlayer from './AudioPlayer';

// Hero background image. Drop the golden cyber-lion at public/hero-lion.png and
// it blends in automatically (with the neon veil/vignette on top).
const HERO_IMG = '/hero-lion.png';

function Nav() {
  const links = ['music', 'tours', 'merch', 'reel', 'mission', 'pride'];
  return (
    <nav className="nav">
      <a href="#top" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20, color: 'var(--neon-pink)', letterSpacing: 2 }} className="glow-pink">
        WISELION
      </a>
      <div style={{ display: 'flex', gap: 18 }}>
        {links.map((l) => (
          <a key={l} href={`#${l}`}>{l === 'pride' ? 'JOIN THE PRIDE' : l.toUpperCase()}</a>
        ))}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header id="top" className="hero hud">
      <span className="c-bl" /><span className="c-br" />
      {/* Animated hero: plays /hero-lion.mp4 (Higgsfield export) and shows the
          PNG poster instantly + as fallback if the video isn't present yet. */}
      <video className="hero-media" autoPlay loop muted playsInline poster={HERO_IMG}>
        <source src="/hero-lion.mp4" type="video/mp4" />
        <source src="/hero-lion.webm" type="video/webm" />
      </video>
      <div className="hero-vignette" />
      <div className="hero-veil" />
      <div className="scanlines" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontSize: 56, letterSpacing: 4 }} className="glow-cyan">WISELION</h1>
        <div style={{ fontFamily: 'var(--mono)', letterSpacing: 6, color: 'var(--neon-pink)', marginTop: 8 }}>
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
  return (
    <section id="music" className="section">
      <div className="wrap">
        <div className="eyebrow">// MUSIC</div>
        <h2 style={{ fontSize: 32, marginBottom: 16 }}>Latest Release</h2>
        <div style={{ marginBottom: 28 }}>
          <AudioPlayer
            src="/music/dust-trails-and-neon-vibes.mp3"
            title="Dust Trails and Neon Vibes"
            sub="WISELION · NEW SINGLE"
          />
        </div>
        <h2 style={{ fontSize: 28, marginBottom: 24 }}>EPs &amp; Singles</h2>
        <div className="grid grid-3">
          {MUSIC.map((m) => (
            <div key={m.title} className="card pink">
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
  return (
    <section id="merch" className="section">
      <div className="wrap">
        <div className="eyebrow">// MERCH</div>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>The Drop</h2>
        <div className="grid grid-3">
          {MERCH.map((m) => (
            <div key={m.name} className="card gold">
              <div style={{ height: 180, overflow: 'hidden', background: '#000' }}>
                <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--neon-gold)', letterSpacing: 2, marginTop: 12 }}>{m.tag}</div>
              <div style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: 16, marginTop: 4 }}>{m.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--neon-gold)' }}>{m.price}</span>
                <a className="btn btn-gold" href={m.buyUrl || orderMailto(m.name, m.price)}>COP NOW</a>
              </div>
            </div>
          ))}
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
      <footer style={{ borderTop: '1px solid #00d9ff44', padding: '20px 22px', fontSize: 10, color: '#00d9ff77', letterSpacing: 2 }}>
        © WISELION · A TRIBE OF KINGS LINE · built Claude-native
      </footer>
    </>
  );
}

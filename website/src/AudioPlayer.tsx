// AudioPlayer — cyberpunk MP3 player for the website Music section.
// HTML5 <audio> under the hood; custom play/pause, scrubber, and time display.
import { useEffect, useRef, useState } from 'react';

const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function AudioPlayer({ src, title, sub }: { src: string; title: string; sub?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setPos(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  const pct = dur ? (pos / dur) * 100 : 0;

  return (
    <div className="card pink" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        style={{
          width: 56, height: 56, flexShrink: 0, cursor: 'pointer', border: 'none',
          background: 'var(--neon-pink)', color: '#0a0a0a', fontSize: 22,
          boxShadow: '0 0 22px #ff006e88',
          clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
        }}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--neon-pink)', letterSpacing: 2 }}>{sub}</div>}

        <div onClick={seek} style={{ marginTop: 10, height: 8, background: '#0a0a0a', cursor: 'pointer', position: 'relative', border: '1px solid #00d9ff44' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: '#00d9ff99', marginTop: 4 }}>
          <span>{fmt(pos)}</span><span>{fmt(dur)}</span>
        </div>
      </div>
    </div>
  );
}

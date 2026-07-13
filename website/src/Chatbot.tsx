// Chatbot.tsx — "Ask the Bard", a self-contained concierge for the Wiselion
// site. No backend, no API key: keyword intents map to on-brand answers with
// quick-reply buttons that jump to sections or open the store / socials.
// Upgrade path: swap `answer()` for a fetch to a Gemini function later.
import { useEffect, useRef, useState } from 'react';
import { SHOP_URL, INSTAGRAM_URL, TIKTOK_URL, ORDER_EMAIL, orderMailto } from './data';

type Action = { label: string; href?: string; go?: string; ask?: string };
type Msg = { from: 'bard' | 'you'; text: string; actions?: Action[] };

const GREETING: Msg = {
  from: 'bard',
  text: "I am the Bard of Wiselion. 👑 Ask, and the Pride shall answer. What calls to you?",
  actions: [
    { label: '🛍️ The Drop', ask: 'merch' },
    { label: '🎵 Music', ask: 'music' },
    { label: '👑 Join the Pride', ask: 'membership' },
    { label: '🦁 The Mission', ask: 'mission' },
  ],
};

// Intent matcher: returns the Bard's reply for a user message.
function answer(raw: string): Msg {
  const q = raw.toLowerCase();
  const has = (...w: string[]) => w.some((x) => q.includes(x));

  if (has('merch', 'shop', 'buy', 'tee', 'shirt', 'drop', 'cop', 'store', 'clothing', 'hoodie', 'wear'))
    return {
      from: 'bard',
      text: "The Drop is a limited run of regal tees — anime, synthwave, graffiti, ukiyo-e and more, $44–$52. Each purchase protects real lions. 🦁",
      actions: [
        { label: 'See the Drop', go: 'merch' },
        { label: 'Open the store', href: SHOP_URL },
        { label: 'Email an order', href: orderMailto('Wiselion tee', '$48') },
      ],
    };

  if (has('music', 'song', 'listen', 'stream', 'spotify', 'apple', 'track', 'album', 'ep', 'play'))
    return {
      from: 'bard',
      text: "Wiselion is the Artist-king — raw lyricism over cinematic production. Hear the latest below, or stream on your platform of choice.",
      actions: [
        { label: 'Play on site', go: 'music' },
        { label: 'Streaming links', go: 'music' },
      ],
    };

  if (has('member', 'pride', 'join', 'subscribe', 'tier', 'passport', 'throne', 'perk', 'vip'))
    return {
      from: 'bard',
      text: "Join the Pride: CUB is free, KINGDOM PASSPORT is $5/mo (early tickets, city stamps, exclusives), THRONE ROOM is $15/mo (backstage streams, first-dibs merch, credits).",
      actions: [
        { label: 'See the tiers', go: 'pride' },
      ],
    };

  if (has('mission', 'lion', 'charity', 'conserv', 'ranger', 'poach', 'cause', 'donate', 'impact'))
    return {
      from: 'bard',
      text: "Every crown serves the wild. A share of all we make funds rangers, anti-poaching patrols, and lion habitat protection. Reign like a king, protect the king of beasts.",
      actions: [{ label: 'Read the Mission', go: 'mission' }],
    };

  if (has('tour', 'show', 'ticket', 'concert', 'live', 'gig', 'event', 'city', 'venue'))
    return {
      from: 'bard',
      text: "The court travels. Check the tour dates for a city near you — some nights are already low-stock or sold out.",
      actions: [{ label: 'Tour dates', go: 'tours' }],
    };

  if (has('insta', 'tiktok', 'social', 'follow', 'gram', 'handle'))
    return {
      from: 'bard',
      text: "Follow the reign — same handle everywhere: @Wiselionlikeking.",
      actions: [
        { label: 'Instagram', href: INSTAGRAM_URL },
        { label: 'TikTok', href: TIKTOK_URL },
      ],
    };

  if (has('contact', 'email', 'reach', 'support', 'help', 'question', 'order status', 'refund'))
    return {
      from: 'bard',
      text: `For anything a Bard can't settle, reach the court directly at ${ORDER_EMAIL}.`,
      actions: [{ label: 'Email us', href: `mailto:${ORDER_EMAIL}` }],
    };

  if (has('hi', 'hey', 'hello', 'yo', 'sup', 'greet'))
    return { ...GREETING, text: 'Well met. 👑 What do you seek?' };

  if (has('who', 'what is', 'about', 'wiselion'))
    return {
      from: 'bard',
      text: "Wiselion is the Artist-king — music, merch, and a movement. Cyberpunk-regal by design, lion-hearted by cause. Reign like a king.",
      actions: [
        { label: 'Music', go: 'music' },
        { label: 'The Drop', go: 'merch' },
        { label: 'The Mission', go: 'mission' },
      ],
    };

  // Fallback.
  return {
    from: 'bard',
    text: "The Bard didn't quite catch that. Choose a path, noble one:",
    actions: [
      { label: '🛍️ The Drop', ask: 'merch' },
      { label: '🎵 Music', ask: 'music' },
      { label: '👑 Join the Pride', ask: 'membership' },
      { label: '📫 Contact', ask: 'contact' },
    ],
  };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: 'you', text: t }, answer(t)]);
    setInput('');
  };

  const runAction = (a: Action) => {
    if (a.href) { window.open(a.href, a.href.startsWith('mailto:') ? '_self' : '_blank'); return; }
    if (a.go) {
      document.getElementById(a.go)?.scrollIntoView({ behavior: 'smooth' });
      setOpen(false);
      return;
    }
    if (a.ask) send(a.ask);
  };

  return (
    <>
      {/* Launcher */}
      <button
        aria-label="Ask the Bard"
        onClick={() => setOpen((o) => !o)}
        className="bard-fab"
      >
        {open ? '✕' : '👑'}
      </button>

      {open && (
        <div className="bard-panel" role="dialog" aria-label="Ask the Bard chat">
          <div className="bard-head">
            <span className="bard-dot" /> Ask the Bard
            <span className="bard-sub">Wiselion concierge</span>
          </div>

          <div className="bard-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`bard-row ${m.from}`}>
                <div className={`bard-bubble ${m.from}`}>
                  {m.text}
                  {m.actions && (
                    <div className="bard-actions">
                      {m.actions.map((a, j) => (
                        <button key={j} className="bard-chip" onClick={() => runAction(a)}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            className="bard-input"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about drops, music, the Pride…"
              aria-label="Message the Bard"
            />
            <button type="submit" aria-label="Send">➤</button>
          </form>
        </div>
      )}
    </>
  );
}

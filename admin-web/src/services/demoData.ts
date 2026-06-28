// In-memory demo backend. Active when VITE_DEMO_MODE === 'true'.
// Lets you click through the whole admin panel with no server/database/Firebase.
// Mutations persist for the browser session (until reload).

const id = () => Math.random().toString(36).slice(2, 9);

type Any = Record<string, any>;

const db: { streams: Any[]; games: Any[]; lotto: Any[]; products: Any[]; media: Any[]; promoDrafts: Any[] } = {
  streams: [
    {
      id: 'str_demo1',
      title: 'Friday Night Wiselion Live',
      description: 'Bingo, lotto & vibes with the Wiselion King.',
      status: 'LIVE',
      scheduledAt: new Date().toISOString(),
      muxPlaybackId: 'DEMO_PLAYBACK_ID',
      premiumOnly: false,
      games: [{ id: 'gm_demo1', title: 'Opening Bingo Round', ticketPrice: 50, prize: 1000 }],
    },
    {
      id: 'str_demo2',
      title: 'Sunday Premium Showcase',
      description: 'Exclusive premium-only stream.',
      status: 'UPCOMING',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      muxPlaybackId: null,
      premiumOnly: true,
      games: [],
    },
  ],
  games: [],
  lotto: [
    {
      id: 'lot_demo1',
      title: 'Weekly Mega Lotto',
      drawDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      ticketPrice: 100,
      prize: 50000,
      status: 'SCHEDULED',
    },
  ],
  products: [
    { id: 'prod_demo1', name: 'Wiselion Tee', description: 'Official gold-lion tee', priceCents: 2999, stock: 100, premiumOnly: false, imageUrl: 'https://placehold.co/300x300/D4A026/0B1E3F?text=Wiselion+Tee' },
    { id: 'prod_demo2', name: 'King Crown Hoodie', description: 'Premium members exclusive', priceCents: 5999, stock: 40, premiumOnly: true, imageUrl: 'https://placehold.co/300x300/8C5A1E/F5F3EC?text=Crown+Hoodie' },
  ],
  media: [
    { id: 'med_1', kind: 'SONG', title: 'King of the Pride', artist: 'Wiselion', durationSec: 212, premiumOnly: false, url: 'https://cdn.wiselion.app/media/king-of-the-pride.mp3' },
    { id: 'med_2', kind: 'AUDIO_MESSAGE', title: 'Welcome to the Pride', description: 'Message from the King', durationSec: 48, url: 'https://cdn.wiselion.app/media/welcome-message.mp3' },
    { id: 'med_3', kind: 'VIDEO', title: 'Wiselion Live — Highlights', url: 'https://cdn.wiselion.app/media/highlights.mp4', platformLinks: { youtube: 'https://youtube.com/@wiselion' } },
  ],
  promoDrafts: [
    { id: 'pd_1', trigger: 'drop.scheduled', channel: 'instagram', body: '👑 THE DROP IS HERE.\nWiselion × Tribe of Kings — 8 designs, one mask, every form.\nLike-King Tee, $48. A share funds wild-lion conservation.\n\n#Wiselion #LikeAKing #TribeOfKings #StreetwearDrop #SaveTheLions', status: 'DRAFT', createdAt: new Date().toISOString() },
    { id: 'pd_2', trigger: 'drop.scheduled', channel: 'x', body: 'The Drop Reel is live. 8 cyber-regal tees, $48, limited to 250. Every cop protects wild lions. 🦁👑 wiselion.shop #Wiselion', status: 'DRAFT', createdAt: new Date().toISOString() },
    { id: 'pd_3', trigger: 'drop.scheduled', channel: 'email', subject: 'The Like-King Tee just dropped 👑', body: 'Royalty has a uniform. The Wiselion × Tribe of Kings drop is live — 8 designs, $48, only 250 pieces. Watch the Drop Reel, pick your form, and know that a share of every order funds rangers protecting wild lions with Big Life Foundation. Cop yours before the pride does.', status: 'APPROVED', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
};

// Route a (method, path, body) to the in-memory db. Mirrors the real API shapes.
export function demoRequest<T>(method: string, path: string, body?: any): Promise<T> {
  const reply = (v: any) => Promise.resolve(v as T);

  // ---- Streams ----
  if (path === '/streams' && method === 'GET') return reply(db.streams);
  if (path === '/streams' && method === 'POST') {
    const s = { id: id(), status: 'UPCOMING', muxPlaybackId: `demo_${id()}`, games: [], ...body };
    db.streams.unshift(s);
    return reply(s);
  }
  const streamStatus = path.match(/^\/streams\/(\w+)\/status$/);
  if (streamStatus && method === 'PATCH') {
    const s = db.streams.find((x) => x.id === streamStatus[1]);
    if (s) s.status = body.status;
    return reply(s);
  }

  // ---- Bingo ----
  if (path === '/bingo' && method === 'POST') {
    const g = { id: id(), status: 'SCHEDULED', numbersDrawn: [], ...body };
    db.games.unshift(g);
    return reply(g);
  }
  const bingoStatus = path.match(/^\/bingo\/(\w+)\/status$/);
  if (bingoStatus && method === 'PATCH') {
    const g = db.games.find((x) => x.id === bingoStatus[1]);
    if (g) g.status = body.status;
    return reply(g);
  }
  const bingoDraw = path.match(/^\/bingo\/(\w+)\/draw$/);
  if (bingoDraw && method === 'POST') {
    const g = db.games.find((x) => x.id === bingoDraw[1]);
    if (g) {
      const drawn = new Set<number>(g.numbersDrawn);
      let n = 0;
      do { n = Math.floor(Math.random() * 75) + 1; } while (drawn.has(n) && drawn.size < 75);
      g.numbersDrawn.push(n);
      return reply({ number: n, numbersDrawn: g.numbersDrawn });
    }
    return reply({ number: null, numbersDrawn: [] });
  }

  // ---- Lotto ----
  if (path === '/lotto' && method === 'GET') return reply(db.lotto.filter((d) => d.status === 'SCHEDULED'));
  if (path === '/lotto' && method === 'POST') {
    const d = { id: id(), status: 'SCHEDULED', ...body };
    db.lotto.unshift(d);
    return reply(d);
  }
  const lottoRun = path.match(/^\/lotto\/(\w+)\/run$/);
  if (lottoRun && method === 'POST') {
    const d = db.lotto.find((x) => x.id === lottoRun[1]);
    if (d) { d.status = 'FINISHED'; d.winningTicketId = `WL-${id().toUpperCase()}`; }
    return reply({ ok: true });
  }

  // ---- Merch ----
  if (path === '/merch/products' && method === 'GET') return reply(db.products);
  if (path === '/merch/products' && method === 'POST') {
    const p = { id: id(), active: true, ...body };
    db.products.unshift(p);
    return reply(p);
  }
  const prodPatch = path.match(/^\/merch\/products\/(\w+)$/);
  if (prodPatch && method === 'PATCH') {
    const p = db.products.find((x) => x.id === prodPatch[1]);
    if (p) Object.assign(p, body);
    return reply(p);
  }

  // ---- Media ----
  if (path.startsWith('/media') && method === 'GET') {
    const m = path.match(/kind=(\w+)/);
    return reply(m ? db.media.filter((x) => x.kind === m[1]) : db.media);
  }
  if (path === '/media' && method === 'POST') {
    const item = { id: id(), active: true, ...body };
    db.media.unshift(item);
    return reply(item);
  }
  const mediaPatch = path.match(/^\/media\/(\w+)$/);
  if (mediaPatch && method === 'PATCH') {
    const m = db.media.find((x) => x.id === mediaPatch[1]);
    if (m) Object.assign(m, body);
    return reply(m);
  }

  // ---- Visibility (War Room) ----
  if (path === '/visibility/warroom/status' && method === 'GET') return reply({ online: false });
  if (path.startsWith('/visibility/drafts') && method === 'GET') {
    const m = path.match(/status=(\w+)/);
    return reply(m ? db.promoDrafts.filter((d) => d.status === m[1]) : db.promoDrafts);
  }
  const draftDrop = path.match(/^\/visibility\/draft\/drop\/(\w+)$/);
  if (draftDrop && method === 'POST') {
    // Simulate @content drafting a fresh set.
    const channels = ['instagram', 'tiktok', 'x', 'email'];
    const made = channels.map((c) => ({
      id: id(), trigger: 'drop.scheduled', channel: c,
      subject: c === 'email' ? 'New Wiselion drop just landed 👑' : undefined,
      body: `[${c.toUpperCase()} draft] Wiselion × Tribe of Kings drop — Like-King Tee $48. Watch the Drop Reel. A share funds lion conservation. 🦁👑`,
      status: 'DRAFT', createdAt: new Date().toISOString(),
    }));
    db.promoDrafts.unshift(...made);
    return reply({ count: made.length, drafts: made });
  }
  const draftPatch = path.match(/^\/visibility\/drafts\/(\w+)$/);
  if (draftPatch && method === 'PATCH') {
    const d = db.promoDrafts.find((x) => x.id === draftPatch[1]);
    if (d) d.status = body.action === 'reject' ? 'REJECTED' : 'PUBLISHED';
    return reply(d);
  }

  return reply([] as any);
}

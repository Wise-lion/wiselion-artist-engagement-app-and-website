// DropReelScreen — React Native implementation of "Wiselion Drop Reel.dc.html".
// A 34s, looping cinematic promo for the Wiselion × Tribe of Kings tee drop.
// The design is authored at 1080×1920; we render scenes in that logical space
// inside a canvas scaled to the device width. A single rAF clock (useReelClock)
// drives time `t`; each scene reads `t` and time-gates its opacity/transforms.
import React from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image'; // decodes WebP reliably on iOS + Android
import { useNavigation } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { useReelClock, cue, clamp, Easing, interpolate } from './engine';
import { GradientText } from '../../components/GradientText';
import { config } from '../../config';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CW = 1080; // logical canvas width
const CH = 1920; // logical canvas height
const SCALE = SCREEN_W / CW;

// ── palette / type (from the design) ──────────────────────────────────────
const C = {
  black: '#080607', gold: '#d4af37', goldHi: '#f5d77a', goldGrad: '#e7c463',
  goldDeep: '#9c7a1e', cream: '#f6efdc', red: '#e23b2e',
};
// Exact Google Fonts loaded in App.tsx (fall back to system if not yet ready).
const F = {
  regalBold: 'Cinzel_700Bold',
  regalBlack: 'Cinzel_900Black',
  display: 'Anton_400Regular',
  mono: 'SpaceMono_400Regular',
};

// Filenames on the CDN (config.dropReelBaseUrl) and the bundled fallbacks.
const FILES: Record<string, string> = {
  crest: 'tribe_of_kings_badge_lions.webp',
  anime: 'anime_tshirt_design.webp',
  synth: 'synthwave_tshirt.webp',
  graffiti: 'graffiti_tshirt.webp',
  ukiyoe: 'ukiyoe_tshirt.webp',
  chalk: 'chalk_drawing_tshirt.webp',
  pencil: 'pencil_sketch_tshirt.webp',
  vector: 'minimalist_vector_v2.webp',
  spray: 'spray_paint_stencil.webp',
};
const BUNDLED: Record<string, number> = {
  crest: require('../../../assets/drop-reel/tribe_of_kings_badge_lions.webp'),
  anime: require('../../../assets/drop-reel/anime_tshirt_design.webp'),
  synth: require('../../../assets/drop-reel/synthwave_tshirt.webp'),
  graffiti: require('../../../assets/drop-reel/graffiti_tshirt.webp'),
  ukiyoe: require('../../../assets/drop-reel/ukiyoe_tshirt.webp'),
  chalk: require('../../../assets/drop-reel/chalk_drawing_tshirt.webp'),
  pencil: require('../../../assets/drop-reel/pencil_sketch_tshirt.webp'),
  vector: require('../../../assets/drop-reel/minimalist_vector_v2.webp'),
  spray: require('../../../assets/drop-reel/spray_paint_stencil.webp'),
};

// Prefer the hosted copy (keeps the binary small + enables sharp remote assets);
// fall back to the bundled PNG when no CDN base is configured.
const reelSource = (key: string): any =>
  config.dropReelBaseUrl ? { uri: `${config.dropReelBaseUrl}/${FILES[key]}` } : BUNDLED[key];

const IMG = {
  crest: reelSource('crest'),
  anime: reelSource('anime'),
  synth: reelSource('synth'),
  graffiti: reelSource('graffiti'),
  ukiyoe: reelSource('ukiyoe'),
  chalk: reelSource('chalk'),
  pencil: reelSource('pencil'),
  vector: reelSource('vector'),
  spray: reelSource('spray'),
};

// Centered text block in logical space.
const centered = (top: number): any => ({ position: 'absolute', left: 0, width: CW, top, alignItems: 'center' });

// ── Cue wrapper: time-gated fade/slide/scale ──────────────────────────────
const CueView: React.FC<{
  t: number; start: number; end: number; inDur?: number; outDur?: number;
  rise?: number; scaleFrom?: number; style?: any; children: React.ReactNode;
}> = ({ t, start, end, inDur, outDur, rise, scaleFrom, style, children }) => {
  const c = cue(t, start, end, { inDur, outDur, rise, scaleFrom });
  if (!c.visible) return null;
  return (
    <View style={[style, { opacity: c.opacity, transform: [{ translateY: c.translateY }, { scale: c.scale }] }]}>
      {children}
    </View>
  );
};

// ── Embers (persistent floating gold particles) ───────────────────────────
const EMBERS = Array.from({ length: 28 }, () => ({
  x: Math.random() * CW, size: 2 + Math.random() * 4, speed: 14 + Math.random() * 42,
  phase: Math.random() * 1000, drift: (Math.random() - 0.5) * 40, baseY: Math.random() * 1980,
  hue: Math.random() < 0.28 ? '#fff4d2' : C.gold, op: 0.18 + Math.random() * 0.5,
}));
const Embers: React.FC<{ t: number }> = ({ t }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {EMBERS.map((p, i) => {
      const y = (((p.baseY - t * p.speed) % 2000) + 2000) % 2000 - 40;
      const x = p.x + Math.sin((t + p.phase) * 0.55) * p.drift;
      const tw = 0.45 + 0.55 * Math.sin(t * 2 + p.phase);
      return <View key={i} style={{ position: 'absolute', left: x, top: y, width: p.size, height: p.size, borderRadius: p.size, backgroundColor: p.hue, opacity: p.op * tw }} />;
    })}
  </View>
);

// White/accent flash on a cut.
const FlashCut: React.FC<{ t: number; at: number; color?: string; dur?: number; max?: number }> = ({ t, at, color = '#fff', dur = 0.16, max = 0.5 }) => {
  let o = 0;
  if (t >= at && t <= at + dur) o = max * (1 - (t - at) / dur);
  if (o <= 0) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: o }]} />;
};


// ── Scene 1 — Cold open ────────────────────────────────────────────────────
const ColdOpen: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0 || t > 4.6) return null;
  const rule = Easing.easeOutCubic(clamp((t - 0.7) / 0.9, 0, 1));
  const ruleOut = clamp((4.5 - t) / 0.5, 0, 1);
  return (
    <View style={StyleSheet.absoluteFill}>
      <CueView t={t} start={1.0} end={4.4} inDur={0.8} outDur={0.5} rise={14} style={centered(760)}>
        <GradientText style={{ fontFamily: F.regalBlack, fontSize: 84, letterSpacing: 3, textAlign: 'center' }}>TRIBE OF KINGS</GradientText>
        <Text style={{ fontFamily: F.regalBold, fontSize: 40, letterSpacing: 16, marginTop: 14, color: C.gold }}>MINISTRIES</Text>
      </CueView>
      <View style={{ position: 'absolute', left: CW / 2 - (520 * rule) / 2, top: 960, width: 520 * rule, height: 2, backgroundColor: C.gold, opacity: ruleOut }} />
      <CueView t={t} start={2.1} end={4.4} inDur={0.7} outDur={0.5} style={centered(1000)}>
        <Text style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: 12, color: 'rgba(246,239,220,0.65)' }}>P R E S E N T S</Text>
      </CueView>
    </View>
  );
};

// ── Scene 2 — Crest reveal ─────────────────────────────────────────────────
const Reveal: React.FC<{ t: number }> = ({ t }) => {
  const s = 4.45, e = 9.7;
  if (t < 4.2 || t > 9.75) return null;
  const inE = Easing.easeOutBack(clamp((t - s) / 0.72, 0, 1));
  const scale = 0.62 + 0.38 * inE;
  const kb = 1 + 0.05 * clamp((t - (s + 0.72)) / (e - (s + 0.72)), 0, 1);
  const op = Math.min(clamp((t - s) / 0.4, 0, 1), clamp((e - t) / 0.55, 0, 1));
  const glowP = 0.42 + 0.16 * Math.sin(t * 1.9);
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', left: CW / 2 - 500, top: 200, width: 1000, height: 1000, borderRadius: 500, opacity: op * glowP * 0.5, backgroundColor: 'rgba(212,175,55,0.18)' }} />
      <Image source={IMG.crest} contentFit="contain" style={{ position: 'absolute', left: CW / 2 - 400, top: 300, width: 800, height: 800, opacity: op, transform: [{ scale: scale * kb }] }} />
      <CueView t={t} start={6.0} end={9.4} inDur={0.6} outDur={0.45} rise={44} scaleFrom={0.9} style={centered(1230)}>
        <GradientText style={{ fontFamily: F.display, fontSize: 188, letterSpacing: 4 }}>WISELION</GradientText>
      </CueView>
      <CueView t={t} start={6.6} end={9.4} inDur={0.6} outDur={0.45} style={centered(1452)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 70, height: 1, backgroundColor: C.gold }} />
          <Text style={{ fontFamily: F.mono, fontSize: 30, letterSpacing: 12, color: C.cream, marginHorizontal: 26 }}>LIKE A KING</Text>
          <View style={{ width: 70, height: 1, backgroundColor: C.gold }} />
        </View>
      </CueView>
    </View>
  );
};

// ── Scene 3 — Bridge (kinetic) ──────────────────────────────────────────────
const BridgeWord: React.FC<{ t: number; start: number; end: number; text: string; color: string }> = ({ t, start, end, text, color }) => {
  if (t < start || t > end) return null;
  const inE = Easing.easeOutQuart(clamp((t - start) / 0.18, 0, 1));
  const scale = 0.6 + 0.4 * inE;
  const op = Math.min(clamp((t - start) / 0.1, 0, 1), clamp((end - t) / 0.12, 0, 1));
  return (
    <View style={[centered(820), { opacity: op, transform: [{ scale }] }]}>
      <Text style={{ fontFamily: F.display, fontSize: 168, lineHeight: 168 * 0.92, color, letterSpacing: 2, textAlign: 'center' }}>{text}</Text>
    </View>
  );
};
const Bridge: React.FC<{ t: number }> = ({ t }) => {
  if (t < 9.5 || t > 10.95) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.black }]}>
      <BridgeWord t={t} start={9.55} end={10.18} text={'ONE\nMASK.'} color={C.goldHi} />
      <BridgeWord t={t} start={10.2} end={10.9} text={'EVERY\nFORM.'} color={'#16e0ff'} />
    </View>
  );
};

// ── Scene 4 — Montage ───────────────────────────────────────────────────────
const MONTAGE = [
  { key: 'anime', src: IMG.anime, label: 'ANIME', sub: 'NEO-TOKYO GOLD', accent: '#f5d77a', start: 10.85, end: 12.75 },
  { key: 'synth', src: IMG.synth, label: 'SYNTH\nWAVE', sub: '1986 NEON', accent: '#ff3ea5', start: 12.75, end: 14.6 },
  { key: 'graffiti', src: IMG.graffiti, label: 'GRAF\nFITI', sub: 'WALL KING', accent: '#16e0ff', start: 14.6, end: 16.35 },
  { key: 'ukiyoe', src: IMG.ukiyoe, label: 'UKIYO-E', sub: 'FLOATING WORLD', accent: '#ff4d3d', start: 16.35, end: 18.2 },
  { key: 'chalk', src: IMG.chalk, label: 'CHALK', sub: 'STREET PASTEL', accent: '#ff8a1e', start: 18.2, end: 20.0 },
  { key: 'pencil', src: IMG.pencil, label: 'PENCIL', sub: 'RAW GRAPHITE', accent: '#e8e8e8', start: 20.0, end: 21.75 },
  { key: 'vector', src: IMG.vector, label: 'VECTOR', sub: 'CLEAN CUT', accent: '#e9c66a', start: 21.75, end: 23.5 },
  { key: 'spray', src: IMG.spray, label: 'STENCIL', sub: 'SPRAY ICON', accent: '#ffffff', start: 23.5, end: 25.85 },
];
const MontageSlide: React.FC<{ t: number; m: typeof MONTAGE[number]; index: number; total: number }> = ({ t, m, index, total }) => {
  const pre = 0.12;
  const start = m.start - pre;
  if (t < start || t > m.end) return null;
  const localTime = t - start;
  const dur = m.end - start;
  const prog = clamp(localTime / dur, 0, 1);
  const snap = Easing.easeOutQuart(clamp(localTime / 0.24, 0, 1));
  const scale = (1.16 - 0.16 * snap) * (1 + 0.11 * prog);
  const panX = interpolate([0, 1], [-22, 22], Easing.easeInOutSine)(prog) * (index % 2 ? 1 : -1);
  const op = Math.min(clamp(localTime / 0.14, 0, 1), clamp((dur - localTime) / 0.2, 0, 1));
  const lr = Easing.easeOutCubic(clamp((localTime - 0.12) / 0.4, 0, 1));
  return (
    <View style={[StyleSheet.absoluteFill, { opacity: op }]}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: C.black }]}>
        <Image source={m.src} contentFit="cover" style={{ position: 'absolute', left: -CW * 0.06, top: -CH * 0.06, width: CW * 1.12, height: CH * 1.12, transform: [{ scale }, { translateX: panX }] }} />
      </View>
      {/* readability darkening top + bottom */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360, backgroundColor: 'rgba(8,6,7,0.5)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 620, backgroundColor: 'rgba(8,6,7,0.72)' }} />
      <View style={{ position: 'absolute', top: 70, left: 60, right: 60, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: 10, color: C.cream, opacity: 0.85 }}>WISELION</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: 3, color: m.accent }}>{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</Text>
      </View>
      <View style={{ position: 'absolute', left: 60, bottom: 120, opacity: lr, transform: [{ translateY: (1 - lr) * 36 }] }}>
        <View style={{ width: 96, height: 6, backgroundColor: m.accent, marginBottom: 26 }} />
        <Text style={{ fontFamily: F.display, fontSize: 156, lineHeight: 156 * 0.86, color: C.cream, letterSpacing: 1 }}>{m.label}</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 30, letterSpacing: 7, color: m.accent, marginTop: 18 }}>{m.sub}</Text>
      </View>
    </View>
  );
};
const Montage: React.FC<{ t: number }> = ({ t }) => (
  <>
    {MONTAGE.map((m, i) => <MontageSlide key={m.key} t={t} m={m} index={i + 1} total={MONTAGE.length} />)}
    {MONTAGE.map((m) => <FlashCut key={m.key + '-f'} t={t} at={m.start - 0.04} color={m.accent} dur={0.16} max={0.5} />)}
  </>
);

// ── Scene 5 — The Drop ──────────────────────────────────────────────────────
const Drop: React.FC<{ t: number; onCop: () => void }> = ({ t, onCop }) => {
  if (t < 25.7 || t > 31.1) return null;
  const s = 25.7;
  const pulse = 1 + 0.025 * Math.sin((t - s) * 5.5);
  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.black, overflow: 'hidden' }]}>
      <Image source={IMG.anime} contentFit="cover" style={[StyleSheet.absoluteFill, { opacity: 0.16 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,6,7,0.55)' }]} />
      <CueView t={t} start={25.85} end={30.9} inDur={0.45} outDur={0.4} rise={18} style={centered(150)}>
        <Text style={{ fontFamily: F.mono, fontSize: 28, letterSpacing: 14, color: C.gold }}>THE DROP</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 6, color: 'rgba(246,239,220,0.6)', marginTop: 16 }}>LIMITED RUN · 250 PCS</Text>
      </CueView>
      <CueView t={t} start={26.05} end={30.85} inDur={0.6} outDur={0.4} scaleFrom={0.86} style={{ position: 'absolute', left: 290, top: 330, width: 500 }}>
        <View style={{ width: 500, height: 500, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: C.gold, backgroundColor: '#000' }}>
          <Image source={IMG.anime} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        </View>
        <Text style={{ textAlign: 'center', marginTop: 26, fontFamily: F.regalBold, fontSize: 38, letterSpacing: 6, color: C.cream }}>“LIKE-KING” TEE</Text>
      </CueView>
      <CueView t={t} start={26.5} end={30.85} inDur={0.5} outDur={0.4} rise={24} style={centered(1000)}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: F.mono, fontSize: 40, color: 'rgba(246,239,220,0.45)', textDecorationLine: 'line-through', marginRight: 26 }}>$60</Text>
          <GradientText style={{ fontFamily: F.display, fontSize: 150 }}>$48</GradientText>
        </View>
      </CueView>
      <CueView t={t} start={26.8} end={30.85} inDur={0.5} outDur={0.4} rise={18} style={centered(1210)}>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          {sizes.map((sz) => {
            const on = sz === 'L';
            return <Text key={sz} style={{ minWidth: 86, paddingVertical: 18, fontFamily: F.mono, fontSize: 30, textAlign: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: on ? C.gold : 'rgba(246,239,220,0.28)', backgroundColor: on ? C.gold : 'transparent', color: on ? C.black : C.cream }}>{sz}</Text>;
          })}
        </View>
      </CueView>
      <CueView t={t} start={27.1} end={30.85} inDur={0.5} outDur={0.4} rise={20} scaleFrom={0.92} style={centered(1360)}>
        <Pressable onPress={onCop} style={{ transform: [{ scale: pulse }], flexDirection: 'row', alignItems: 'center', paddingVertical: 30, paddingHorizontal: 76, borderRadius: 14, backgroundColor: C.goldGrad }}>
          <Text style={{ fontFamily: F.display, fontSize: 58, letterSpacing: 2, color: '#1a1206' }}>COP NOW </Text>
          <Text style={{ fontSize: 50, color: '#1a1206' }}>→</Text>
        </Pressable>
      </CueView>
      <CueView t={t} start={27.4} end={30.85} inDur={0.5} outDur={0.4} style={centered(1520)}>
        <Text style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: 5, color: 'rgba(246,239,220,0.55)' }}>FREE SHIPPING · WISELION.SHOP</Text>
      </CueView>
    </View>
  );
};

// ── Scene 6 — Sign-off ──────────────────────────────────────────────────────
const SignOff: React.FC<{ t: number }> = ({ t }) => {
  if (t < 31.0 || t > 34.05) return null;
  const glowP = 0.4 + 0.16 * Math.sin(t * 2);
  const fadeOut = clamp((34.0 - t) / 0.6, 0, 1);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.black, opacity: fadeOut }]}>
      <View style={{ position: 'absolute', left: CW / 2 - 380, top: 240, width: 760, height: 760, borderRadius: 380, opacity: glowP * 0.4, backgroundColor: 'rgba(212,175,55,0.16)' }} />
      <CueView t={t} start={31.05} end={33.95} inDur={0.6} outDur={0.5} scaleFrom={0.9} style={{ position: 'absolute', left: CW / 2 - 260, top: 360 }}>
        <Image source={IMG.crest} contentFit="contain" style={{ width: 520, height: 520 }} />
      </CueView>
      <CueView t={t} start={31.4} end={33.95} inDur={0.6} outDur={0.5} rise={30} style={centered(1010)}>
        <GradientText style={{ fontFamily: F.display, fontSize: 150 }}>WISELION</GradientText>
        <Text style={{ fontFamily: F.regalBold, fontSize: 34, letterSpacing: 12, color: C.cream, marginTop: 22 }}>A TRIBE OF KINGS LINE</Text>
      </CueView>
      <CueView t={t} start={31.9} end={33.95} inDur={0.6} outDur={0.5} style={centered(1310)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 80, height: 1, backgroundColor: C.gold }} />
          <Text style={{ fontFamily: F.mono, fontSize: 30, letterSpacing: 9, color: C.gold, marginHorizontal: 26 }}>@WISELION</Text>
          <View style={{ width: 80, height: 1, backgroundColor: C.gold }} />
        </View>
      </CueView>
    </View>
  );
};

// ── Screen ─────────────────────────────────────────────────────────────────
export default function DropReelScreen() {
  const nav = useNavigation<any>();
  const [ready, setReady] = React.useState(false);

  // Preload + decode every reel image before starting, so the fast montage
  // slides (~1.7s each) never flash blank waiting on an image to load/decode.
  React.useEffect(() => {
    const done = () => setReady(true);
    if (config.dropReelBaseUrl) {
      // Remote: warm the HTTP cache for each CDN url.
      const uris = Object.keys(FILES).map((k) => `${config.dropReelBaseUrl}/${FILES[k]}`);
      Promise.all(uris.map((u) => Image.prefetch(u))).then(done).catch(done);
    } else {
      // Bundled: decode the local modules.
      Asset.loadAsync(Object.values(BUNDLED)).then(done).catch(done);
    }
  }, []);

  // Only run the clock once assets are ready (keeps timing in sync with visuals).
  const t = useReelClock(34, ready);

  const cop = () => nav.navigate('Tabs'); // → Store tab to buy

  if (!ready) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={{ color: C.gold, marginTop: 14, fontFamily: F.mono, letterSpacing: 4 }}>LOADING THE DROP…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Logical 1080×1920 canvas: positioned in screen space, then scaled from
          its top-left so all the design's logical left/top values stay valid. */}
      <View
        style={{
          position: 'absolute',
          width: CW,
          height: CH,
          left: 0,
          top: (SCREEN_H - CH * SCALE) / 2,
          transform: [{ scale: SCALE }],
          transformOrigin: 'top left',
        } as any}
      >
        <View style={{ position: 'absolute', width: CW, height: CH, backgroundColor: C.black }}>
          <Embers t={t} />
          <ColdOpen t={t} />
          <Reveal t={t} />
          <Bridge t={t} />
          <Montage t={t} />
          <Drop t={t} onCop={cop} />
          <SignOff t={t} />
          {/* Edge bars */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: C.gold, opacity: 0.5 }} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: C.gold, opacity: 0.5 }} />
        </View>
      </View>

      {/* Close button (outside the scaled canvas so it stays tappable + sharp). */}
      <Pressable onPress={() => nav.goBack()} style={styles.close} hitSlop={12}>
        <Text style={{ color: C.cream, fontSize: 26 }}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black, overflow: 'hidden' },
  close: { position: 'absolute', top: 48, right: 22, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(246,239,220,0.3)' },
});

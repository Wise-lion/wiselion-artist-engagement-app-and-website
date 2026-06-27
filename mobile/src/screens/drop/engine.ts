// Reel timeline engine — a React Native port of the design's animations.jsx.
// A single requestAnimationFrame clock drives global time `t` (seconds, looping);
// scenes read `t` and compute opacity/transform from time windows.
import { useEffect, useRef, useState } from 'react';

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Easing subset used by the Wiselion Drop Reel scenes.
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

// interpolate([0,1],[-22,22], ease) -> (x) => mapped value
export function interpolate(
  input: [number, number],
  output: [number, number],
  ease: (t: number) => number = Easing.linear
) {
  const [i0, i1] = input;
  const [o0, o1] = output;
  return (x: number) => {
    const t = ease(clamp((x - i0) / (i1 - i0), 0, 1));
    return o0 + (o1 - o0) * t;
  };
}

/**
 * Global looping clock. Returns current time in seconds. Re-renders the consumer
 * each animation frame. `running` lets callers pause (e.g. when screen blurs).
 */
export function useReelClock(duration: number, running = true): number {
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      setT(elapsed % duration); // loop
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [duration, running]);

  return t;
}

// Compute a Cue's opacity/translateY/scale from a time window (mirrors the
// design's <Cue> helper: fade+slide+scale in, fade out).
export function cue(
  t: number,
  start: number,
  end: number,
  opts: { inDur?: number; outDur?: number; rise?: number; scaleFrom?: number } = {}
): { visible: boolean; opacity: number; translateY: number; scale: number } {
  const { inDur = 0.5, outDur = 0.5, rise = 0, scaleFrom = 1 } = opts;
  const visible = t >= start - 0.0005 && t <= end + 0.0005;
  const inE = Easing.easeOutCubic(clamp((t - start) / inDur, 0, 1));
  const outE = Easing.easeInQuad(clamp((end - t) / outDur, 0, 1));
  const opacity = visible ? Math.min(inE, outE) : 0;
  return {
    visible,
    opacity,
    translateY: (1 - inE) * rise,
    scale: scaleFrom + (1 - scaleFrom) * inE,
  };
}

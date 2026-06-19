# Wiselion Avatar assets

Drop the branded avatar artwork here:

- `wiselion-avatar.png` — **the golden cybernetic lion-king face** provided by the brand.
  This is the static/idle hero image shown behind the Lottie animation layer and
  used as the fallback whenever a Lottie animation is not yet wired up.

The Lottie animation JSON files live in `src/components/WiselionAvatar/animations/`:
- `idle.json`, `talking.json`, `cheering.json` (placeholders — replace with real rigs).

When real Lottie rigs are produced from the avatar art, the component automatically
crossfades the PNG out and drives the Lottie layer instead (see `WiselionAvatar.tsx`).

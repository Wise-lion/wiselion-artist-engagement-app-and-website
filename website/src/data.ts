// Content harvested from the original Manus site (Manus platform refs removed).
export const MUSIC = [
  { title: 'GOLDEN ROAR', kind: 'Single', year: '2026' },
  { title: 'NEON PRIDE', kind: 'EP', year: '2025' },
  { title: 'KING OF THE PRIDE', kind: 'Single', year: '2025' },
];

export const STREAM_LINKS = [
  { label: 'Spotify', url: 'https://open.spotify.com' },
  { label: 'Apple Music', url: 'https://music.apple.com' },
  { label: 'YouTube', url: 'https://youtube.com/@wiselion' },
];

export const TOURS = [
  { date: 'JUL 18', city: 'Atlanta, GA', venue: 'The Masquerade', status: 'TICKETS' },
  { date: 'AUG 02', city: 'Austin, TX', venue: 'Stubb’s', status: 'TICKETS' },
  { date: 'AUG 23', city: 'Brooklyn, NY', venue: 'Elsewhere', status: 'LOW STOCK' },
  { date: 'SEP 06', city: 'Los Angeles, CA', venue: 'The Roxy', status: 'SOLD OUT' },
];

// Order contact until a self-checkout storefront (Big Cartel / Etsy / Shopify)
// is connected to Printful. "COP NOW" opens a pre-filled order email.
export const ORDER_EMAIL = 'wlikeking@gmail.com';

// Build a mailto: link pre-filled with the product, so orders arrive ready to
// fulfil. Swap to real per-product checkout URLs later (set buyUrl on MERCH).
export const orderMailto = (product: string, price: string) =>
  `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`Order: ${product} (${price})`)}` +
  `&body=${encodeURIComponent(
    `I'd like to order the ${product} — ${price}.\n\nSize: \nColor: \nQuantity: \n\nShipping name:\nAddress:\n\n(Wiselion will reply with payment + confirmation.)`
  )}`;

// The real storefront (Big Cartel). COP NOW buttons open this until each tee
// gets its own product URL (fill buyUrl per item once products are published).
export const SHOP_URL = 'https://wiselion.bigcartel.com';

// Real tee artwork (shared with the app via /public/drop-reel/).
// buyUrl: paste each product's Printful / Teespring / Stripe link here. When
// empty, the button falls back to SHOP_URL.
export const MERCH = [
  { name: '“Like-King” Tee', price: '$48', tag: 'THE DROP', img: '/drop-reel/anime_tshirt_design.webp', buyUrl: '' },
  { name: 'Synthwave Tee', price: '$48', tag: 'NEON DROP', img: '/drop-reel/synthwave_tshirt.webp', buyUrl: '' },
  { name: 'Graffiti Tee', price: '$48', tag: 'WALL KING', img: '/drop-reel/graffiti_tshirt.webp', buyUrl: '' },
  { name: 'Ukiyo-e Tee', price: '$52', tag: 'FLOATING WORLD', img: '/drop-reel/ukiyoe_tshirt.webp', buyUrl: '' },
  { name: 'Stencil Tee', price: '$44', tag: 'SPRAY ICON', img: '/drop-reel/spray_paint_stencil.webp', buyUrl: '' },
  { name: 'Vector Tee', price: '$44', tag: 'CLEAN CUT', img: '/drop-reel/minimalist_vector_v2.webp', buyUrl: '' },
];

export const PILLARS = [
  'Supporting dedicated rangers protecting lions 24/7',
  'Funding patrols and equipment to combat poaching',
  'Education and livelihood programs for local communities',
  'Scientific tracking and habitat protection initiatives',
];

export const IMPACT = [
  { value: '37', label: 'RANGERS SUPPORTED' },
  { value: '12,400', label: 'ACRES PROTECTED' },
  { value: '$84K', label: 'RAISED FOR LIONS' },
];

export const TIERS = [
  { name: 'CUB', price: '$0', sub: 'Free', perks: ['Join the Pride community', 'Show announcements', 'Public drops'] },
  { name: 'KINGDOM PASSPORT', price: '$5', sub: 'per month', perks: ['Everything in Cub', 'Early ticket access', 'City stamps & rewards', 'Exclusive content'], featured: true },
  { name: 'THRONE ROOM', price: '$15', sub: 'per month', perks: ['Everything in Passport', 'Backstage streams', 'Limited merch first dibs', 'Name in the credits'] },
];

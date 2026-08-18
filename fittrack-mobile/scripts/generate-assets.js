/**
 * Generates FitTrack app icons / splash / notification assets from code.
 *
 * No image tooling, no dependencies, fully deterministic: shapes are defined as
 * coverage predicates in a unit square, sampled 4x4 per pixel for antialiasing,
 * and written through a minimal PNG encoder.
 *
 * The mark is a progress ring with a 36° opening and round caps, wrapped around
 * three ascending bars — the same language as the dashboard's goal rings, and
 * legible down to a 24dp notification silhouette.
 *
 * Usage: node scripts/generate-assets.js  (npm run generate-assets)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// FitTrack brand gradient (Tailwind blue-600 → indigo-700), matching
// `gradients.brand` in src/constants/theme.ts.
const GRADIENT_FROM = [0x25, 0x63, 0xeb];
const GRADIENT_TO = [0x43, 0x38, 0xca];
const WHITE = [0xff, 0xff, 0xff];

// ---------- Minimal PNG encoder ----------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** rgba: Buffer of size w*h*4 */
function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- The mark, in a unit square ----------

/** Ring: outer edge, stroke thickness, and the opening at 12 o'clock. */
const RING_OUTER = 0.47;
const RING_STROKE = 0.105;
const RING_INNER = RING_OUTER - RING_STROKE;
const RING_MID = (RING_OUTER + RING_INNER) / 2;
const CAP_RADIUS = RING_STROKE / 2;
/** Half-width of the gap, in radians (≈18° each side of vertical). */
const GAP_HALF = 0.32;
const CAP_ANGLES = [-Math.PI / 2 + GAP_HALF, -Math.PI / 2 - GAP_HALF];

/** Three ascending bars, bottom-aligned inside the ring. */
const BAR_WIDTH = 0.1;
const BAR_SPACING = 0.05;
// Nudged left of and above true centre: the ascending heights put the visual
// mass low and to the right, so geometric centring reads as off-centre.
const BAR_LEFT = 0.285;
const BAR_BASELINE = 0.665;
const BAR_HEIGHTS = [0.17, 0.28, 0.39];

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Stadium / rounded-rectangle coverage test. */
function insideRoundRect(x, y, x0, y0, w, h, r) {
  const cx = clamp(x, x0 + r, x0 + w - r);
  const cy = clamp(y, y0 + r, y0 + h - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** The two round caps that terminate the arc. */
function insideCap(x, y) {
  for (const angle of CAP_ANGLES) {
    const cx = 0.5 + RING_MID * Math.cos(angle);
    const cy = 0.5 + RING_MID * Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= CAP_RADIUS * CAP_RADIUS) return true;
  }
  return false;
}

function insideRing(x, y) {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d >= RING_INNER && d <= RING_OUTER) {
    // Angular distance from straight up, wrapped to [0, π].
    let diff = Math.abs(Math.atan2(dy, dx) - -Math.PI / 2);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff >= GAP_HALF) return true;
  }
  return insideCap(x, y);
}

function insideBars(x, y) {
  for (let i = 0; i < BAR_HEIGHTS.length; i++) {
    const x0 = BAR_LEFT + i * (BAR_WIDTH + BAR_SPACING);
    const h = BAR_HEIGHTS[i];
    if (insideRoundRect(x, y, x0, BAR_BASELINE - h, BAR_WIDTH, h, BAR_WIDTH / 2)) return true;
  }
  return false;
}

function insideMark(x, y) {
  return insideRing(x, y) || insideBars(x, y);
}

// ---------- Rendering ----------

const SUPERSAMPLE = 4;

/**
 * Renders one square asset.
 *
 * opts:
 *   background   'gradient' | 'none'
 *   cornerRadius rounding of the background, as a fraction of the size
 *   mark         'white' | 'none'
 *   markScale    the mark's box as a fraction of the canvas
 */
function render(size, opts) {
  const { background = 'gradient', cornerRadius = 0, mark = 'white', markScale = 0.6 } = opts;
  const rgba = Buffer.alloc(size * size * 4);

  const markSize = size * markScale;
  const markOrigin = (size - markSize) / 2;
  const cornerR = cornerRadius * size;

  const insideBackground = (x, y) => {
    if (background === 'none') return false;
    if (cornerR <= 0) return x >= 0 && x < size && y >= 0 && y < size;
    const cx = clamp(x, cornerR, size - cornerR);
    const cy = clamp(y, cornerR, size - cornerR);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= cornerR * cornerR;
  };

  const markAt = (x, y) => {
    if (mark === 'none') return false;
    return insideMark((x - markOrigin) / markSize, (y - markOrigin) / markSize);
  };

  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgHits = 0;
      let markHits = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const x = px + (sx + 0.5) / SUPERSAMPLE;
          const y = py + (sy + 0.5) / SUPERSAMPLE;
          if (insideBackground(x, y)) bgHits++;
          if (markAt(x, y)) markHits++;
        }
      }
      const bgCover = bgHits / samples;
      const markCover = markHits / samples;

      // Diagonal gradient, matching the app's `start {0,0} → end {1,1}`.
      const t = size > 1 ? (px + py) / (2 * (size - 1)) : 0;
      const gradient = [
        Math.round(GRADIENT_FROM[0] + (GRADIENT_TO[0] - GRADIENT_FROM[0]) * t),
        Math.round(GRADIENT_FROM[1] + (GRADIENT_TO[1] - GRADIENT_FROM[1]) * t),
        Math.round(GRADIENT_FROM[2] + (GRADIENT_TO[2] - GRADIENT_FROM[2]) * t),
      ];

      let color = [0, 0, 0];
      let alpha = 0;

      if (bgCover > 0) {
        color = gradient;
        alpha = bgCover;
      }
      if (markCover > 0) {
        color =
          alpha > 0
            ? [
                color[0] * (1 - markCover) + WHITE[0] * markCover,
                color[1] * (1 - markCover) + WHITE[1] * markCover,
                color[2] * (1 - markCover) + WHITE[2] * markCover,
              ]
            : WHITE.slice();
        alpha = Math.max(alpha, markCover);
      }

      const idx = (py * size + px) * 4;
      rgba[idx] = Math.round(color[0]);
      rgba[idx + 1] = Math.round(color[1]);
      rgba[idx + 2] = Math.round(color[2]);
      rgba[idx + 3] = Math.round(alpha * 255);
    }
  }

  return encodePng(size, size, rgba);
}

// ---------- Outputs ----------

const OUT = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(OUT, { recursive: true });

const outputs = [
  // App icon: full-bleed gradient, iOS and the launcher mask the corners.
  ['icon.png', render(1024, { background: 'gradient', mark: 'white', markScale: 0.62 })],

  // Android adaptive icon layers. The launcher can crop to a circle inscribed
  // in the middle 66/108 of the canvas, so the foreground stays under ~0.61.
  ['android-icon-background.png', render(1024, { background: 'gradient', mark: 'none' })],
  ['android-icon-foreground.png', render(1024, { background: 'none', markScale: 0.56 })],
  // Material You tints this layer itself — it must be a plain white silhouette.
  ['android-icon-monochrome.png', render(1024, { background: 'none', markScale: 0.56 })],

  // Splash: the mark on a rounded gradient card, over the #EFF6FF splash colour.
  [
    'splash-icon.png',
    render(512, { background: 'gradient', cornerRadius: 0.24, markScale: 0.56 }),
  ],

  // Android notification small icon — rendered as an alpha mask, so white only.
  ['notification-icon.png', render(96, { background: 'none', markScale: 0.82 })],
];

for (const [name, buffer] of outputs) {
  fs.writeFileSync(path.join(OUT, name), buffer);
  console.log(`✓ assets/images/${name} (${buffer.length} bytes)`);
}
console.log('Done.');

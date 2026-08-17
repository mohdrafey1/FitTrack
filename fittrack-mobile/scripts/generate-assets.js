/**
 * Generates FitTrack app icons/splash from code (no image tooling needed).
 *
 * The mark reproduces the web app's logo: a blue→indigo gradient square with
 * bold white "FT" — both letters are pure rectangles, so they render crisply.
 *
 * Usage: node scripts/generate-assets.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// FitTrack brand gradient (Tailwind blue-600 → indigo-700).
const GRADIENT_TOP = [0x25, 0x63, 0xeb];
const GRADIENT_BOTTOM = [0x43, 0x38, 0xca];
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

/** rgba: Uint8Array of size w*h*4 */
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

// ---------- Scene rendering ----------

/** "FT" letter rectangles in a unit box (x, y, w, h) with stroke t. */
function letterRects() {
  const H = 1;
  const W = 0.72; // letter width relative to height
  const t = 0.21; // stroke thickness relative to height
  const gap = 0.24;
  const rects = [];
  // F
  rects.push([0, 0, t, H]); // stem
  rects.push([0, 0, W, t]); // top bar
  rects.push([0, (H - t) / 2, W * 0.82, t]); // middle bar
  // T
  const tx = W + gap;
  rects.push([tx, 0, W, t]); // top bar
  rects.push([tx + (W - t) / 2, 0, t, H]); // stem
  return { rects, totalW: W + gap + W, totalH: H };
}

/**
 * Render the scene at (width×height) with 4×4 supersampling.
 * opts: { background: 'gradient'|'none', mark: 'white'|'gradient'|'none',
 *         markScale, cornerRadius (0..0.5 of size, on background), }
 */
function render(size, opts) {
  const { background = 'gradient', mark = 'white', markScale = 0.5, cornerRadius = 0 } = opts;
  const SS = 4;
  const rgba = Buffer.alloc(size * size * 4);
  const { rects, totalW, totalH } = letterRects();

  // Mark placement: centered, letters height = markScale * size * (totalH/max)
  const scale = (markScale * size) / Math.max(totalW, totalH * 1.6);
  const markW = totalW * scale;
  const markH = totalH * scale;
  const markX = (size - markW) / 2;
  const markY = (size - markH) / 2;

  const r = cornerRadius * size;

  const insideRounded = (x, y) => {
    if (r <= 0) return x >= 0 && x < size && y >= 0 && y < size;
    const cx = Math.min(Math.max(x, r), size - r);
    const cy = Math.min(Math.max(y, r), size - r);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };

  const insideMark = (x, y) => {
    const lx = (x - markX) / scale;
    const ly = (y - markY) / scale;
    for (const [rx, ry, rw, rh] of rects) {
      if (lx >= rx && lx <= rx + rw && ly >= ry && ly <= ry + rh) return true;
    }
    return false;
  };

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgCover = 0;
      let markCover = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          const inBg = background === 'none' ? false : insideRounded(x, y);
          const inMark = insideMark(x, y);
          if (inBg) bgCover++;
          if (inMark) markCover++;
        }
      }
      bgCover /= SS * SS;
      markCover /= SS * SS;

      const tGrad = py / (size - 1);
      const gradColor = [
        Math.round(GRADIENT_TOP[0] + (GRADIENT_BOTTOM[0] - GRADIENT_TOP[0]) * tGrad),
        Math.round(GRADIENT_TOP[1] + (GRADIENT_BOTTOM[1] - GRADIENT_TOP[1]) * tGrad),
        Math.round(GRADIENT_TOP[2] + (GRADIENT_BOTTOM[2] - GRADIENT_TOP[2]) * tGrad),
      ];

      let colorAcc = [0, 0, 0];
      let alpha = 0;

      if (background !== 'none' && bgCover > 0) {
        colorAcc = gradColor.slice();
        alpha = bgCover;
      }

      if (markCover > 0) {
        const markColor = mark === 'gradient' ? gradColor : WHITE;
        if (alpha > 0) {
          // Mark drawn over the background.
          colorAcc = [
            colorAcc[0] * (1 - markCover) + markColor[0] * markCover,
            colorAcc[1] * (1 - markCover) + markColor[1] * markCover,
            colorAcc[2] * (1 - markCover) + markColor[2] * markCover,
          ];
          alpha = Math.max(alpha, markCover);
        } else {
          colorAcc = markColor.slice();
          alpha = markCover;
        }
      }

      const idx = (py * size + px) * 4;
      rgba[idx] = Math.round(colorAcc[0]);
      rgba[idx + 1] = Math.round(colorAcc[1]);
      rgba[idx + 2] = Math.round(colorAcc[2]);
      rgba[idx + 3] = Math.round(alpha * 255);
    }
  }

  return encodePng(size, size, rgba);
}

// ---------- Outputs ----------

const OUT = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(OUT, { recursive: true });

const outputs = [
  // Main app icon: full-bleed gradient square with white FT (iOS masks corners itself).
  ['icon.png', render(1024, { background: 'gradient', mark: 'white', markScale: 0.52 })],
  // Android adaptive: gradient background layer + white FT foreground layer.
  ['android-icon-background.png', render(1024, { background: 'gradient', mark: 'none' })],
  [
    'android-icon-foreground.png',
    render(1024, { background: 'none', mark: 'white', markScale: 0.34 }),
  ],
  [
    'android-icon-monochrome.png',
    render(1024, { background: 'none', mark: 'white', markScale: 0.34 }),
  ],
  // Splash: the web app's logo card — rounded gradient square with white FT.
  [
    'splash-icon.png',
    render(512, { background: 'gradient', mark: 'white', markScale: 0.5, cornerRadius: 0.22 }),
  ],
  // Android notification small icon (white-on-transparent).
  [
    'notification-icon.png',
    render(96, { background: 'none', mark: 'white', markScale: 0.7 }),
  ],
];

for (const [name, buffer] of outputs) {
  fs.writeFileSync(path.join(OUT, name), buffer);
  console.log(`✓ assets/images/${name} (${buffer.length} bytes)`);
}
console.log('Done.');

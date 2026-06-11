// Deterministic favicon generator — Typelessity brand mark (white "T" on an
// orange #FF6B2B disk), mirroring public/favicon.svg. Pure Node (zlib only),
// no ImageMagick/librsvg needed, so it regenerates identically on any machine.
//
//   node tools/gen-favicon.mjs
//
// Writes public/favicon.ico (16/32/48 PNG-in-ICO) + /tmp/favicon-preview.png.

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const ORANGE = [0xff, 0x6b, 0x2b];
const WHITE = [0xff, 0xff, 0xff];

// --- PNG encoding (truecolour + alpha, no external deps) ---------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- The mark: orange disk + white geometric "T", 8x supersampled for AA -----
function renderRGBA(size) {
  const SS = 8;
  const R = size * SS;
  const rgba = Buffer.alloc(size * size * 4);
  const cx = R / 2;
  const cy = R / 2;
  const rad = R / 2; // full-bleed disk, like the SVG (cx16 cy16 r16 in a 32 box)
  // "T" geometry in supersampled units (bar near the top, stem to ~3/4 down)
  const barX0 = 0.25 * R;
  const barX1 = 0.75 * R;
  const barY0 = 0.27 * R;
  const barY1 = 0.4 * R;
  const stemX0 = 0.435 * R;
  const stemX1 = 0.565 * R;
  const stemY0 = 0.27 * R;
  const stemY1 = 0.73 * R;
  const total = SS * SS;
  for (let fy = 0; fy < size; fy++) {
    for (let fx = 0; fx < size; fx++) {
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let covered = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = fx * SS + sx + 0.5;
          const py = fy * SS + sy + 0.5;
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy > rad * rad) continue; // outside disk → transparent
          const inBar = px >= barX0 && px < barX1 && py >= barY0 && py < barY1;
          const inStem = px >= stemX0 && px < stemX1 && py >= stemY0 && py < stemY1;
          const col = inBar || inStem ? WHITE : ORANGE;
          sr += col[0];
          sg += col[1];
          sb += col[2];
          covered++;
        }
      }
      const i = (fy * size + fx) * 4;
      if (covered > 0) {
        rgba[i] = Math.round(sr / covered);
        rgba[i + 1] = Math.round(sg / covered);
        rgba[i + 2] = Math.round(sb / covered);
        rgba[i + 3] = Math.round((covered / total) * 255);
      }
    }
  }
  return rgba;
}

// --- ICO container (embeds PNG payloads, supported by every modern browser) ---
function buildICO(sizes) {
  const pngs = sizes.map((s) => encodePNG(s, renderRGBA(s)));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  sizes.forEach((s, idx) => {
    const e = 6 + idx * 16;
    header[e] = s >= 256 ? 0 : s; // width  (0 ⇒ 256)
    header[e + 1] = s >= 256 ? 0 : s; // height
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(pngs[idx].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[idx].length;
  });
  return Buffer.concat([header, ...pngs]);
}

// --- Self-test: the mark must read correctly before we ship the bytes --------
function pixel(rgba, size, fx, fy) {
  const i = (fy * size + fx) * 4;
  return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]];
}
const probe = renderRGBA(32);
const [, , , cornerA] = pixel(probe, 32, 0, 0);
const [cr, cg, cb, cA] = pixel(probe, 32, 16, 16); // centre → stem → white
const [lr, lg, lb, lA] = pixel(probe, 32, 4, 16); // left of disk, below bar → orange
if (cornerA !== 0) throw new Error(`corner must be transparent, got alpha ${cornerA}`);
if (!(cA === 255 && cr > 240 && cg > 240 && cb > 240))
  throw new Error(`centre must be opaque white, got ${[cr, cg, cb, cA]}`);
if (!(lA === 255 && lr > 230 && lg > 80 && lg < 130 && lb > 20 && lb < 70))
  throw new Error(`disk body must be brand orange, got ${[lr, lg, lb, lA]}`);

// --- Emit --------------------------------------------------------------------
const ico = buildICO([16, 32, 48]);
writeFileSync(new URL('../public/favicon.ico', import.meta.url), ico);
writeFileSync('/tmp/favicon-preview.png', encodePNG(128, renderRGBA(128)));
console.log(`favicon.ico written — ${ico.length} bytes, sizes 16/32/48; self-test OK`);
console.log('preview: /tmp/favicon-preview.png (128px)');

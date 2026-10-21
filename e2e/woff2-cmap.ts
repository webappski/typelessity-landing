import { brotliDecompressSync } from 'node:zlib';

// L15 (2026-10-21): the code points a WOFF2 font file really has a glyph for — read from the file's own cmap table, so a guard
// can tell whether a character of a page is drawn by our font or by a fallback. Pure Node (WOFF2 = one brotli stream; the
// cmap table is never transformed — W3C WOFF2 §5.1), no font tool on the machine. Formats 4 and 12, the two Google ships.
// Checked once against fontTools 4.67 getBestCmap() on the four Montserrat files (632, 232 and the subsets) — the same sets.

const KNOWN_TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

function base128(buf: Buffer, at: { p: number }): number {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[at.p++]!;
    value = value * 128 + (b & 0x7f);
    if (!(b & 0x80)) return value;
  }
  throw new Error('woff2: UIntBase128 longer than 5 bytes');
}

function cmapTable(woff2: Buffer): Buffer {
  if (woff2.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file');
  const numTables = woff2.readUInt16BE(12);
  const compressed = woff2.readUInt32BE(20);
  const at = { p: 48 };
  let offset = 0;
  let cmap: { offset: number; length: number } | null = null;
  for (let i = 0; i < numTables; i++) {
    const flags = woff2[at.p++]!;
    let tag: string;
    if ((flags & 0x3f) === 63) { tag = woff2.toString('latin1', at.p, at.p + 4); at.p += 4; } else tag = KNOWN_TAGS[flags & 0x3f]!;
    const version = (flags >> 6) & 3;
    const origLength = base128(woff2, at);
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const length = transformed ? base128(woff2, at) : origLength;
    if (tag === 'cmap') cmap = { offset, length };
    offset += length;
  }
  if (!cmap) throw new Error('woff2: no cmap table');
  const data = brotliDecompressSync(woff2.subarray(at.p, at.p + compressed));
  return data.subarray(cmap.offset, cmap.offset + cmap.length);
}

/** Every code point the font maps to a glyph other than .notdef. */
export function woff2CodePoints(woff2: Buffer): Set<number> {
  const t = cmapTable(woff2);
  const n = t.readUInt16BE(2);
  const subtables: Array<{ platform: number; encoding: number; at: number }> = [];
  for (let i = 0; i < n; i++) subtables.push({ platform: t.readUInt16BE(4 + i * 8), encoding: t.readUInt16BE(6 + i * 8), at: t.readUInt32BE(8 + i * 8) });
  const pick = subtables.find((s) => s.platform === 3 && s.encoding === 10) ?? subtables.find((s) => s.platform === 3 && s.encoding === 1) ?? subtables.find((s) => s.platform === 0);
  if (!pick) throw new Error('woff2: no Unicode cmap subtable');
  const out = new Set<number>();
  const s = pick.at;
  const format = t.readUInt16BE(s);
  if (format === 12) {
    const groups = t.readUInt32BE(s + 12);
    for (let g = 0; g < groups; g++) {
      const start = t.readUInt32BE(s + 16 + g * 12), end = t.readUInt32BE(s + 20 + g * 12), gid = t.readUInt32BE(s + 24 + g * 12);
      for (let c = start; c <= end; c++) if (gid + (c - start) !== 0) out.add(c);
    }
  } else if (format === 4) {
    const segX2 = t.readUInt16BE(s + 6);
    const ends = s + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
    for (let i = 0; i < segX2 / 2; i++) {
      const end = t.readUInt16BE(ends + i * 2), start = t.readUInt16BE(starts + i * 2);
      const delta = t.readInt16BE(deltas + i * 2), rangeOffset = t.readUInt16BE(ranges + i * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid: number;
        if (rangeOffset === 0) gid = (c + delta) & 0xffff;
        else {
          const g = t.readUInt16BE(ranges + i * 2 + rangeOffset + (c - start) * 2);
          gid = g === 0 ? 0 : (g + delta) & 0xffff;
        }
        if (gid !== 0) out.add(c);
      }
    }
  } else throw new Error(`woff2: cmap format ${format} is not read`);
  return out;
}

/** `U+0100-02BA, U+0304, …` -> [[0x100, 0x2ba], [0x304, 0x304], …] */
export function parseUnicodeRange(range: string): Array<[number, number]> {
  return range.split(',').map((part) => {
    const m = part.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i);
    if (!m) throw new Error(`unicode-range part «${part.trim()}» is not U+XXXX or U+XXXX-YYYY`);
    return [parseInt(m[1]!, 16), parseInt(m[2] ?? m[1]!, 16)];
  });
}

export const inRanges = (cp: number, ranges: ReadonlyArray<readonly [number, number]>): boolean => ranges.some(([a, b]) => a <= cp && cp <= b);

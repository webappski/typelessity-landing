import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Guards the Typelessity brand favicon (white "T" on an orange disk) against
// silently regressing to the stock Angular default. Reads the real shipped
// asset — no mocks. Regenerate with `npm run gen:favicon`.

const ICO = readFileSync(new URL('../../../../public/favicon.ico', import.meta.url));
const ANGULAR_DEFAULT_MD5 = '05bcfe9a02b93e1c5a5da14bfda8c41f';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('favicon.ico is a non-empty, valid ICO container', () => {
  assert.ok(ICO.length > 0, 'favicon.ico is empty');
  assert.equal(ICO.readUInt16LE(0), 0, 'ICONDIR reserved field must be 0');
  assert.equal(ICO.readUInt16LE(2), 1, 'ICONDIR type must be 1 (icon)');
  assert.ok(ICO.readUInt16LE(4) >= 1, 'ICO must contain at least one image');
});

test('favicon.ico is the Typelessity brand mark, not the Angular default', () => {
  const md5 = createHash('md5').update(ICO).digest('hex');
  assert.notEqual(md5, ANGULAR_DEFAULT_MD5, 'favicon.ico is still the stock Angular default');

  // Our generator embeds PNG payloads; the stock default is legacy BMP. Verify
  // the first directory entry points at a PNG — proves the brand asset shipped.
  const len = ICO.readUInt32LE(6 + 8);
  const offset = ICO.readUInt32LE(6 + 12);
  const payload = ICO.subarray(offset, offset + len);
  assert.ok(payload.subarray(0, 8).equals(PNG_SIGNATURE), 'first icon entry is not a PNG payload');
});

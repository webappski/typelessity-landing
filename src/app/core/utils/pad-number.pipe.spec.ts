import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PadNumberPipe } from './pad-number.pipe';

const pipe = new PadNumberPipe();

test('padNumber: pads single digits to two', () => {
  assert.equal(pipe.transform(1), '01');
  assert.equal(pipe.transform(9), '09');
});

test('padNumber: leaves >= len unchanged', () => {
  assert.equal(pipe.transform(10), '10');
  assert.equal(pipe.transform(123), '123');
});

test('padNumber: respects custom len', () => {
  assert.equal(pipe.transform(1, 3), '001');
  assert.equal(pipe.transform(42, 4), '0042');
});

test('padNumber: accepts string input', () => {
  assert.equal(pipe.transform('7'), '07');
});

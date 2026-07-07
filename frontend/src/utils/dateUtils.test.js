import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDateForDateInput } from './dateUtils.js';

test('normalizes DD-MM-YYYY values for date inputs', () => {
  assert.equal(normalizeDateForDateInput('14-05-2024'), '2024-05-14');
});

test('normalizes slash-separated values for date inputs', () => {
  assert.equal(normalizeDateForDateInput('05/14/2024'), '2024-05-14');
});

test('preserves ISO dates', () => {
  assert.equal(normalizeDateForDateInput('2024-05-14'), '2024-05-14');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { selectDistinctAssignments } = require('./assignmentSelection');

const now = new Date(2026, 10, 25, 12);

test('returns every assigned member for the requested list sizes even when plans expired', () => {
  for (const count of [10, 49, 50, 51, 99, 100, 150]) {
    const rows = Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      user_id: index + 1,
      trainer_id: 15,
      status: 'active',
      plan_end_date: '2020-01-01',
      updated_at: '2026-01-01T00:00:00.000Z',
    }));

    const selected = selectDistinctAssignments(rows, { includeExpired: true, trainerId: 15, now });

    assert.equal(selected.length, count, `expected ${count} assigned members`);
    assert.equal(new Set(selected.map((row) => row.user_id)).size, count);
  }
});

test('keeps the existing expiry filter unless expired assignments are explicitly included', () => {
  const rows = [
    { id: 1, user_id: 1, trainer_id: 15, plan_end_date: '2020-01-01' },
    { id: 2, user_id: 2, trainer_id: 15, plan_end_date: '2027-01-01' },
  ];

  assert.deepEqual(selectDistinctAssignments(rows, { trainerId: 15, now }), [rows[1]]);
});

test('returns one latest assignment per member and filters by trainer after selection', () => {
  const rows = [
    { id: 1, user_id: 1, trainer_id: 15, status: 'active', updated_at: '2026-01-01' },
    { id: 2, user_id: 1, trainer_id: 17, status: 'active', updated_at: '2026-02-01' },
    { id: 3, user_id: 2, trainer_id: 15, status: 'active', updated_at: '2026-01-01' },
  ];

  assert.deepEqual(
    selectDistinctAssignments(rows, { includeExpired: true, trainerId: 15, now }),
    [rows[2]],
  );
});

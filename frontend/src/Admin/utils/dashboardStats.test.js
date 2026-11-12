import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import { buildDashboardStats } from './dashboardStats.js';

test('buildDashboardStats filters date-based metrics by the selected range', () => {
  const today = dayjs();
  const members = [
    { id: 1, created_at: today.toISOString() },
    { id: 2, created_at: today.subtract(1, 'day').toISOString() },
  ];

  const orders = [
    { id: 1, status: 'pending', created_at: today.toISOString(), total_amount: 100 },
    { id: 2, status: 'delivered', created_at: today.subtract(1, 'day').toISOString(), total_amount: 200 },
  ];

  const attendance = [
    { id: 1, date: today.toISOString(), status: 'Present' },
    { id: 2, date: today.subtract(1, 'day').toISOString(), status: 'Absent' },
  ];

  const products = [{ id: 1, stock: 4 }, { id: 2, stock: 10 }];
  const plans = [{ id: 1, active: true }];
  const staff = [{ id: 1, status: 'active' }];
  const equipment = [{ id: 1 }];

  const { stats } = buildDashboardStats({
    members,
    plans,
    orders,
    staff,
    equipment,
    products,
    attendance,
    filterRange: { type: 'Today', range: null },
  });

  assert.equal(stats.newMembersToday, 1);
  assert.equal(stats.todayOrdersCount, 1);
  assert.equal(stats.checkinsToday, 1);
  assert.equal(stats.pendingPayments, 1);
  assert.equal(stats.lowStockCount, 1);
});

test('buildDashboardStats counts unique gym member records and excludes unregistered users', () => {
  const { stats, filteredMembers } = buildDashboardStats({
    members: [
      { id: 1, source: 'members', created_at: '2026-01-01' },
      { id: 1, source: 'members', created_at: '2026-01-01' },
      { id: 2, source: 'members', created_at: '2026-01-02' },
      { id: null, source: 'users', created_at: '2026-01-03' },
    ],
    filterRange: { type: 'All Time', range: null },
  });

  assert.equal(stats.members, 2);
  assert.equal(stats.newMembersToday, 2);
  assert.equal(filteredMembers.length, 2);
});

test('buildDashboardStats uses the highest assigned numeric member ID for the total', () => {
  const { stats } = buildDashboardStats({
    members: [
      { id: 1, member_id: '736', source: 'members' },
      { id: 2, member_id: '738', source: 'members' },
      { id: null, member_id: null, source: 'users' },
    ],
  });

  assert.equal(stats.members, 738);
});

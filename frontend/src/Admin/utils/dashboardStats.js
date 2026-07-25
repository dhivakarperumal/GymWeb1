import dayjs from 'dayjs';
import { getDateRangeBounds } from './dateUtils.js';

export const buildDashboardStats = ({
  members = [],
  plans = [],
  orders = [],
  staff = [],
  equipment = [],
  products = [],
  attendance = [],
  filterRange = { type: 'All Time', range: null },
}) => {
  const activePlans = plans.filter((p) => p.active);
  const activeStaff = staff.filter((s) => s.status === 'active');
  const { start, end } = getDateRangeBounds(filterRange.type, filterRange.range);
  const isAllTime = filterRange.type === 'All Time';

  const isWithinRange = (value) => {
    const date = dayjs(value);
    if (!date.isValid()) return false;
    if (isAllTime) return true;
    if (!start || !end) return true;
    return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
  };

  const filteredOrders = orders.filter((order) => isWithinRange(order.created_at || order.createdAt));
  const filteredMembers = members.filter((member) => isWithinRange(member.created_at || member.createdAt));
  const filteredAttendance = attendance.filter((record) => isWithinRange(record.date || record.check_in));

  const newStats = {
    members: members.length,
    checkinsToday: filteredAttendance.filter((a) => String(a.status || '').toLowerCase().includes('present')).length,
    activePlans: activePlans.length,
    pendingPayments: orders.filter((o) => String(o.status || '').toLowerCase() === 'pending').length,
    trainers: activeStaff.length,
    equipmentDue: equipment.length,
    totalOrders: orders.length,
    totalProducts: products.length,
    newMembersToday: filteredMembers.length,
    todayOrdersCount: filteredOrders.length,
    lowStockCount: products.filter((p) => (p.stock || p.quantity || 0) < 5).length,
    expiringCount: 0,
  };

  return {
    stats: newStats,
    filteredOrders,
    filteredMembers,
    filteredAttendance,
  };
};

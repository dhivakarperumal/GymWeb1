function selectDistinctAssignments(rows, { includeExpired = false, trainerId = null, now = new Date() } = {}) {
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateKey = (value) => {
    if (!value) return '';
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    return String(value).slice(0, 10);
  };
  const timestamp = (value) => {
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const rank = (row) => [
    String(row.status || '').toLowerCase() === 'active' ? 1 : 0,
    (!row.plan_start_date || dateKey(row.plan_start_date) <= todayKey) &&
      (!row.plan_end_date || dateKey(row.plan_end_date) >= todayKey) ? 1 : 0,
    timestamp(row.updated_at),
    dateKey(row.plan_start_date),
    Number(row.id) || 0,
  ];
  const compareRank = (left, right) => {
    const leftRank = rank(left);
    const rightRank = rank(right);
    for (let index = 0; index < leftRank.length; index += 1) {
      if (leftRank[index] !== rightRank[index]) {
        return leftRank[index] > rightRank[index] ? 1 : -1;
      }
    }
    return 0;
  };

  const latestByMember = new Map();
  for (const row of rows) {
    const memberKey = String(row.user_id);
    const endDate = dateKey(row.plan_end_date);
    if (!memberKey || memberKey === 'undefined' || (!includeExpired && endDate && endDate < todayKey)) continue;

    const current = latestByMember.get(memberKey);
    if (!current || compareRank(row, current) > 0) {
      latestByMember.set(memberKey, row);
    }
  }

  return [...latestByMember.values()]
    .filter((row) => trainerId === null || Number(row.trainer_id) === Number(trainerId))
    .sort((left, right) => timestamp(right.updated_at) - timestamp(left.updated_at));
}

module.exports = { selectDistinctAssignments };

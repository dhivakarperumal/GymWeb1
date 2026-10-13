const getMemberKey = (plan) => {
  const memberId = [
    plan.user_id ??
      plan.userId,
    plan.user_id_uuid ?? plan.userUuid,
    plan.member_id ?? plan.memberId,
  ].find((value) => value !== null && value !== undefined && String(value).trim() !== "");

  return memberId === undefined ? null : String(memberId);
};

const getPlanTimestamp = (plan) => {
  const value = plan.updated_at || plan.updatedAt || plan.created_at || plan.createdAt;
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function getLatestPlanPerMember(plans) {
  const latestByMember = new Map();
  const uniquePlans = [];

  plans.forEach((plan, index) => {
    const memberKey = getMemberKey(plan);
    if (!memberKey) {
      uniquePlans.push({ plan, index });
      return;
    }

    const current = latestByMember.get(memberKey);
    const currentTimestamp = current ? getPlanTimestamp(current.plan) : -1;
    const planTimestamp = getPlanTimestamp(plan);
    const currentId = Number(current?.plan?.id) || 0;
    const planId = Number(plan.id) || 0;

    if (
      !current ||
      planTimestamp > currentTimestamp ||
      (planTimestamp === currentTimestamp && planId > currentId)
    ) {
      latestByMember.set(memberKey, { plan, index });
    }
  });

  const latestIndices = new Set([
    ...[...latestByMember.values()].map(({ index }) => index),
    ...uniquePlans.map(({ index }) => index),
  ]);
  return plans.filter((_, index) => latestIndices.has(index));
}

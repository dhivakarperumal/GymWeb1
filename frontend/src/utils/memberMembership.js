export const selectMemberListMembership = (memberships = []) => {
  const regularMemberships = memberships.filter((membership) => {
    const hasPTPlan =
      membership.has_pt_plan === 1 ||
      membership.has_pt_plan === true ||
      membership.has_pt_plan === "1";
    return !hasPTPlan;
  });

  return regularMemberships.reduce((latest, membership) => {
    if (!latest) return membership;
    const latestId = Number(latest.id) || 0;
    const membershipId = Number(membership.id) || 0;
    return membershipId > latestId ? membership : latest;
  }, null);
};

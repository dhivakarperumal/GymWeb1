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

const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export const resolveMembershipPricing = (membership = {}, fallback = {}) => {
  membership = membership || {};
  fallback = fallback || {};
  const catalogPrice = positiveNumber(membership.catalog_plan_price);
  const catalogDiscountPercent = positiveNumber(membership.catalog_plan_discount);
  const catalogFinalPrice =
    positiveNumber(membership.catalog_plan_final_price) ||
    (catalogPrice && catalogDiscountPercent < 100
      ? catalogPrice * (1 - catalogDiscountPercent / 100)
      : catalogPrice);
  const price =
    positiveNumber(membership.price) ||
    catalogFinalPrice ||
    positiveNumber(fallback.price);
  const amount =
    positiveNumber(membership.amount) ||
    catalogPrice ||
    positiveNumber(fallback.amount) ||
    price;
  const discount =
    positiveNumber(membership.discount) ||
    (amount > price ? amount - price : positiveNumber(fallback.discount));

  return { price, amount, discount };
};

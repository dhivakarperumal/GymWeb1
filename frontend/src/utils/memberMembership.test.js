import test from "node:test";
import assert from "node:assert/strict";
import {
  getMemberDisplayStatus,
  resolveMembershipPricing,
  selectMemberListMembership,
} from "./memberMembership.js";

test("selects the same latest-ID regular membership used by the member list", () => {
  const memberships = [
    { id: 40, planName: "Historical", has_pt_plan: 0 },
    { id: 42, planName: "Current", has_pt_plan: 0 },
    { id: 43, planName: "Personal Training", has_pt_plan: 1 },
  ];

  assert.equal(selectMemberListMembership(memberships).planName, "Current");
});

test("keeps an explicitly inactive member inactive despite an active membership", () => {
  assert.equal(
    getMemberDisplayStatus({
      status: "inactive",
      plan: "Monthly",
      expiry_date: "2099-12-31",
    }),
    "inactive",
  );
});

test("reports active only when a regular or PT plan is not expired", () => {
  assert.equal(
    getMemberDisplayStatus({
      status: "active",
      plan: "Monthly",
      expiry_date: "2000-01-01",
      pt_plan: "PT",
      pt_expiry_date: "2099-12-31",
    }),
    "active",
  );
  assert.equal(
    getMemberDisplayStatus({
      status: "active",
      plan: "Monthly",
      expiry_date: "2000-01-01",
    }),
    "inactive",
  );
});

test("excludes PT rows when the plan flag is encoded as a string", () => {
  const memberships = [
    { id: 20, planName: "Current", has_pt_plan: 0 },
    { id: 21, planName: "PT", has_pt_plan: "1" },
  ];

  assert.equal(selectMemberListMembership(memberships).planName, "Current");
});

test("falls back to the normal plan catalog when membership prices are zero", () => {
  const pricing = resolveMembershipPricing({
    price: 0,
    amount: 0,
    discount: 0,
    catalog_plan_price: 12000,
    catalog_plan_discount: 10,
    catalog_plan_final_price: 10800,
  });

  assert.deepEqual(pricing, { price: 10800, amount: 12000, discount: 1200 });
});

test("preserves positive membership pricing over catalog prices", () => {
  const pricing = resolveMembershipPricing({
    price: 9000,
    amount: 10000,
    discount: 1000,
    catalog_plan_price: 12000,
    catalog_plan_final_price: 10800,
  });

  assert.deepEqual(pricing, { price: 9000, amount: 10000, discount: 1000 });
});

test("resolves zero pricing when no normal membership exists", () => {
  assert.deepEqual(resolveMembershipPricing(null), {
    price: 0,
    amount: 0,
    discount: 0,
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { selectMemberListMembership } from "./memberMembership.js";

test("selects the same latest-ID regular membership used by the member list", () => {
  const memberships = [
    { id: 40, planName: "Historical", has_pt_plan: 0 },
    { id: 42, planName: "Current", has_pt_plan: 0 },
    { id: 43, planName: "Personal Training", has_pt_plan: 1 },
  ];

  assert.equal(selectMemberListMembership(memberships).planName, "Current");
});

test("excludes PT rows when the plan flag is encoded as a string", () => {
  const memberships = [
    { id: 20, planName: "Current", has_pt_plan: 0 },
    { id: 21, planName: "PT", has_pt_plan: "1" },
  ];

  assert.equal(selectMemberListMembership(memberships).planName, "Current");
});

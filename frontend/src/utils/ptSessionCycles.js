export const findCurrentPTMembership = (memberships = []) =>
  memberships.find((membership) =>
    (membership.has_pt_plan === 1 ||
      membership.has_pt_plan === true ||
      membership.has_pt_plan === "1") &&
    (membership.pt_planName ||
      membership.pt_plan_name ||
      membership.pt_planId ||
      membership.pt_endDate ||
      membership.pt_end_date)
  ) || null;

export const buildPTSessionCycle = (savedData = {}, membership = null, member = {}) => {
  const cycles = savedData.session_cycles &&
    typeof savedData.session_cycles === "object" &&
    !Array.isArray(savedData.session_cycles)
    ? { ...savedData.session_cycles }
    : {};
  const savedPlanId = savedData.pt_plan_id || savedData.active_pt_plan_id;
  const membershipStart = membership?.pt_startDate || membership?.pt_start_date;
  const savedStart = savedData.pt_join_date;
  const legacySessionsMatchCurrentPlan = !savedPlanId &&
    membership?.id != null &&
    membershipStart &&
    savedStart &&
    String(membershipStart).slice(0, 10) === String(savedStart).slice(0, 10);
  const legacyPlanId = savedPlanId ||
    (legacySessionsMatchCurrentPlan
      ? String(membership.id)
      : `legacy:${savedData.pt_join_date || "unassigned"}`);

  if (Array.isArray(savedData.sessions) && savedData.sessions.length > 0 && !cycles[String(legacyPlanId)]) {
    cycles[String(legacyPlanId)] = {
      pt_plan_id: String(legacyPlanId),
      plan_name: savedData.pt_plan || savedData.plan_name || "Previous PT Plan",
      pt_join_date: savedData.pt_join_date || null,
      pt_expiry_date: savedData.pt_expiry_date || null,
      sessions: savedData.sessions,
    };
  }

  const planId = String(membership?.id ?? savedPlanId ?? legacyPlanId);
  const membershipEnd = membership?.pt_endDate || membership?.pt_end_date || membership?.pt_expiry_date;
  const currentCycle = cycles[planId] || {};
  const planName = membership?.pt_planName || membership?.pt_plan_name;
  const planStart = membershipStart || member.pt_join_date || savedData.pt_join_date || null;
  const planEnd = membershipEnd || member.pt_expiry_date || savedData.pt_expiry_date || null;
  const activeCycle = {
    ...currentCycle,
    pt_plan_id: planId,
    plan_name: planName || currentCycle.plan_name || savedData.pt_plan || null,
    pt_join_date: planStart,
    pt_expiry_date: planEnd,
    sessions: Array.isArray(currentCycle.sessions)
      ? currentCycle.sessions
      : planId === String(legacyPlanId) && Array.isArray(savedData.sessions)
        ? savedData.sessions
        : [],
  };
  cycles[planId] = activeCycle;

  return {
    ...savedData,
    pt_plan_id: planId,
    active_pt_plan_id: planId,
    pt_plan: planName || member.pt_plan || savedData.pt_plan || "",
    pt_join_date: planStart || "",
    pt_expiry_date: planEnd || "",
    session_cycles: cycles,
    sessions: activeCycle.sessions,
  };
};

import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const SessionTracker = ({
  onNext,
  onPrevious,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  readOnly = false,
  userMode = false,
  allowStatusEdit = false,
  onSaved = () => { },
  standalone = false,
  disabled = false,
  buttonLabel = null,
  hideFooter = false,
  trainerSignReadOnly = false,
}) => {
  const { user, profileName } = useAuth();
  const currentLoginName = profileName || "";

  const parseDate = (d) => {
    if (!d) return null;
    const str = String(d);
    
    // Handle DD-MM-YYYY
    if (str.includes("-") && str.split("-")[0].length === 2) {
      const parts = str.split("-");
      if (parts.length === 3) {
        return dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    
    // Handle DD/MM/YYYY
    if (str.includes("/") && str.split("/")[0].length === 2) {
      const parts = str.split("/");
      if (parts.length === 3) {
        return dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    
    return dayjs(d);
  };

  const sessionCycles = initialFormData?.session_cycles &&
    typeof initialFormData.session_cycles === "object" &&
    !Array.isArray(initialFormData.session_cycles)
    ? initialFormData.session_cycles
    : {};
  const activePtPlanId = String(initialFormData?.active_pt_plan_id || initialFormData?.pt_plan_id || "legacy");
  const [selectedCycleId, setSelectedCycleId] = useState(activePtPlanId);
  const selectedCycle = sessionCycles[selectedCycleId];
  const cycleFormData = selectedCycle
    ? { ...initialFormData, ...selectedCycle, sessions: selectedCycle.sessions || [] }
    : initialFormData;
  const viewingHistoricalCycle = selectedCycleId !== activePtPlanId;
  const currentPlanExpired = !viewingHistoricalCycle &&
    cycleFormData?.pt_expiry_date &&
    parseDate(cycleFormData.pt_expiry_date).isValid() &&
    parseDate(cycleFormData.pt_expiry_date).startOf("day").diff(dayjs().startOf("day"), "day") < 0;
  const cycleReadOnly = readOnly || disabled || viewingHistoricalCycle || currentPlanExpired;

  let numRows = 25;
  if (cycleFormData?.pt_join_date && cycleFormData?.pt_expiry_date) {
    const diff = parseDate(cycleFormData.pt_expiry_date).startOf('day').diff(parseDate(cycleFormData.pt_join_date).startOf('day'), 'day');
    if (diff > 0) numRows = diff;
  } else if (cycleFormData?.join_date && cycleFormData?.expiry_date) {
    const diff = parseDate(cycleFormData.expiry_date).startOf('day').diff(parseDate(cycleFormData.join_date).startOf('day'), 'day');
    if (diff > 0) numRows = diff;
  }

  const [localFormData, setLocalFormData] = useState(() => {
    const existingSessions = Array.isArray(cycleFormData?.sessions)
      ? cycleFormData.sessions
      : [];
    const updatedSessions = Array(Math.max(numRows, existingSessions.length)).fill(null).map((_, i) => {
      if (i < existingSessions.length) {
        return existingSessions[i];
      }
      return {
        session_no: i + 1,
        date: "",
        workout: "",
        status: "Pending",
        client_sign: "",
        trainer_sign: cycleFormData?.trainer_name_assigned || (userMode ? "" : currentLoginName),
      };
    });

    return {
      sessions: updatedSessions
    };
  });

  useEffect(() => {
    if (!initialFormData) return;

    const existingSessions = Array.isArray(cycleFormData?.sessions)
      ? cycleFormData.sessions
      : [];
    setLocalFormData((prev) => {
      const resizedSessions = Array(Math.max(numRows, existingSessions.length)).fill(null).map((_, i) => {
        if (i < existingSessions.length) {
          return {
            ...existingSessions[i],
            trainer_sign: existingSessions[i].trainer_sign || cycleFormData.trainer_name_assigned || (userMode ? "" : currentLoginName)
          };
        }
        return {
          session_no: i + 1,
          date: "",
          workout: "",
          status: "Pending",
          client_sign: "",
          trainer_sign: cycleFormData?.trainer_name_assigned || (userMode ? "" : currentLoginName),
        };
      });

      return {
        ...prev,
        sessions: resizedSessions
      };
    });
  }, [initialFormData, currentLoginName, userMode, numRows, selectedCycleId]);

  const handleSessionChange = (index, field, value) => {
    if (cycleReadOnly ||
      (userMode && ['date', 'workout', 'trainer_sign', 'client_sign'].includes(field))) {
      return;
    }

    const newSessions = [...localFormData.sessions];
    const updatedSession = { ...newSessions[index], [field]: value };

    // Auto-fill Client Sign if status becomes Completed
    if (field === "status") {
      if (value === "Completed") {
        updatedSession.client_sign = userMode ? (user?.username || user?.name || "") : (initialFormData?.name || "");
      } else {
        updatedSession.client_sign = "";
      }
    }

    newSessions[index] = updatedSession;
    setLocalFormData((prev) => ({ ...prev, sessions: newSessions }));
  };

  const hasRequiredSessionFields = (session) => {
    return String(session.date || "").trim() !== "" && String(session.workout || "").trim() !== "";
  };

  const canApproveSession = (session) => {
    return userMode && session.status === "Pending" && hasRequiredSessionFields(session);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cycleReadOnly) return;
    const updatedFormData = {
      ...initialFormData,
      pt_plan_id: activePtPlanId,
      active_pt_plan_id: activePtPlanId,
      session_cycles: {
        ...sessionCycles,
        [activePtPlanId]: {
          ...(sessionCycles[activePtPlanId] || {}),
          pt_plan_id: activePtPlanId,
          plan_name: initialFormData.pt_plan || sessionCycles[activePtPlanId]?.plan_name || null,
          pt_join_date: initialFormData.pt_join_date || sessionCycles[activePtPlanId]?.pt_join_date || null,
          pt_expiry_date: initialFormData.pt_expiry_date || sessionCycles[activePtPlanId]?.pt_expiry_date || null,
          sessions: localFormData.sessions,
        },
      },
      sessions: localFormData.sessions,
    };

    if (standalone) {
      try {
        await onSaved(updatedFormData);
      } catch (error) {
        console.error("Error saving session tracker:", error);
        toast.error("Failed to save session tracker.");
      }
      return;
    }

    if (!userMode) {
      onNext(localFormData);
      return;
    }

    try {
      const payload = {
        member_id: initialFormData.member_id,
        user_id: initialFormData.u_id,
        formData: updatedFormData,
        completed: true,
      };
      await api.post(`/pt-forms`, payload);
      toast.success("Sessions approved successfully!");
      onSaved(updatedFormData);
    } catch (error) {
      console.error("Error updating sessions:", error);
      toast.error("Failed to approve sessions.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Session Tracker</h2>
          {userMode && <p className="text-white/60 text-sm mt-2">Approve your workout sessions</p>}
          {Object.keys(sessionCycles).length > 1 && (
            <div className="mt-4">
              <label htmlFor="pt-session-cycle" className="sr-only">PT plan session history</label>
              <select
                id="pt-session-cycle"
                value={selectedCycleId}
                onChange={(event) => setSelectedCycleId(event.target.value)}
                className="max-w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm"
              >
                {Object.entries(sessionCycles).map(([cycleId, cycle]) => (
                  <option key={cycleId} value={cycleId}>
                    {cycle.plan_name || "PT Plan"}
                    {cycle.pt_join_date ? ` - ${parseDate(cycle.pt_join_date).format("MMM DD, YYYY")}` : ""}
                    {cycleId === activePtPlanId ? " (Current)" : " (History)"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {viewingHistoricalCycle && (
            <p className="text-amber-300 text-xs mt-2">Viewing a previous plan. Its session history is read-only.</p>
          )}
          {currentPlanExpired && (
            <p className="text-amber-300 text-xs mt-2">This PT plan has expired. Its session history is read-only.</p>
          )}
          <div className="w-24 h-1 bg-orange-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-x-auto border border-white/10 rounded-xl shadow-2xl">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/5 backdrop-blur-xl border-b border-white/10 text-white/60 uppercase text-[10px] tracking-[0.2em] font-black sticky top-0">
                <tr>
                  <th className="p-4 border-r border-white/5 w-20 text-center">Session. No</th>
                  <th className="p-4 border-r border-white/5 w-40 text-center">Date</th>
                  <th className="p-4 border-r border-white/5 text-left">Workout</th>
                  <th className="p-4 border-r border-white/5 w-32 text-center">Status</th>
                  <th className="p-4 border-r border-white/5 w-32 text-center">Client Sign</th>
                  <th className="p-4 w-32 text-center">Trainer Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {localFormData.sessions.map((session, index) => (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-0 border-r border-white/5 text-center bg-white/[0.01] font-bold text-white/40">
                      {session.session_no}
                    </td>
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="date"
                        value={session.date || ""}
                        onChange={(e) => handleSessionChange(index, "date", e.target.value)}
                        className="w-full p-4 bg-transparent text-white focus:outline-none focus:bg-white/5 transition-colors text-center"
                        readOnly={cycleReadOnly || userMode}
                      />
                    </td>
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="text"
                        value={session.workout || ""}
                        onChange={(e) => handleSessionChange(index, "workout", e.target.value)}
                        placeholder="Describe the workout sessions..."
                        className="w-full p-4 bg-transparent text-white focus:outline-none focus:bg-white/5 transition-colors placeholder-white/10"
                        readOnly={cycleReadOnly || userMode}
                      />
                    </td>
                    <td className="p-4 border-r border-white/5 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          if (canApproveSession(session)) {

                            const updatedSessions = [...localFormData.sessions];
                            updatedSessions[index] = {
                              ...updatedSessions[index],
                              status: "Completed",
                              client_sign:
                                user?.username || user?.name || "",
                            };

                            setLocalFormData((prev) => ({
                              ...prev,
                              sessions: updatedSessions,
                            }));

                            try {
                              const updatedFormData = {
                                ...initialFormData,
                                pt_plan_id: activePtPlanId,
                                active_pt_plan_id: activePtPlanId,
                                sessions: updatedSessions,
                                session_cycles: {
                                  ...sessionCycles,
                                  [activePtPlanId]: {
                                    ...(sessionCycles[activePtPlanId] || {}),
                                    pt_plan_id: activePtPlanId,
                                    sessions: updatedSessions,
                                  },
                                },
                              };
                              await api.post(`/pt-forms`, {
                                member_id: initialFormData.member_id,
                                user_id: initialFormData.u_id,
                                formData: updatedFormData,
                                completed: true,
                              });

                              toast.success("Session completed");
                              if (typeof onSaved === 'function') {
                                try {
                                  onSaved(updatedFormData);
                                } catch (err) {
                                  console.warn('onSaved callback failed', err);
                                }
                              }
                            } catch (error) {
                              console.error(error);
                              toast.error("Failed to save session");
                            }
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${session.status === "Completed"
                            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500 hover:text-white"
                          }`}
                        disabled={cycleReadOnly || !canApproveSession(session)}
                      >
                        {session.status || "Pending"}
                      </button>
                    </td>
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="text"
                        value={session.client_sign || ""}
                        placeholder="Sign/Initial"
                        className="w-full p-4 bg-transparent text-white focus:outline-none focus:bg-white/5 transition-colors text-center placeholder-white/10"
                        readOnly
                      />
                    </td>
                    <td className="p-0">
                      <input
                        type="text"
                        value={session.trainer_sign || ""}
                        onChange={(e) => handleSessionChange(index, "trainer_sign", e.target.value)}
                        placeholder="Sign/Initial"
                        className="w-full p-4 bg-transparent text-white focus:outline-none focus:bg-white/5 transition-colors text-center placeholder-white/10 font-bold"
                        readOnly={cycleReadOnly || userMode || trainerSignReadOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-6 border-t border-white/10 mt-8">
            <p className="text-center text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-6">
              DAP Fitness Studio - Official Session Records
            </p>
            {!hideFooter && (
              <div className="flex gap-4">
                {!userMode && (
                  <button
                    type="button"
                    onClick={onPrevious}
                    className="flex-1 px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  disabled={cycleReadOnly}
                  className="flex-1 px-6 py-4 rounded-xl font-bold shadow-2xl shadow-orange-600/20 transition-all uppercase tracking-widest text-xs bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isLastStep ? "Complete Registration" : "Next Step"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div >
    </div >
  );
};

export default SessionTracker;

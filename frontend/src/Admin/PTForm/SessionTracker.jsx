import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";

const SessionTracker = ({
  onNext,
  onPrevious,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  readOnly = false,
  userMode = false,
  allowStatusEdit = false,
  onSaved = () => {},
  standalone = false,
  disabled = false,
  buttonLabel = null,
}) => {
  const { user, profileName } = useAuth();
  const currentLoginName = profileName || "";

  const [localFormData, setLocalFormData] = useState({
    sessions: (initialFormData?.sessions && initialFormData.sessions.length > 0) 
      ? initialFormData.sessions 
      : Array(25).fill(null).map((_, i) => ({
      session_no: i + 1,
      date: "",
      workout: "",
      status: "Pending",
      client_sign: "",
      trainer_sign: initialFormData?.trainer_name_assigned || currentLoginName,
    }))
  });

  useEffect(() => {
    if (!initialFormData) return;

    setLocalFormData(prev => {
      const currentSessions = (initialFormData.sessions && initialFormData.sessions.length > 0) 
        ? initialFormData.sessions 
        : prev.sessions;

      // If we are using sessions (either new ones or existing ones), 
      // ensure the trainer_sign is filled if it's currently empty/default
      const updatedSessions = currentSessions.map(s => ({
        ...s,
        trainer_sign: s.trainer_sign || initialFormData.trainer_name_assigned || currentLoginName
      }));

      return {
        ...prev,
        sessions: updatedSessions
      };
    });
  }, [initialFormData?.sessions, initialFormData?.trainer_name_assigned, currentLoginName]);

  const handleSessionChange = (index, field, value) => {
    if (userMode && ['date', 'workout', 'trainer_sign', 'client_sign'].includes(field)) {
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

    if (standalone) {
      try {
        await onSaved({ ...initialFormData, sessions: localFormData.sessions });
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
        formData: { ...initialFormData, sessions: localFormData.sessions },
        completed: true,
      };
      await api.post(`/pt-forms`, payload);
      toast.success("Sessions approved successfully!");
      onSaved({ ...initialFormData, sessions: localFormData.sessions });
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
                        readOnly={userMode}
                      />
                    </td>
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="text"
                        value={session.workout || ""}
                        onChange={(e) => handleSessionChange(index, "workout", e.target.value)}
                        placeholder="Describe the workout sessions..."
                        className="w-full p-4 bg-transparent text-white focus:outline-none focus:bg-white/5 transition-colors placeholder-white/10"
                        readOnly={userMode}
                      />
                    </td>
                    <td className="p-4 border-r border-white/5 text-center">
                       <button
                         type="button"
                         onClick={() => {
                           if (canApproveSession(session)) {
                             handleSessionChange(index, "status", "Completed");
                           }
                         }}
                         className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${
                           session.status === "Completed" 
                           ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white" 
                           : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500 hover:text-white"
                         }`}
                         disabled={!canApproveSession(session)}
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
                        readOnly={userMode}
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
                disabled={disabled}
                className={`flex-[2] px-6 py-4 rounded-xl font-bold shadow-2xl shadow-orange-600/20 transition-all uppercase tracking-widest text-xs ${disabled ? 'bg-orange-500/50 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {userMode
                  ? "Approve Sessions"
                  : standalone
                  ? buttonLabel || "Save Session Tracker"
                  : isLastStep
                  ? "Complete Registration"
                  : "Next Step"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionTracker;

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import SessionTracker from "../../Admin/PTForm/SessionTracker";
import dayjs from "dayjs";

const SessionTracking = () => {
  const { user } = useAuth();
  const trainerId = user?.id;
  const trainerName = user?.username || user?.name || "";

  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!trainerId) return;
    fetchAssignedMembers();
  }, [trainerId]);

  useEffect(() => {
    if (!selectedMemberId) {
      setSelectedMember(null);
      setFormData(null);
      return;
    }

    const member = assignedMembers.find((m) => String(m.id) === String(selectedMemberId));
    setSelectedMember(member || null);
    fetchPtForm(selectedMemberId, member);
  }, [selectedMemberId, assignedMembers]);

  const normalizeMember = (item) => {
    const endDate = item.planEndDate || item.pt_endDate || item.ptExpiryDate || item.pt_expiry_date || item.endDate || "";
    let isExpired = false;
    if (endDate) {
      const end = new Date(endDate);
      if (end instanceof Date && !Number.isNaN(end.getTime()) && end < new Date()) {
        isExpired = true;
      }
    }

    const planName = item.planName || item.plan_name || "";
    const hasPtPlan = Boolean(
      item.hasPtPlan ||
      item.has_pt_plan ||
      item.pt_plan ||
      item.ptPlan ||
      planName.toLowerCase().includes("pt")
    );

    const planPrice = item.planPrice || item.plan_price || item.price || item.pt_price || item.ptPrice || item.pt_amount || item.amount || 0;
    const planDuration = item.duration || item.plan_duration || item.pt_duration || item.duration_months || item.pt_duration_months || "";

    return {
      id: item.gymMemberId || item.id || item.gm_id || item.member_id || "",
      userId: item.userId || item.user_id || "",
      name: item.username || item.name || item.user_name || item.full_name || "Member",
      email: item.userEmail || item.user_email || item.email || "",
      phone: item.userMobile || item.user_mobile || item.phone || "",
      planName,
      planPrice,
      planDuration,
      planStartDate: item.planStartDate || item.pt_startDate || item.ptJoinDate || item.pt_join_date || "",
      planEndDate: endDate,
      isExpired,
      hasPtPlan,
      ptFormCompleted: item.ptFormCompleted || item.pt_form_completed || 0,
    };
  };

  const fetchAssignedMembers = async () => {
    setLoading(true);
    try {
      const trainerEmail = user?.email || "";
      const res = await api.get(`/assignments?trainerUserId=${trainerId}&trainerEmail=${encodeURIComponent(trainerEmail)}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.assignments || [];
      const members = data
        .map(normalizeMember)
        .filter((m) => m.id && !m.isExpired && m.hasPtPlan)
        .filter((m, index, arr) => arr.findIndex((u) => String(u.id) === String(m.id)) === index);
      setAssignedMembers(members);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assigned members");
    } finally {
      setLoading(false);
    }
  };

  const makeEmptySessions = () =>
    Array.from({ length: 25 }, (_, index) => ({
      session_no: index + 1,
      date: "",
      workout: "",
      status: "Pending",
      client_sign: "",
      trainer_sign: trainerName,
    }));

  const buildFormData = (savedData = {}, member) => {
    const baseData = {
      ...savedData,
      member_id: member?.id || savedData.member_id,
      u_id: member?.userId || savedData.u_id || savedData.user_id || "",
      name: member?.name || savedData.name || "",
      trainer_name_assigned: trainerName || savedData.trainer_name_assigned || "",
    };

    const isExpired = member?.planEndDate && dayjs(member.planEndDate).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;
    const isRenewed = savedData.pt_join_date && member?.planStartDate && !dayjs(savedData.pt_join_date).isSame(dayjs(member.planStartDate), 'day');

    const sessions = (!isExpired && !isRenewed) && Array.isArray(savedData.sessions) && savedData.sessions.length > 0
      ? savedData.sessions.map((session, index) => ({
          session_no: index + 1,
          date: session.date || "",
          workout: session.workout || "",
          status: session.status || "Pending",
          client_sign: session.client_sign || "",
          trainer_sign: session.trainer_sign || trainerName,
        }))
      : undefined;

    return { 
      ...baseData, 
      sessions,
      pt_join_date: member?.planStartDate,
      pt_expiry_date: member?.planEndDate,
    };
  };

  const fetchPtForm = async (memberId, member) => {
    setLoading(true);
    try {
      const res = await api.get(`/pt-forms/${memberId}`);
      let rawFormData = null;
      if (member?.ptFormCompleted) {
         rawFormData = res.data?.form_data;
      }
      const savedData = rawFormData && typeof rawFormData === "string"
        ? JSON.parse(rawFormData)
        : rawFormData || {};
      setFormData(buildFormData(savedData, member));
    } catch (err) {
      if (err.response?.status === 404) {
        setFormData(buildFormData({}, member));
      } else {
        console.error(err);
        toast.error("Failed to load PT form data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sessionData) => {
    if (!selectedMemberId) {
      toast.error("Select a member first");
      return;
    }

    setSaving(true);
    try {
      await api.post("/pt-forms", {
        member_id: selectedMemberId,
        user_id: formData?.u_id || "",
        formData: {
          ...formData,
          sessions: sessionData.sessions,
          trainer_name_assigned: trainerName,
        },
        completed: true,
      });
      toast.success("Session tracker saved inside PT form");
      setFormData((prev) => ({ ...prev, sessions: sessionData.sessions }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to save session tracker");
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = assignedMembers.filter((member) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      member.phone.toLowerCase().includes(search) ||
      member.planName.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-orange-500">PT Registration Form</h1>
            <p className="text-sm text-white/60 max-w-2xl">
              Session tracker is now available inside the assigned member PT form view. Select a member to edit session records with the same trainer form UI.
            </p>
          </div>
          {selectedMember && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p className="text-white font-semibold">Selected Member</p>
              <p>{selectedMember.name}</p>
              <p className="text-xs text-white/40">ID: {selectedMember.id}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-semibold text-white">Plan:</span>
                  <span className="text-orange-300">{selectedMember.planName || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-semibold text-white">Price:</span>
                  <span className="text-white/80">{selectedMember.planPrice ? `₹ ${Number(selectedMember.planPrice).toLocaleString('en-IN')}` : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-semibold text-white">Duration:</span>
                  <span className="text-white/80">{selectedMember.planDuration ? selectedMember.planDuration : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-semibold text-white">Start:</span>
                  <span className="text-white/80">{selectedMember.planStartDate ? dayjs(selectedMember.planStartDate).format('DD/MM/YYYY') : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-semibold text-white">End:</span>
                  <span className="text-white/80">{selectedMember.planEndDate ? dayjs(selectedMember.planEndDate).format('DD/MM/YYYY') : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Assigned Members</h2>
                <p className="text-xs text-white/40">Only assigned members with an active PT plan appear here.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId("");
                  setSearchTerm("");
                }}
                className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search member"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="rounded-2xl bg-black/20 p-4 text-sm text-white/40">Loading assigned members…</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="rounded-2xl bg-black/20 p-4 text-sm text-white/40">No assigned members found.</div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        String(member.id) === String(selectedMemberId)
                          ? 'border-orange-500 bg-orange-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-orange-500/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-sm">{member.name}</span>
                        {String(member.id) === String(selectedMemberId) && (
                          <span className="rounded-full bg-orange-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-orange-300">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-white/40">{member.email || member.phone || 'No contact details'}</p>
                      {member.planName && <p className="mt-2 text-[11px] text-orange-300">{member.planName}</p>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-orange-500">Session Tracker</h2>
                <p className="text-sm text-white/60">This is the same PT form session tracker interface used inside trainer PT registration.</p>
              </div>
              {saving && <span className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/50">Saving...</span>}
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-3xl bg-black/20 p-10 text-center text-white/40">Loading form data…</div>
              ) : selectedMember ? (
                <SessionTracker
                  standalone
                  onSaved={handleSave}
                  formData={formData}
                  buttonLabel={saving ? "Saving..." : "Save Session Tracker"}
                  disabled={saving}
                />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center text-white/50">
                  Select an assigned member from the left to load the session tracker inside their PT form.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SessionTracking;

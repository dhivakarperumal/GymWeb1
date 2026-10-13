import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useAuth } from '../../PrivateRouter/AuthContext';
import { normalizeDateForDateInput } from '../../utils/dateUtils';
import { buildPTSessionCycle, findCurrentPTMembership } from '../../utils/ptSessionCycles';
import dayjs from 'dayjs';
import Enquiry from './PTFormEnquiry';
import HealthHistoy from './HealthHistoy';
import HealthHistory2 from './HealthHistory2';
import FitnessScreening from './FitnessScreening';
import FlexibilityAndMeasurements from './FlexibilityAndMeasurements';
import SessionTracker from './SessionTracker';

const normalizeTimeForInput = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60
    ? `${String(hours).padStart(2, "0")}:${match[2]}`
    : "";
};

const normalizePTFormDates = (data) => ({
  ...data,
  ...(data.dob != null && { dob: normalizeDateForDateInput(data.dob) }),
  ...(data.consent_date != null && {
    consent_date: normalizeDateForDateInput(data.consent_date),
  }),
  ...(data.date != null && { date: normalizeDateForDateInput(data.date) }),
  ...(Array.isArray(data.measurements) && {
    measurements: data.measurements.map((measurement) => (
      measurement && typeof measurement === "object"
        ? { ...measurement, date: normalizeDateForDateInput(measurement.date) }
        : measurement
    )),
  }),
  ...(Array.isArray(data.sessions) && {
    sessions: data.sessions.map((session) => (
      session && typeof session === "object"
        ? { ...session, date: normalizeDateForDateInput(session.date) }
        : session
    )),
  }),
});

const parseConsentValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on", "accepted"].includes(value.trim().toLowerCase());
  }
  return false;
};

const parseSavedObject = (value) => {
  if (!value) return {};
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const PTForm = () => {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get("member_id");
  const isEditMode = searchParams.get("edit") === "true";
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(Boolean(memberId));
  const [loadError, setLoadError] = useState("");
  const [activeMemberId, setActiveMemberId] = useState(memberId || "");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [ptExpiredAlert, setPtExpiredAlert] = useState(false);
  const savingRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profileName } = useAuth();
  const returnUrl = location.state?.returnUrl;

  const fetchMemberForm = useCallback(async (selectedMemberId) => {
    if (!selectedMemberId) return;

    const memberRes = await api.get(`/members/${selectedMemberId}`);
    const member = memberRes.data;
    if (!member) throw new Error("Member record was not returned by the server.");

    const savedMemberId = member.id || selectedMemberId;
    const userId = member.u_id || member.user_id;
    const [ptFormResult, assignmentsResult, membershipsResult] = await Promise.allSettled([
      api.get(`/pt-forms/${savedMemberId}`),
      api.get("/assignments"),
      userId ? api.get(`/memberships/user/${userId}`) : Promise.resolve({ data: [] }),
    ]);
    if (membershipsResult.status === "rejected") throw membershipsResult.reason;
    const currentPtMembership = findCurrentPTMembership(
      Array.isArray(membershipsResult.value.data) ? membershipsResult.value.data : [],
    );
    const ptExpiryDate = currentPtMembership?.pt_endDate || currentPtMembership?.pt_end_date || member.pt_expiry_date;
    const ptJoinDate = currentPtMembership?.pt_startDate || currentPtMembership?.pt_start_date || member.pt_join_date;

      const memberPrefill = {
        member_id: savedMemberId,
        u_id: member.u_id,
        name: member.name || "",
        email: member.email || member.user_email || "",
        phone: member.phone || "",
        location: member.location || "",
        height: member.height || "",
        weight: member.weight || "",
        bmi: member.bmi || "",
        dob: normalizeDateForDateInput(member.dob),
        age: member.age || "",
        address: member.address || "",
        employer: member.employer || "",
        occupation: member.occupation || "",
        emergency_contact_name: member.emergency_contact_name || "",
        emergency_contact_relationship: member.emergency_contact_relationship || "",
        emergency_contact_address: member.emergency_contact_address || "",
        emergency_contact_phone_home: member.emergency_contact_phone_home || "",
        emergency_contact_phone_work: member.emergency_contact_phone_work || "",
        fitness_goal: member.fitness_goal || "",
        blood_group: member.blood_group || "",
        gender: member.gender || "",
        pt_plan: currentPtMembership?.pt_planName || currentPtMembership?.pt_plan_name || member.pt_plan || "",
        pt_join_date: ptJoinDate || "",
        pt_expiry_date: ptExpiryDate || "",
        join_date: member.join_date || "",
        expiry_date: member.expiry_date || "",
      };

      const isPtExpired =
        ptExpiryDate &&
        dayjs(ptExpiryDate).startOf("day").diff(dayjs().startOf("day"), "day") < 0;

      let savedData = {};
      if (ptFormResult.status === "fulfilled") {
        const formRecord = ptFormResult.value.data;
        const rawFormData = formRecord?.form_data;
        if (rawFormData) {
          savedData = typeof rawFormData === "string"
            ? JSON.parse(rawFormData)
            : rawFormData;
          if (!savedData || typeof savedData !== "object" || Array.isArray(savedData)) {
            throw new Error("Saved PT form data has an invalid format.");
          }
        }
      } else if (ptFormResult.reason?.response?.status !== 404) {
        throw ptFormResult.reason;
      }

      const assignmentRows = assignmentsResult.status === "fulfilled"
        ? (Array.isArray(assignmentsResult.value.data) ? assignmentsResult.value.data : [])
        : [];
      const assignmentLoadFailed = assignmentsResult.status === "rejected";
      if (assignmentLoadFailed) {
        console.error("Failed to load PT trainer assignment", assignmentsResult.reason);
      }
      const assignment =
        assignmentRows.find((item) => String(item.gymMemberId) === String(memberPrefill.member_id)) ||
        (member.u_id != null
          ? assignmentRows.find((item) => String(item.userId) === String(member.u_id))
          : null) ||
        null;
      const savedOrMemberData = { ...savedData };
      [
        "name", "email", "phone", "location", "height", "weight", "bmi", "dob",
        "age", "address", "employer", "occupation", "emergency_contact_name",
        "emergency_contact_relationship", "emergency_contact_address",
        "emergency_contact_phone_home", "emergency_contact_phone_work",
        "fitness_goal", "blood_group", "gender", "pt_join_date", "pt_expiry_date",
        "join_date", "expiry_date",
      ].forEach((field) => {
        if (savedOrMemberData[field] == null || savedOrMemberData[field] === "") {
          savedOrMemberData[field] = memberPrefill[field];
        }
      });
      const mergedData = normalizePTFormDates({
        ...buildPTSessionCycle(
          { ...memberPrefill, ...savedOrMemberData },
          currentPtMembership,
          memberPrefill,
        ),
        member_id: memberPrefill.member_id,
        u_id: member.u_id || savedData.u_id || savedData.user_id,
        trainer_name_assigned:
          assignment?.trainerName ||
          savedData.trainer_name_assigned ||
          (role === "trainer" ? profileName || "" : ""),
        session_time: assignment
          ? normalizeTimeForInput(assignment.sessionTime)
          : normalizeTimeForInput(savedData.session_time),
      });

      const savedConsentData = parseSavedObject(
        savedData.consent_data ??
        savedData.informed_consent ??
        savedData.informedConsent ??
        savedData.consent,
      );
      const memberConsentData = parseSavedObject(member.consent_data);
      const firstDefined = (...values) =>
        values.find((value) => value !== undefined && value !== null && value !== "");
      const firstNonEmpty = (...values) =>
        values.find((value) => value !== undefined && value !== null && value !== "");
      const consentFields = {
        participant_name: firstNonEmpty(
          savedData.participant_name,
          savedConsentData.participant_name,
          member.participant_name,
          memberConsentData.participant_name,
          savedData.name,
          member.name,
        ),
        consent_agree: firstDefined(
          savedData.consent_agree,
          savedData.agree,
          savedConsentData.consent_agree,
          savedConsentData.agree,
          member.consent_agree,
          member.agree,
          memberConsentData.consent_agree,
          memberConsentData.agree,
        ),
        consent_signature: firstNonEmpty(
          savedData.consent_signature,
          savedData.signature,
          savedConsentData.consent_signature,
          savedConsentData.signature,
          member.consent_signature,
          member.signature,
          memberConsentData.consent_signature,
          memberConsentData.signature,
        ),
        consent_date: firstNonEmpty(
          savedData.consent_date,
          savedData.date,
          savedConsentData.consent_date,
          savedConsentData.date,
          member.consent_date,
          member.date,
          memberConsentData.consent_date,
          memberConsentData.date,
        ),
        guardian_signature: firstNonEmpty(
          savedData.guardian_signature,
          savedConsentData.guardian_signature,
          member.guardian_signature,
          memberConsentData.guardian_signature,
        ),
        witness: firstNonEmpty(
          savedData.witness,
          savedConsentData.witness,
          member.witness,
          memberConsentData.witness,
        ),
      };
      Object.entries(consentFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          mergedData[key] = key === "consent_date"
            ? normalizeDateForDateInput(value)
            : key === "consent_agree"
              ? parseConsentValue(value)
              : value;
        }
      });
      const missingConsentFields = Object.entries(consentFields)
        .filter(([, value]) => value === undefined || value === null || value === "")
        .map(([key]) => key);

      let consentLoadFailed = false;
      if (missingConsentFields.length && (member.email || member.phone)) {
        try {
          const enquiryRes = await api.get("/followups");
          const enquiries = Array.isArray(enquiryRes.data) ? enquiryRes.data : [];
          const enquiry = enquiries.find((item) =>
            (member.email && item.email === member.email) ||
            (member.phone && item.phone === member.phone)
          );
          if (enquiry) {
            const linkedConsent = parseSavedObject(enquiry.consent_data);
            const fallbackConsent = {
              participant_name: linkedConsent.participant_name ?? enquiry.name,
              consent_agree: firstDefined(linkedConsent.consent_agree, linkedConsent.agree),
              consent_signature: firstDefined(linkedConsent.consent_signature, linkedConsent.signature),
              consent_date: firstDefined(linkedConsent.consent_date, linkedConsent.date),
              guardian_signature: linkedConsent.guardian_signature,
              witness: linkedConsent.witness,
            };
            missingConsentFields.forEach((key) => {
              if (fallbackConsent[key] !== undefined && fallbackConsent[key] !== null) {
                mergedData[key] = key === "consent_date"
                  ? normalizeDateForDateInput(fallbackConsent[key])
                  : key === "consent_agree"
                    ? parseConsentValue(fallbackConsent[key])
                    : fallbackConsent[key];
              }
            });
          }
        } catch (error) {
          console.error("Failed to load linked PT consent details", error);
          consentLoadFailed = true;
        }
      }

      return {
        formData: mergedData,
        assignment,
        isPtExpired: Boolean(isPtExpired),
        missingPTForm: ptFormResult.status === "rejected",
        assignmentLoadFailed,
        consentLoadFailed,
      };
  }, [profileName, role]);

  const applyLoadedMemberForm = useCallback((result) => {
    setFormData(result.formData);
    setSelectedAssignment(result.assignment);
    setPtExpiredAlert(result.isPtExpired);
    setLoadError("");
    if (result.missingPTForm && isEditMode) {
      toast("No saved PT form was found. Member details have been loaded.");
    }
    if (result.assignmentLoadFailed) {
      toast.error("Could not load the assigned PT session time.");
    }
    if (result.consentLoadFailed) {
      toast.error("Could not load linked consent details.");
    }
  }, [isEditMode]);

  const handleLoadFailure = useCallback((error) => {
    console.error("Failed to load member PT form", error);
    const message = error.response?.data?.error || error.message || "Unable to load the member's PT form.";
    setLoadError(message);
    toast.error(message);
  }, []);

  const loadMemberForm = useCallback(async (selectedMemberId) => {
    if (!selectedMemberId) return;
    setActiveMemberId(selectedMemberId);
    setLoading(true);
    setLoadError("");
    try {
      applyLoadedMemberForm(await fetchMemberForm(selectedMemberId));
    } catch (error) {
      handleLoadFailure(error);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedMemberForm, fetchMemberForm, handleLoadFailure]);

  useEffect(() => {
    if (!memberId) return undefined;
    let isActive = true;

    fetchMemberForm(memberId)
      .then((result) => {
        if (isActive) applyLoadedMemberForm(result);
      })
      .catch((error) => {
        if (isActive) handleLoadFailure(error);
      })
      .finally(() => {
        if (isActive) {
          setActiveMemberId(memberId);
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [memberId, fetchMemberForm, applyLoadedMemberForm, handleLoadFailure]);

  const steps = [
    { id: 1, name: 'Enquiry Form', component: Enquiry },
    { id: 2, name: 'Health History', component: HealthHistoy },
    { id: 3, name: 'Health History 2', component: HealthHistory2 },
    { id: 4, name: 'Fitness Screening', component: FitnessScreening },
    { id: 5, name: 'Flexibility & Measurements', component: FlexibilityAndMeasurements },
    { id: 6, name: 'Session Tracker', component: SessionTracker },
  ];

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      const targetMemberId = updatedData.member_id || memberId;
      if (!targetMemberId) {
        toast.error('Please select a member before completing the PT form.');
        return;
      }
      if (savingRef.current) return;

      savingRef.current = true;
      setLoading(true);
      try {
        const payload = {
          member_id: targetMemberId,
          user_id: updatedData.u_id || updatedData.user_id,
          formData: updatedData,
          completed: true
        };

        const saveResponse = await api.post("/pt-forms", payload);
        if (saveResponse.data?.success === false) {
          throw new Error(saveResponse.data.message || "The PT form was not saved.");
        }
        setFormData(updatedData);
        try {
          const refreshedResponse = await api.get(`/pt-forms/${targetMemberId}`);
          const refreshedFormData = parseSavedObject(refreshedResponse.data?.form_data);
          setFormData((previous) => ({ ...previous, ...refreshedFormData }));
        } catch (refreshError) {
          console.error("PT form saved but could not be reloaded", refreshError);
          toast.error(
            `PT form was saved, but reloading it failed: ${
              refreshError.response?.data?.error || refreshError.message
            }`,
          );
        }

        const updatedSessionTime = normalizeTimeForInput(updatedData.session_time);
        if (
          selectedAssignment &&
          updatedSessionTime !== normalizeTimeForInput(selectedAssignment.sessionTime)
        ) {
          try {
            await api.post("/assignments", {
              assignments: [{
                ...selectedAssignment,
                sessionTime: updatedSessionTime || null,
              }],
            });
            setSelectedAssignment((previous) => ({
              ...previous,
              sessionTime: updatedSessionTime || null,
            }));
          } catch (assignmentError) {
            console.error("PT form saved, but assigned session time update failed", assignmentError);
            toast.error(
              `PT form was saved, but session time was not updated: ${
                assignmentError.response?.data?.error || assignmentError.message
              }`,
            );
            return;
          }
        }

        toast.success(isEditMode ? "PT Form updated successfully!" : "PT Registration completed and stored successfully!");
        const basePath = role === 'trainer' ? '/trainer' : '/admin';
        if (isEditMode && targetMemberId) {
          navigate(`${basePath}/member_details/${targetMemberId}`);
        } else if (returnUrl) {
          navigate(returnUrl);
        } else if (role === 'trainer') {
          navigate('/trainer');
        } else {
          navigate('/admin/members');
        }
      } catch (err) {
        console.error("Save PT Form error:", err);
        toast.error(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to save registration",
        );
      } finally {
        savingRef.current = false;
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMemberSelected = async (memberId) => {
    setActiveMemberId(memberId);
    setLoadError("");
    setLoading(true);
    await loadMemberForm(memberId);
  };

  const CurrentComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto mb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-500">
              {isEditMode ? 'Edit' : 'PT Registration'} Form
            </h1>
            {isEditMode && (
              <p className="text-white/60 text-xs uppercase tracking-wider mt-1">
                Editing existing form
              </p>
            )}
          </div>
          <button
            onClick={() => {
              const basePath = role === 'trainer' ? '/trainer' : '/admin';
              if (isEditMode && memberId) {
                navigate(`${basePath}/member_details/${memberId}`);
              } else {
                navigate(`${basePath}/payments`);
              }
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition text-sm font-medium"
          >
            Back {isEditMode ? 'to Member' : 'to Payments'}
          </button>
        </div>

        {/* ── PT EXPIRED ALERT BANNER ── */}
        {ptExpiredAlert && (
          <div className="flex items-start gap-3 mb-6 px-5 py-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 backdrop-blur-sm">
            <AlertTriangle className="text-orange-400 mt-0.5 shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-orange-300 font-semibold text-sm">PT Plan Expired</p>
              <p className="text-orange-200/80 text-xs mt-0.5 leading-relaxed">
                This member's PT plan has expired. The Session Tracker has been reset for the new session,
                but previous health & fitness details have been retained.
              </p>
            </div>
            <button
              onClick={() => setPtExpiredAlert(false)}
              className="text-orange-400/60 hover:text-orange-300 transition shrink-0 mt-0.5"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loadError && (
          <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => {
                setLoadError("");
                setLoading(true);
                loadMemberForm(activeMemberId);
              }}
              className="shrink-0 rounded-lg bg-red-500/20 px-3 py-1.5 font-semibold hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── STEP PROGRESS BAR ── */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1 scrollbar-none">
          {steps.map((step, index) => {
            const isActive   = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className="flex flex-col items-center gap-1.5 group shrink-0 px-3 focus:outline-none"
                  title={step.name}
                >
                  {/* Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200
                      ${isActive
                        ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_16px_rgba(249,115,22,0.5)]'
                        : isComplete
                        ? 'bg-orange-500/30 border-orange-500/60 text-orange-300 group-hover:bg-orange-500/50'
                        : 'bg-gray-800 border-gray-600 text-gray-500 group-hover:border-gray-400 group-hover:text-gray-300'
                      }`}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.id}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-200
                      ${isActive   ? 'text-orange-400'
                      : isComplete ? 'text-orange-400/60 group-hover:text-orange-400'
                      :              'text-gray-500 group-hover:text-gray-300'}`}
                  >
                    {step.name}
                  </span>
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] min-w-[12px] rounded-full transition-all duration-300 shrink"
                    style={{ background: currentStep > step.id ? '#f97316' : '#374151' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-6xl mx-auto">
        {loading || (memberId && activeMemberId !== memberId) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">Loading member and saved PT form data...</p>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-500/20 bg-white/5 p-8 text-center text-white/70">
            The form is unavailable until the saved data can be loaded.
          </div>
        ) : (
          <CurrentComponent
            key={`${activeMemberId}:${formData?.pt_plan_id || ""}:${currentStep}`}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectMember={handleMemberSelected}
            formData={formData}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === steps.length}
            trainerSignReadOnly={true}
            canEditSessionTime={Boolean(selectedAssignment)}
          />
        )}
      </div>
    </div>
  );
};

export default PTForm;
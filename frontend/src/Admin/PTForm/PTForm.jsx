import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useAuth } from '../../PrivateRouter/AuthContext';
import { normalizeDateForDateInput } from '../../utils/dateUtils';
import dayjs from 'dayjs';
import Enquiry from './PTFormEnquiry';
import HealthHistoy from './HealthHistoy';
import HealthHistory2 from './HealthHistory2';
import FitnessScreening from './FitnessScreening';
import FlexibilityAndMeasurements from './FlexibilityAndMeasurements';
import SessionTracker from './SessionTracker';

const PTForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [ptExpiredAlert, setPtExpiredAlert] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profileName } = useAuth();
  const memberId = searchParams.get("member_id");
  const isEditMode = searchParams.get("edit") === "true";
  const returnUrl = location.state?.returnUrl;

  useEffect(() => {
    if (memberId) {
      const fetchMember = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/members/${memberId}`);
          const data = res.data;
          setFormData({
            member_id: data.id,
            u_id: data.u_id,
            name: data.name || "",
            email: data.email || data.user_email || "",
            phone: data.phone || "",
            location: data.location || "",
            height: data.height || "",
            weight: data.weight || "",
            bmi: data.bmi || "",
            dob: normalizeDateForDateInput(data.dob),
            age: data.age || "",
            address: data.address || "",
            employer: data.employer || "",
            occupation: data.occupation || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_relationship: data.emergency_contact_relationship || "",
            emergency_contact_address: data.emergency_contact_address || "",
            emergency_contact_phone_home: data.emergency_contact_phone_home || "",
            emergency_contact_phone_work: data.emergency_contact_phone_work || "",
            fitness_goal: data.fitness_goal || "",
            blood_group: data.blood_group || "",
            gender: data.gender || "",
            pt_join_date: data.pt_join_date || "",
            pt_expiry_date: data.pt_expiry_date || "",
            join_date: data.join_date || "",
            expiry_date: data.expiry_date || ""
          });

          // Check if PT plan is expired
          const isPtExpired =
            data.pt_expiry_date &&
            dayjs(data.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;

          if (isPtExpired) {
            setPtExpiredAlert(true);
          }

          // Also try to fetch existing PT Form data if any
          try {
            const [ptRes, assignRes] = await Promise.all([
              api.get(`/pt-forms/${memberId}`).catch(() => ({ data: null })),
              api.get('/assignments').catch(() => ({ data: [] }))
            ]);

            let trainerName = "";
            if (assignRes.data) {
              const myAssign = assignRes.data.find(a =>
                String(a.gymMemberId) === String(memberId) ||
                String(a.userId) === String(data.u_id)
              );
              if (myAssign) trainerName = myAssign.trainerName;
            }

            if (ptRes.data && ptRes.data.form_data && (isEditMode || data.pt_form_completed)) {
              const savedData = typeof ptRes.data.form_data === 'string'
                ? JSON.parse(ptRes.data.form_data)
                : ptRes.data.form_data;

              const isRenewed = savedData.pt_join_date && data.pt_join_date && !dayjs(savedData.pt_join_date).isSame(dayjs(data.pt_join_date), 'day');

              if (isPtExpired || isRenewed) {
                // If expired or renewed, retain all form data but reset the session tracker
                setFormData(prev => ({
                  ...prev,
                  ...savedData,
                  dob: savedData.dob ? normalizeDateForDateInput(savedData.dob) : prev.dob,
                  trainer_name_assigned: trainerName || savedData.trainer_name_assigned || (role === 'trainer' ? (profileName || "") : ""),
                  sessions: []
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  ...savedData,
                  dob: savedData.dob ? normalizeDateForDateInput(savedData.dob) : prev.dob,
                  trainer_name_assigned: trainerName || savedData.trainer_name_assigned || (role === 'trainer' ? (profileName || "") : "")
                }));
              }
            } else {
              setFormData(prev => ({
                ...prev,
                trainer_name_assigned: trainerName || (role === 'trainer' ? (profileName || "") : "")
              }));
            }
          } catch (err) {
            console.log('Error fetching supplemental PT form data', err);
          }

          try {
            if (data.email || data.phone) {
              const enquiryRes = await api.get('/followups');
              const enquiries = Array.isArray(enquiryRes.data) ? enquiryRes.data : [];
              const enquiry = enquiries.find(e =>
                (data.email && e.email === data.email) ||
                (data.phone && e.phone === data.phone)
              );
              if (enquiry) {
                const consentData = enquiry.consent_data && typeof enquiry.consent_data === 'string'
                  ? JSON.parse(enquiry.consent_data)
                  : enquiry.consent_data || {};
                setFormData(prev => ({
                  ...prev,
                  participant_name: consentData.participant_name || enquiry.name || prev.participant_name,
                  consent_agree: consentData.agree || prev.consent_agree,
                  consent_signature: consentData.signature || prev.consent_signature,
                  consent_date: consentData.date || prev.consent_date,
                  guardian_signature: consentData.guardian_signature || prev.guardian_signature,
                  witness: consentData.witness || prev.witness,
                }));
              }
            }
          } catch (enqErr) {
            console.log('No linked enquiry found for this member');
          }
        } catch (err) {
          console.error("Failed to pre-fill member data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchMember();
    }
  }, [memberId]);

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
      const targetMemberId = memberId || updatedData.member_id;
      if (!targetMemberId) {
        toast.error('Please select a member before completing the PT form.');
        return;
      }

      setLoading(true);
      try {
        const payload = {
          member_id: targetMemberId,
          user_id: updatedData.u_id || updatedData.user_id,
          formData: updatedData,
          completed: true
        };

        await api.post("/pt-forms", payload);
        toast.success(isEditMode ? "PT Form updated successfully!" : "PT Registration completed and stored successfully!");
        if (isEditMode && targetMemberId) {
          navigate(`/admin/member_details/${targetMemberId}`);
        } else if (returnUrl) {
          navigate(returnUrl);
        } else if (role === 'trainer') {
          navigate('/trainer');
        } else {
          navigate('/admin/members');
        }
      } catch (err) {
        console.error("Save PT Form error:", err);
        toast.error(err.response?.data?.error || "Failed to save registration");
      } finally {
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
    setLoading(true);
    try {
      const res = await api.get(`/members/${memberId}`);
      const data = res.data;
      const memberPrefill = {
        member_id: data.id,
        u_id: data.u_id,
        name: data.name || "",
        email: data.email || data.user_email || "",
        phone: data.phone || "",
        location: data.location || "",
        height: data.height || "",
        weight: data.weight || "",
        bmi: data.bmi || "",
        dob: normalizeDateForDateInput(data.dob),
        age: data.age || "",
        address: data.address || "",
        employer: data.employer || "",
        occupation: data.occupation || "",
        emergency_contact_name: data.emergency_contact_name || "",
        emergency_contact_relationship: data.emergency_contact_relationship || "",
        emergency_contact_address: data.emergency_contact_address || "",
        emergency_contact_phone_home: data.emergency_contact_phone_home || "",
        emergency_contact_phone_work: data.emergency_contact_phone_work || "",
        fitness_goal: data.fitness_goal || "",
        blood_group: data.blood_group || "",
        gender: data.gender || "",
        pt_join_date: data.pt_join_date || "",
        pt_expiry_date: data.pt_expiry_date || "",
        join_date: data.join_date || "",
        expiry_date: data.expiry_date || ""
      };

      const isPtExpired =
        data.pt_expiry_date &&
        dayjs(data.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;

      if (isPtExpired) {
        setPtExpiredAlert(true);
      } else {
        setPtExpiredAlert(false);
      }

      setFormData(memberPrefill);

      try {
        const ptRes = await api.get(`/pt-forms/${memberId}`);
        if (ptRes.data && ptRes.data.form_data && (isEditMode || data.pt_form_completed)) {
          const savedData = typeof ptRes.data.form_data === 'string'
            ? JSON.parse(ptRes.data.form_data)
            : ptRes.data.form_data;
          
          if (isPtExpired) {
            setFormData(prev => ({
              ...prev,
              ...savedData,
              dob: savedData.dob ? normalizeDateForDateInput(savedData.dob) : prev.dob,
              sessions: []
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              ...savedData,
              dob: savedData.dob ? normalizeDateForDateInput(savedData.dob) : prev.dob,
            }));
          }
        }

      } catch (err) {
        console.log('No saved PT form for selected member');
      }

      try {
        if (memberPrefill.email || memberPrefill.phone) {
          const enquiryRes = await api.get('/followups');
          const enquiries = Array.isArray(enquiryRes.data) ? enquiryRes.data : [];
          const enquiry = enquiries.find(e =>
            (memberPrefill.email && e.email === memberPrefill.email) ||
            (memberPrefill.phone && e.phone === memberPrefill.phone)
          );
          if (enquiry) {
            const consentData = enquiry.consent_data && typeof enquiry.consent_data === 'string'
              ? JSON.parse(enquiry.consent_data)
              : enquiry.consent_data || {};
            setFormData(prev => ({
              ...prev,
              participant_name: consentData.participant_name || enquiry.name || prev.participant_name,
              consent_agree: consentData.agree || prev.consent_agree,
              consent_signature: consentData.signature || prev.consent_signature,
              consent_date: consentData.date || prev.consent_date,
              guardian_signature: consentData.guardian_signature || prev.guardian_signature,
              witness: consentData.witness || prev.witness,
            }));
          }
        }
      } catch (enqErr) {
        console.log('No linked enquiry found for selected member');
      }
    } catch (err) {
      console.error('Failed to pre-fill member data on selection', err);
    } finally {
      setLoading(false);
    }
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
              if (isEditMode && memberId) {
                navigate(`/admin/member_details/${memberId}`);
              } else {
                navigate('/admin/payments');
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">Pre-filling member data...</p>
          </div>
        ) : (
          <CurrentComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectMember={handleMemberSelected}
            formData={formData}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === steps.length}
            trainerSignReadOnly={true}
          />
        )}
      </div>
    </div>
  );
};

export default PTForm;
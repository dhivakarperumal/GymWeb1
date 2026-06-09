import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';
import { useAuth } from '../../PrivateRouter/AuthContext';
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
            dob: data.dob ? dayjs(data.dob).format('YYYY-MM-DD') : "",
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
            gender: data.gender || ""
          });

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

            if (ptRes.data && ptRes.data.form_data) {
              const savedData = typeof ptRes.data.form_data === 'string'
                ? JSON.parse(ptRes.data.form_data)
                : ptRes.data.form_data;

              setFormData(prev => ({
                ...prev,
                ...savedData,
                trainer_name_assigned: trainerName || savedData.trainer_name_assigned || (role === 'trainer' ? (profileName || "") : "")
              }));
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
      // Final Step Completed
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
        dob: data.dob ? dayjs(data.dob).format('YYYY-MM-DD') : "",
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
        gender: data.gender || ""
      };

      setFormData(memberPrefill);

      try {
        const ptRes = await api.get(`/pt-forms/${memberId}`);
        if (ptRes.data && ptRes.data.form_data) {
          const savedData = typeof ptRes.data.form_data === 'string'
            ? JSON.parse(ptRes.data.form_data)
            : ptRes.data.form_data;
          setFormData(prev => ({ ...prev, ...savedData }));
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
      {/* Header with Step Indicator */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-500">{isEditMode ? 'Edit' : 'PT Registration'} Form</h1>
            {isEditMode && <p className="text-white/60 text-xs uppercase tracking-wider mt-2">Editing existing form</p>}
          </div>
          <button
            onClick={() => {
              if (isEditMode && memberId) {
                navigate(`/admin/member_details/${memberId}`);
              } else {
                navigate('/admin/payments');
              }
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
          >
            Back {isEditMode ? 'to Member' : 'to Payments'}
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= step.id ? 'text-orange-400' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 ${
                    currentStep > step.id ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
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
          />
        )}
      </div>
    </div>
  );
};

export default PTForm;
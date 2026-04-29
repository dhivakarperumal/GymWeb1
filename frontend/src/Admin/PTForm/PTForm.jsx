import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';
import dayjs from 'dayjs';
import Enquiry from './PTFormEnquiry';
import HealthHistoy from './HealthHistoy';
import HealthHistory2 from './HealthHistory2';
import InformedConsent from './InformedConsent';
import FitnessScreening from './FitnessScreening';
import FlexibilityAndMeasurements from './FlexibilityAndMeasurements';
import SessionTracker from './SessionTracker';

const PTForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const memberId = searchParams.get("member_id");
  const role = localStorage.getItem('role') || 'admin';

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
            const ptRes = await api.get(`/pt-forms/${memberId}`);
            if (ptRes.data && ptRes.data.form_data) {
              const savedData = typeof ptRes.data.form_data === 'string' 
                ? JSON.parse(ptRes.data.form_data) 
                : ptRes.data.form_data;
              
              setFormData(prev => ({
                ...prev,
                ...savedData
              }));
            }
          } catch (ptErr) {
            // It's okay if no PT form exists yet
            console.log("No existing PT form found for this member");
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
    { id: 7, name: 'Informed Consent', component: InformedConsent }
  ];

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final Step Completed
      setLoading(true);
      try {
        const payload = {
          member_id: memberId || updatedData.member_id, // prioritize URL param
          user_id: updatedData.u_id || updatedData.user_id,
          formData: updatedData,
          completed: true
        };

        await api.post("/pt-forms", payload);
        toast.success("PT Registration completed and stored successfully!");
        if (role === 'trainer') {
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
    setFormData(prev => ({ ...prev, member_id: memberId }));

    try {
      const ptRes = await api.get(`/pt-forms/${memberId}`);
      if (ptRes.data && ptRes.data.form_data) {
        const savedData = typeof ptRes.data.form_data === 'string'
          ? JSON.parse(ptRes.data.form_data)
          : ptRes.data.form_data;
        setFormData(prev => ({ ...prev, ...savedData }));
      }
    } catch (err) {
      // no existing PT form yet
      console.log('No saved PT form for selected member');
    }
  };

  const CurrentComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen text-white p-6">
      {/* Header with Step Indicator */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-500">PT Registration Form</h1>
          <button
            onClick={() => navigate('/admin/payments')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
          >
            Back to Payments
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
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import dayjs from 'dayjs';
import Enquiry from './PTFormEnquiry';
import HealthHistoy from './HealthHistoy';
import HealthHistory2 from './HealthHistory2';
import InformedConsent from './InformedConsent';
import FitnessScreening from './FitnessScreening';
import FlexibilityAndMeasurements from './FlexibilityAndMeasurements';

const PTForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const memberId = searchParams.get("member_id");

  useEffect(() => {
    if (memberId) {
      const fetchMember = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/members/${memberId}`);
          const data = res.data;
          setFormData({
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
    { id: 6, name: 'Informed Consent', component: InformedConsent }
  ];

  const handleNext = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Form completed, navigate back to payments or show success
      navigate('/admin/payments');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
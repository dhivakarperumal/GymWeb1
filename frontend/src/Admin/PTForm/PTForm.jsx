import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Enquiry from './PTFormEnquiry';
import HealthHistoy from './HealthHistoy';
import HealthHistory2 from './HealthHistory2';
import InformedConsent from './InformedConsent';
import FitnessScreening from './FitnessScreening';

const PTForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const steps = [
    { id: 1, name: 'Enquiry Form', component: Enquiry },
    { id: 2, name: 'Health History', component: HealthHistoy },
    { id: 3, name: 'Health History 2', component: HealthHistory2 },
    { id: 4, name: 'Fitness Screening', component: FitnessScreening },
    { id: 5, name: 'Informed Consent', component: InformedConsent }
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
        <CurrentComponent
          onNext={handleNext}
          onPrevious={handlePrevious}
          formData={formData}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === steps.length}
        />
      </div>
    </div>
  );
};

export default PTForm;
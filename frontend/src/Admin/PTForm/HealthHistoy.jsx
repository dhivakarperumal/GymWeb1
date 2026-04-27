import React, { useState } from 'react';

const HealthHistoy = ({ onNext, onPrevious, formData, isFirstStep, isLastStep }) => {
  const [healthData, setHealthData] = useState({
    medical_conditions: formData?.medical_conditions || "",
    medications: formData?.medications || "",
    allergies: formData?.allergies || "",
    previous_injuries: formData?.previous_injuries || "",
    surgeries: formData?.surgeries || "",
    family_medical_history: formData?.family_medical_history || "",
    smoking_habits: formData?.smoking_habits || "",
    alcohol_consumption: formData?.alcohol_consumption || "",
    exercise_history: formData?.exercise_history || "",
    dietary_restrictions: formData?.dietary_restrictions || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(healthData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHealthData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-white text-4xl font-bold border-b border-white/10 pb-1">Health History Form</h1>
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Medical Information</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Current Medical Conditions
            </label>
            <textarea
              name="medical_conditions"
              value={healthData.medical_conditions}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any current medical conditions..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Current Medications
            </label>
            <textarea
              name="medications"
              value={healthData.medications}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any medications you are currently taking..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Allergies
            </label>
            <input
              type="text"
              name="allergies"
              value={healthData.allergies}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any known allergies..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Previous Injuries
            </label>
            <input
              type="text"
              name="previous_injuries"
              value={healthData.previous_injuries}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any previous injuries..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Surgeries
            </label>
            <textarea
              name="surgeries"
              value={healthData.surgeries}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any surgeries you've had..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Family Medical History
            </label>
            <textarea
              name="family_medical_history"
              value={healthData.family_medical_history}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Family history of medical conditions..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Lifestyle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Smoking Habits
              </label>
              <select
                name="smoking_habits"
                value={healthData.smoking_habits}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select smoking habit</option>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
                <option value="occasional">Occasional smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Alcohol Consumption
              </label>
              <select
                name="alcohol_consumption"
                value={healthData.alcohol_consumption}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select alcohol consumption</option>
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Exercise History
              </label>
              <textarea
                name="exercise_history"
                value={healthData.exercise_history}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your exercise history..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Dietary Restrictions
              </label>
              <textarea
                name="dietary_restrictions"
                value={healthData.dietary_restrictions}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any dietary restrictions or preferences..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirstStep}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              isFirstStep
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            Previous
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isLastStep ? 'Complete Registration' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthHistoy;
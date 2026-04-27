import React, { useState } from 'react';

const HealthHistory2 = ({ onNext, onPrevious, formData, isFirstStep, isLastStep }) => {
  const [healthData2, setHealthData2] = useState({
    cardiovascular_health: formData?.cardiovascular_health || "",
    respiratory_health: formData?.respiratory_health || "",
    musculoskeletal_health: formData?.musculoskeletal_health || "",
    mental_health: formData?.mental_health || "",
    sleep_patterns: formData?.sleep_patterns || "",
    stress_levels: formData?.stress_levels || "",
    body_composition_goals: formData?.body_composition_goals || "",
    performance_goals: formData?.performance_goals || "",
    timeline_expectations: formData?.timeline_expectations || "",
    commitment_level: formData?.commitment_level || "",
    support_system: formData?.support_system || "",
    previous_training_experience: formData?.previous_training_experience || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(healthData2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHealthData2(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-white text-4xl font-bold border-b border-white/10 pb-1">Health History Form (Part 2)</h1>
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Additional Health Assessment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Cardiovascular Health
            </label>
            <select
              name="cardiovascular_health"
              value={healthData2.cardiovascular_health}
              onChange={handleChange}
              className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select cardiovascular health</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Respiratory Health
            </label>
            <select
              name="respiratory_health"
              value={healthData2.respiratory_health}
              onChange={handleChange}
              className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select respiratory health</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="asthma">Asthma</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Musculoskeletal Health
            </label>
            <select
              name="musculoskeletal_health"
              value={healthData2.musculoskeletal_health}
              onChange={handleChange}
              className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select musculoskeletal health</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="injury">Current Injury</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Mental Health Status
            </label>
            <select
              name="mental_health"
              value={healthData2.mental_health}
              onChange={handleChange}
              className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select mental health status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="challenging">Challenging</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Lifestyle & Goals Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Sleep Patterns
              </label>
              <select
                name="sleep_patterns"
                value={healthData2.sleep_patterns}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sleep pattern</option>
                <option value="excellent">7-9 hours consistently</option>
                <option value="good">6-8 hours most nights</option>
                <option value="fair">5-7 hours</option>
                <option value="poor">Less than 5 hours</option>
                <option value="irregular">Irregular schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Stress Levels
              </label>
              <select
                name="stress_levels"
                value={healthData2.stress_levels}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select stress level</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Body Composition Goals
              </label>
              <textarea
                name="body_composition_goals"
                value={healthData2.body_composition_goals}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your body composition goals..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Performance Goals
              </label>
              <textarea
                name="performance_goals"
                value={healthData2.performance_goals}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What performance improvements are you seeking?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Timeline Expectations
              </label>
              <select
                name="timeline_expectations"
                value={healthData2.timeline_expectations}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select timeline</option>
                <option value="3_months">3 months</option>
                <option value="6_months">6 months</option>
                <option value="1_year">1 year</option>
                <option value="long_term">Long term (1+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Commitment Level
              </label>
              <select
                name="commitment_level"
                value={healthData2.commitment_level}
                onChange={handleChange}
                className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select commitment level</option>
                <option value="very_high">Very High</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Support System
              </label>
              <textarea
                name="support_system"
                value={healthData2.support_system}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Who will support you in your fitness journey?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-1">
                Previous Training Experience
              </label>
              <textarea
                name="previous_training_experience"
                value={healthData2.previous_training_experience}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe any previous training experience..."
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

export default HealthHistory2;
import React, { useState } from 'react';

const HealthHistory2 = ({ onNext, onPrevious, formData, isFirstStep, isLastStep }) => {
  const [healthData2, setHealthData2] = useState({
    // Health History Conditions
    heart_attack: formData?.heart_attack || "",
    heart_bypass_cardiac_surgery: formData?.heart_bypass_cardiac_surgery || "",
    chest_discomfort_digine: formData?.chest_discomfort_digine || "",
    palpitation: formData?.palpitation || "",
    epilepsy: formData?.epilepsy || "",
    fainting_dizziness: formData?.fainting_dizziness || "",
    hypertension: formData?.hypertension || "",
    family_heart_disease: formData?.family_heart_disease || "",
    rheumatic_fever: formData?.rheumatic_fever || "",
    shortness_of_breath: formData?.shortness_of_breath || "",
    asthma: formData?.asthma || "",
    high_cholesterol: formData?.high_cholesterol || "",
    diabetes: formData?.diabetes || "",
    stroke: formData?.stroke || "",
    recent_hospitalization: formData?.recent_hospitalization || "",
    orthopedic_problem: formData?.orthopedic_problem || "",
    
    // Medical Information
    blood_pressure: formData?.blood_pressure || "",
    blood_sugar: formData?.blood_sugar || "",
    blood_cholesterol: formData?.blood_cholesterol || "",
    thyroid_level: formData?.thyroid_level || "",
    blood_uric_acid: formData?.blood_uric_acid || "",
    serum_3d: formData?.serum_3d || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(healthData2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHealthData2(prev => ({ ...prev, [name]: value }));
  };

  const conditions = [
    { key: 'heart_attack', label: 'Heart Attack' },
    { key: 'heart_bypass_cardiac_surgery', label: 'Heart bypass or any other cardiac surgery' },
    { key: 'chest_discomfort_digine', label: 'Chest discomfort with (Digine)' },
    { key: 'palpitation', label: 'Palpitation' },
    { key: 'epilepsy', label: 'Epilepsy' },
    { key: 'fainting_dizziness', label: 'Fainting or dizziness or loss of consciousness' },
    { key: 'hypertension', label: 'Hypertension (High blood pressure)' },
    { key: 'family_heart_disease', label: 'Family history of any heart disease (Male<55yrs & Female<65 yrs)' },
    { key: 'rheumatic_fever', label: 'Rheumatic fever' },
    { key: 'shortness_of_breath', label: 'Shortness of breath with or without exercise' },
    { key: 'asthma', label: 'Asthma (Any breathing issues)' },
    { key: 'high_cholesterol', label: 'High blood cholesterol (lipid)' },
    { key: 'diabetes', label: 'Diabetes or impaired blood glucose' },
    { key: 'stroke', label: 'Stroke' },
    { key: 'recent_hospitalization', label: 'Recent hospitalization for any cause' },
    { key: 'orthopedic_problem', label: 'Orthopedic problem (including arthritis)' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-white text-4xl font-bold border-b border-white/10 pb-1">Health History Questionnaire</h1>
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Please fill out all information requested below</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Health History Table */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Medical History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white/80 text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3 border-r border-white/20">Condition</th>
                  <th className="text-center p-3 border-r border-white/20 w-20">Yes(Y)</th>
                  <th className="text-center p-3 w-20">No(N)</th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((condition, index) => (
                  <tr key={condition.key} className="border-b border-white/10">
                    <td className="p-3 border-r border-white/20">{index + 1}. {condition.label}</td>
                    <td className="text-center p-3 border-r border-white/20">
                      <input
                        type="radio"
                        name={condition.key}
                        value="yes"
                        checked={healthData2[condition.key] === "yes"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center p-3">
                      <input
                        type="radio"
                        name={condition.key}
                        value="no"
                        checked={healthData2[condition.key] === "no"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Medical Information</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white/80 text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3 border-r border-white/20">Parameter</th>
                  <th className="text-left p-3">Values</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="p-3 border-r border-white/20">Blood Pressure</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="blood_pressure"
                      value={healthData2.blood_pressure}
                      onChange={handleChange}
                      placeholder="e.g., 120/80 mmHg"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 border-r border-white/20">Blood sugar</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="blood_sugar"
                      value={healthData2.blood_sugar}
                      onChange={handleChange}
                      placeholder="e.g., 100 mg/dL"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 border-r border-white/20">Blood cholesterol</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="blood_cholesterol"
                      value={healthData2.blood_cholesterol}
                      onChange={handleChange}
                      placeholder="e.g., 200 mg/dL"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 border-r border-white/20">Thyroid level</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="thyroid_level"
                      value={healthData2.thyroid_level}
                      onChange={handleChange}
                      placeholder="e.g., TSH value"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 border-r border-white/20">Blood uric acid</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="blood_uric_acid"
                      value={healthData2.blood_uric_acid}
                      onChange={handleChange}
                      placeholder="e.g., 7.0 mg/dL"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 border-r border-white/20">Serum 3D</td>
                  <td className="p-3">
                    <input
                      type="text"
                      name="serum_3d"
                      value={healthData2.serum_3d}
                      onChange={handleChange}
                      placeholder="Enter value"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
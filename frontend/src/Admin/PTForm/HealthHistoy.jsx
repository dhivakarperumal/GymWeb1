import React, { useState } from 'react';

const HealthHistoy = ({ onNext, onPrevious, formData, isFirstStep, isLastStep }) => {
  const [healthData, setHealthData] = useState({
    // Medications
    taking_medications: formData?.taking_medications || "no",
    medications: formData?.medications || [{ name: "", dosage_frequency: "", reason: "" }],
    
    // Allergies
    allergies: formData?.allergies || "",
    
    // Surgeries and Accidents
    major_surgeries_accidents: formData?.major_surgeries_accidents || ["", "", ""],
    
    // Exercise
    involved_in_exercise_program: formData?.involved_in_exercise_program || "no",
    recreational_sports: formData?.recreational_sports || ["", "", ""],
    
    // Lifestyle and Dietary Factors
    smoking: formData?.smoking || "no",
    alcohol_consumption: formData?.alcohol_consumption || "no",
    food_preference: formData?.food_preference || "",
    dietary_supplements: formData?.dietary_supplements || "no"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(healthData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHealthData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMeds = [...healthData.medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setHealthData(prev => ({ ...prev, medications: updatedMeds }));
  };

  const addMedication = () => {
    setHealthData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage_frequency: "", reason: "" }]
    }));
  };

  const removeMedication = (index) => {
    setHealthData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const updated = [...healthData[field]];
    updated[index] = value;
    setHealthData(prev => ({ ...prev, [field]: updated }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-white text-4xl font-bold border-b border-white/10 pb-1">Health History Questionnaire</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Medications Section */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Are you taking any medications?</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white/80">
              <input
                type="radio"
                name="taking_medications"
                value="yes"
                checked={healthData.taking_medications === "yes"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input
                type="radio"
                name="taking_medications"
                value="no"
                checked={healthData.taking_medications === "no"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              No
            </label>
          </div>

          {healthData.taking_medications === "yes" && (
            <div className="space-y-3">
              <label className="text-sm text-white/70">If yes, complete the following:</label>
              <div className="overflow-x-auto">
                <table className="w-full text-white/80 text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Dosage/Frequency</th>
                      <th className="text-left p-2">Reason for taking</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthData.medications.map((med, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="p-2">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                            placeholder="Medication name"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={med.dosage_frequency}
                            onChange={(e) => handleMedicationChange(index, "dosage_frequency", e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                            placeholder="e.g., 2x daily"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={med.reason}
                            onChange={(e) => handleMedicationChange(index, "reason", e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/40"
                            placeholder="Reason"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addMedication}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                + Add Medication
              </button>
            </div>
          )}
        </div>

        {/* Allergies Section */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Please list any allergies:</h3>
          <textarea
            name="allergies"
            value={healthData.allergies}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List any allergies..."
          />
        </div>

        {/* Surgeries/Accidents Section */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Have you undergone any major surgeries/major accidents?</h3>
          <div className="space-y-2">
            <label className="text-white/70 text-sm">If yes, please specify:</label>
            {healthData.major_surgeries_accidents.map((surgery, index) => (
              <input
                key={index}
                type="text"
                value={surgery}
                onChange={(e) => handleArrayChange("major_surgeries_accidents", index, e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                placeholder={`${index + 1}.`}
              />
            ))}
          </div>
        </div>

        {/* Exercise Program */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Are you currently involved in any exercise program?</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white/80">
              <input
                type="radio"
                name="involved_in_exercise_program"
                value="yes"
                checked={healthData.involved_in_exercise_program === "yes"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input
                type="radio"
                name="involved_in_exercise_program"
                value="no"
                checked={healthData.involved_in_exercise_program === "no"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              No
            </label>
          </div>
        </div>

        {/* Recreational Sports */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">Are you involved in any recreational sports?</h3>
          <label className="text-white/70 text-sm">If any, please specify:</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData.recreational_sports.map((sport, index) => (
              <input
                key={index}
                type="text"
                value={sport}
                onChange={(e) => handleArrayChange("recreational_sports", index, e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                placeholder={`${index + 1}.`}
              />
            ))}
          </div>
        </div>

        {/* Lifestyle and Dietary Factors */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-orange-500 font-bold text-lg">LIFESTYLE AND DIETARY FACTORS</h3>

          {/* Smoking and Alcohol */}
          <div className="space-y-4">
            <h4 className="text-white/80 font-semibold">Smoking and Alcohol consumption</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-white/80 text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-2">Habit</th>
                    <th className="text-center p-2">Yes</th>
                    <th className="text-center p-2">No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="p-2">Smoking</td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name="smoking"
                        value="yes"
                        checked={healthData.smoking === "yes"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name="smoking"
                        value="no"
                        checked={healthData.smoking === "no"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-2">Alcohol</td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name="alcohol_consumption"
                        value="yes"
                        checked={healthData.alcohol_consumption === "yes"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name="alcohol_consumption"
                        value="no"
                        checked={healthData.alcohol_consumption === "no"}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="space-y-4 mt-6">
            <h4 className="text-white/80 font-semibold">Nutritional information</h4>
            <div className="space-y-3">
              <div>
                <label className="text-white/80 text-sm block mb-2">Food preference</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="radio"
                      name="food_preference"
                      value="veg"
                      checked={healthData.food_preference === "veg"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Veg
                  </label>
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="radio"
                      name="food_preference"
                      value="non-veg"
                      checked={healthData.food_preference === "non-veg"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Non-Veg
                  </label>
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm block mb-2">Do you take dietary supplements?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="radio"
                      name="dietary_supplements"
                      value="yes"
                      checked={healthData.dietary_supplements === "yes"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="radio"
                      name="dietary_supplements"
                      value="no"
                      checked={healthData.dietary_supplements === "no"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </div>
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
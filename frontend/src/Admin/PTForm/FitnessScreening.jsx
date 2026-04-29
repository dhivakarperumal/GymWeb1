import React, { useState } from "react";

const FitnessScreening = ({
  onNext,
  onPrevious,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  readOnly = false,
}) => {
  const [localFormData, setLocalFormData] = useState({
    fs_height: initialFormData?.fs_height || "",
    fs_weight: initialFormData?.fs_weight || "",
    fs_resting_hr: initialFormData?.fs_resting_hr || "",

    fs_fat_percentage: initialFormData?.fs_fat_percentage || "",
    fs_fat_level: initialFormData?.fs_fat_level || "",

    fs_speed_km: initialFormData?.fs_speed_km || "",
    fs_heart_rate: initialFormData?.fs_heart_rate || "",

    fs_push_ups_count: initialFormData?.fs_push_ups_count || "",
    fs_push_ups_level: initialFormData?.fs_push_ups_level || "",

    fs_squats_count: initialFormData?.fs_squats_count || "",
    fs_squats_level: initialFormData?.fs_squats_level || "",

    fs_plank_hold_count: initialFormData?.fs_plank_hold_count || "",
    fs_plank_hold_level: initialFormData?.fs_plank_hold_level || "",

    fs_shoulder_count: initialFormData?.fs_shoulder_count || "",
    fs_shoulder_level: initialFormData?.fs_shoulder_level || "",

    fs_biceps_count: initialFormData?.fs_biceps_count || "",
    fs_biceps_level: initialFormData?.fs_biceps_level || "",

    fs_triceps_count: initialFormData?.fs_triceps_count || "",
    fs_triceps_level: initialFormData?.fs_triceps_level || "",

    fs_curl_ups_count: initialFormData?.fs_curl_ups_count || "",
    fs_curl_ups_level: initialFormData?.fs_curl_ups_level || "",
  });

  const [isManualLevel, setIsManualLevel] = useState(false);

  React.useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      setLocalFormData(prev => ({
        ...prev,
        ...initialFormData,
        fs_height: initialFormData.fs_height || initialFormData.height || "",
        fs_weight: initialFormData.fs_weight || initialFormData.weight || "",
        fs_fat_level: String(initialFormData.fs_fat_level || "").trim(),
        fs_push_ups_level: String(initialFormData.fs_push_ups_level || "").trim(),
        fs_squats_level: String(initialFormData.fs_squats_level || "").trim(),
        fs_plank_hold_level: String(initialFormData.fs_plank_hold_level || "").trim(),
        fs_shoulder_level: String(initialFormData.fs_shoulder_level || "").trim(),
        fs_biceps_level: String(initialFormData.fs_biceps_level || "").trim(),
        fs_triceps_level: String(initialFormData.fs_triceps_level || "").trim(),
        fs_curl_ups_level: String(initialFormData.fs_curl_ups_level || "").trim(),
      }));
    }
  }, [initialFormData]);

  // Auto-calculate Fat Level based on percentage and gender
  React.useEffect(() => {
    if (isManualLevel) return;

    const fat = parseFloat(localFormData.fs_fat_percentage);
    if (isNaN(fat)) return;

    const gender = initialFormData?.gender || "Male";
    let level = "";

    if (gender === "Male") {
      if (fat < 8) level = "Low";
      else if (fat <= 19) level = "Healthy";
      else if (fat <= 25) level = "Overweight";
      else level = "Obese";
    } else {
      if (fat < 21) level = "Low";
      else if (fat <= 33) level = "Healthy";
      else if (fat <= 39) level = "Overweight";
      else level = "Obese";
    }

    if (level) {
      setLocalFormData(prev => ({ ...prev, fs_fat_level: level }));
    }
  }, [localFormData.fs_fat_percentage, initialFormData?.gender, isManualLevel]);

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value, type, checked } = e.target;
    if (type === "radio") {
      if (checked) {
        if (name === "fs_fat_level") setIsManualLevel(true);
        setLocalFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setLocalFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const normalizeValue = (value) => String(value || "").trim().toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(localFormData);
  };

  const renderMuscleEnduranceRow = (label, namePrefix) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="font-medium text-white/80">{label}:</div>
      <div>
        <input
          type="text"
          name={`${namePrefix}_count`}
          value={localFormData[`${namePrefix}_count`]}
          onChange={handleChange}
          
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Count/Value"
        />
      </div>
      <div className="col-span-2 flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`${namePrefix}_level`}
            value="Superior"
            checked={normalizeValue(localFormData[`${namePrefix}_level`]) === "superior"}
            onChange={handleChange}
            
            className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
          />
          <span className="text-white/80 text-sm">Superior</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`${namePrefix}_level`}
            value="Good"
            checked={normalizeValue(localFormData[`${namePrefix}_level`]) === "good"}
            onChange={handleChange}
            
            className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
          />
          <span className="text-white/80 text-sm">Good</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`${namePrefix}_level`}
            value="Poor"
            checked={normalizeValue(localFormData[`${namePrefix}_level`]) === "poor"}
            onChange={handleChange}
            
            className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
          />
          <span className="text-white/80 text-sm">Poor</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* RESTING PARAMETERS */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Resting Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Height in cm:</label>
                <input
                  type="text"
                  name="fs_height"
                  value={localFormData.fs_height}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Weight in KG:</label>
                <input
                  type="text"
                  name="fs_weight"
                  value={localFormData.fs_weight}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Resting HR:</label>
                <input
                  type="text"
                  name="fs_resting_hr"
                  value={localFormData.fs_resting_hr}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* COMPOSITIONS */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Compositions</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="md:w-1/3">
                <label className="block text-sm font-medium text-white/80 mb-1">Fat% (BIA):</label>
                <input
                  type="text"
                  name="fs_fat_percentage"
                  value={localFormData.fs_fat_percentage}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-2">
                {['Low', 'Healthy', 'Obese', 'Overweight'].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fs_fat_level"
                      value={level}
                      checked={normalizeValue(localFormData.fs_fat_level) === level.toLowerCase()}
                      onChange={handleChange}
                      
                      className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                    />
                    <span className="text-white/80 text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* CARDIORESPIRATORY FITNESS */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Cardiorespiratory Fitness</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Speed in KM:</label>
                <input
                  type="text"
                  name="fs_speed_km"
                  value={localFormData.fs_speed_km}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Heart rate:</label>
                <input
                  type="text"
                  name="fs_heart_rate"
                  value={localFormData.fs_heart_rate}
                  onChange={handleChange}
                  
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* MUSCLE ENDURANCE */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Muscle Endurance</h3>
            <div className="flex flex-col gap-2">
              {renderMuscleEnduranceRow('Push-ups', 'fs_push_ups')}
              {renderMuscleEnduranceRow('Squats', 'fs_squats')}
              {renderMuscleEnduranceRow('Plank Hold', 'fs_plank_hold')}
              {renderMuscleEnduranceRow('Shoulder', 'fs_shoulder')}
              {renderMuscleEnduranceRow('Biceps', 'fs_biceps')}
              {renderMuscleEnduranceRow('Triceps', 'fs_triceps')}
              {renderMuscleEnduranceRow('Curl ups', 'fs_curl_ups')}
            </div>
          </div>

          {/* Navigation Buttons */}
          {!readOnly && (
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstStep}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${isFirstStep
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
              >
                Previous
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-600/20 transition-all"
              >
                {isLastStep ? "Complete Registration" : "Next Step"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FitnessScreening;

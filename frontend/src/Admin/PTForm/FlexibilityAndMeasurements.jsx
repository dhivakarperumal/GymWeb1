import React, { useState } from "react";

const FlexibilityAndMeasurements = ({
  onNext,
  onPrevious,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  readOnly = false,
  saveOnly = false,
}) => {
  const [localFormData, setLocalFormData] = useState({
    flex_apley_test: initialFormData?.flex_apley_test || "",
    flex_ymca_val: initialFormData?.flex_ymca_val || "",
    flex_ymca_test: initialFormData?.flex_ymca_test || "",
    flex_knee_val: initialFormData?.flex_knee_val || "",
    flex_knee_test: initialFormData?.flex_knee_test || "",
    measurements: initialFormData?.measurements || Array(5).fill({
      date: "",
      height: "",
      weight: "",
      neck: "",
      shoulder: "",
      arm: "",
      chest_normal: "",
      chest_expanded: "",
      waist: "",
      abdomen: "",
      hip: "",
      thigh: "",
      calf: "",
      lat: "",
    })
  });

  React.useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      setLocalFormData(prev => ({
        ...prev,
        ...initialFormData,
        flex_apley_test: String(initialFormData.flex_apley_test || "").trim(),
        flex_ymca_test: String(initialFormData.flex_ymca_test || "").trim(),
        flex_knee_test: String(initialFormData.flex_knee_test || "").trim(),
        measurements: initialFormData.measurements || prev.measurements
      }));
    }
  }, [initialFormData]);

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value, type, checked } = e.target;
    if (type === "radio") {
      if (checked) {
        setLocalFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setLocalFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const normalizeValue = (value) => String(value || "").trim().toLowerCase();

  const handleMeasurementChange = (index, field, value) => {
    if (readOnly) return;
    const newMeasurements = [...localFormData.measurements];
    newMeasurements[index] = { ...newMeasurements[index], [field]: value };
    setLocalFormData((prev) => ({ ...prev, measurements: newMeasurements }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(localFormData);
  };

  const measurementFields = [
    { label: "Date", key: "date", type: "date" },
    { label: "Height (cms)", key: "height", type: "text" },
    { label: "Weight", key: "weight", type: "text" },
    { label: "Neck", key: "neck", type: "text" },
    { label: "Shoulder (cms)", key: "shoulder", type: "text" },
    { label: "Arm", key: "arm", type: "text" },
    { label: "Chest (Normal)", key: "chest_normal", type: "text" },
    { label: "Chest (Expanded)", key: "chest_expanded", type: "text" },
    { label: "Waist", key: "waist", type: "text" },
    { label: "Abdomen", key: "abdomen", type: "text" },
    { label: "Hip", key: "hip", type: "text" },
    { label: "Thigh", key: "thigh", type: "text" },
    { label: "Calf", key: "calf", type: "text" },
    { label: "Lat", key: "lat", type: "text" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* FLEXIBILITY */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Flexibility</h3>

            {/* Apley's Scratch test */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <div className="font-medium text-white/80 mb-2">Apley's Scratch test:</div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_apley_test"
                    value="Normal"
                    checked={normalizeValue(localFormData.flex_apley_test) === "normal"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_apley_test"
                    value="Restricted"
                    checked={normalizeValue(localFormData.flex_apley_test) === "restricted"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Restricted</span>
                </label>
              </div>
            </div>

            {/* YMCA sit & Reach test */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <div className="font-medium text-white/80">YMCA sit & Reach test (normal/back saver):</div>
                <input
                  type="text"
                  name="flex_ymca_val"
                  value={localFormData.flex_ymca_val}
                  onChange={handleChange}
                  
                  className="w-32 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Value"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_ymca_test"
                    value="Well"
                    checked={normalizeValue(localFormData.flex_ymca_test) === "well"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Well</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_ymca_test"
                    value="Average"
                    checked={normalizeValue(localFormData.flex_ymca_test) === "average"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Average</span>
                </label>
              </div>
            </div>

            {/* Knee to Wall Lunge test */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <div className="font-medium text-white/80">Knee to Wall Lunge test:</div>
                <input
                  type="text"
                  name="flex_knee_val"
                  value={localFormData.flex_knee_val}
                  onChange={handleChange}
                  
                  className="w-32 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Value"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_knee_test"
                    value="Normal"
                    checked={normalizeValue(localFormData.flex_knee_test) === "normal"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flex_knee_test"
                    value="Restricted"
                    checked={normalizeValue(localFormData.flex_knee_test) === "restricted"}
                    onChange={handleChange}
                    
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 focus:ring-orange-500"
                  />
                  <span className="text-white/80 text-sm">Restricted</span>
                </label>
              </div>
            </div>
          </div>

          {/* MEASUREMENTS TABLE */}
          <div className="space-y-4 pt-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">
              Measurements
            </h3>

            <div className="overflow-x-auto border border-white/20 rounded-lg">
              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-white/10 border-b border-white/20">
                    <th className="p-3 text-center border-r border-white/20 w-20">
                      S.No
                    </th>

                    <th className="p-3 text-left border-r border-white/20 w-60">
                      Measurement
                    </th>

                    {[1, 2, 3, 4, 5].map((num) => (
                      <th
                        key={num}
                        className="p-3 text-center border-r border-white/20 last:border-0 text-orange-400"
                      >
                        {num}
                      </th>
                    ))}
                  </tr>
                </thead>


                <tbody>
                  {measurementFields.map((field, rowIndex) => (

                    <tr
                      key={field.key}
                      className="border-b border-white/10 hover:bg-white/5"
                    >

                      {/* Serial number column */}
                      <td className="p-3 text-center border-r border-white/20 text-white/70">
                        {rowIndex + 1}
                      </td>

                      {/* Measurement name */}
                      <td className="p-3 border-r border-white/20 text-white">
                        {field.label}
                      </td>

                      {/* 1-5 entries */}
                      {[0, 1, 2, 3, 4].map((colIndex) => (
                        <td
                          key={colIndex}
                          className="p-0 border-r border-white/20 last:border-0"
                        >
                          <input
                            type={field.type}
                            value={localFormData.measurements[colIndex][field.key] || ""}
                            onChange={(e) =>
                              handleMeasurementChange(
                                colIndex,
                                field.key,
                                e.target.value
                              )
                            }
                            
                            className="w-full p-3 bg-transparent text-center text-white focus:outline-none focus:bg-white/10"
                          />
                        </td>
                      ))}

                    </tr>

                  ))}
                </tbody>

              </table>
            </div>
          </div>

          {/* Navigation / Save Button */}
          {!readOnly && (
            <div className="flex gap-3 pt-6">
            {!saveOnly && (
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
            )}


            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-600/20 transition-all"
            >
              {saveOnly ? "Save Flexibility and Measurements" : (isLastStep ? "Complete Registration" : "Next Step")}
            </button>
          </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FlexibilityAndMeasurements;

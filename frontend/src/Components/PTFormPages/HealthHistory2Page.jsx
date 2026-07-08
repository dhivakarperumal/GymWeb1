import React, { useEffect, useState } from 'react';

const HealthHistory2Page = ({ data, onSubmit, onPrevious }) => {
  const questions = [
    'Heart Attack',
    'Heart bypass or any other cardiac surgery',
    'Chest discomfort with Digine',
    'Palpitation',
    'Epilepsy',
    'Fainting or dizziness or loss of consciousness',
    'Hypertension (High blood pressure)',
    'Family history of heart disease (Male < 55 yrs & Female < 65 yrs)',
    'Rheumatic fever',
    'Shortness of breath with or without exercise',
    'Any Breathing difficulties / Wheezing / Asthma',
    'High blood cholesterol (lipid)',
    'Diabetes or impaired blood sugar',
    'Stroke',
    'Recent hospitalization / other medical conditions',
    'Orthopedic problem (including arthritis)',
  ];

  const [form, setForm] = useState({
    bp: '',
    sugar: '',
    cholesterol: '',
    thyroid: '',
    uric: '',
    serum3d: '',
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  const handleRadio = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/5 shadow-xl">
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
          Health History Questionnaire
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-white/80 mb-6">Please fill out all information requested below</p>
            <div className="space-y-4">
              {questions.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b border-white/10 pb-3">
                  <div className="col-span-12 md:col-span-8 text-sm md:text-base text-white">
                    {index + 1}. {item}
                  </div>
                  <div className="col-span-12 md:col-span-4 flex flex-wrap gap-4 justify-end">
                    <label className="flex items-center gap-2 text-white">
                      <input
                        type="radio"
                        name={`q${index}`}
                        checked={form[`q${index}`] === 'Yes'}
                        onChange={() => handleRadio(`q${index}`, 'Yes')}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input
                        type="radio"
                        name={`q${index}`}
                        checked={form[`q${index}`] === 'No'}
                        onChange={() => handleRadio(`q${index}`, 'No')}
                      />
                      No
                    </label>
                  </div>
                  {(index === 14 || index === 15) && (
                    <div className="col-span-12 mt-3">
                      <input
                        type="text"
                        name={`specify${index}`}
                        value={form[`specify${index}`] || ''}
                        placeholder="List specifies"
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-orange-400 font-bold text-xl mb-6">Medical Information</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Blood Pressure" name="bp" value={form.bp} onChange={handleChange} />
              <Field label="Blood Sugar" name="sugar" value={form.sugar} onChange={handleChange} />
              <Field label="Blood Cholesterol" name="cholesterol" value={form.cholesterol} onChange={handleChange} />
              <Field label="Thyroid Level" name="thyroid" value={form.thyroid} onChange={handleChange} />
              <Field label="Blood Uric Acid" name="uric" value={form.uric} onChange={handleChange} />
              <Field label="Serum 3D" name="serum3d" value={form.serum3d} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onPrevious}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
            >
              Previous
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-600/20 transition-all"
            >
              Save & Next Step
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, name, value, onChange }) => (
  <div>
    <label className="block mb-2 text-white">{label}</label>
    <input
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default HealthHistory2Page;

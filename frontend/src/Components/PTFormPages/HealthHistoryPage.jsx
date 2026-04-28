import React, { useEffect, useState } from 'react';

const HealthHistoryPage = ({ data, onSubmit }) => {
  const [form, setForm] = useState({
    medications: '',
    med1: '',
    dose1: '',
    reason1: '',
    med2: '',
    dose2: '',
    reason2: '',
    med3: '',
    dose3: '',
    reason3: '',
    allergies: '',
    surgeries1: '',
    surgeries2: '',
    surgeries3: '',
    exercise_program: '',
    sport1: '',
    sport2: '',
    sport3: '',
    sport4: '',
    sport5: '',
    sport6: '',
    smoking: '',
    alcohol: '',
    food_preference: '',
    supplements: '',
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
          Health History Questionnaire
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4 text-white">Are you taking any medications?</p>
            <div className="flex gap-8 mb-5">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="medications"
                  value="Yes"
                  checked={form.medications === 'Yes'}
                  onChange={handleChange}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="medications"
                  value="No"
                  checked={form.medications === 'No'}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
            <p className="text-orange-400 mb-4">If yes, complete the following</p>
            <div className="grid md:grid-cols-3 gap-4">
              <InputField name="med1" placeholder="Name" value={form.med1} onChange={handleChange} />
              <InputField name="dose1" placeholder="Dosage/Frequency" value={form.dose1} onChange={handleChange} />
              <InputField name="reason1" placeholder="Reason" value={form.reason1} onChange={handleChange} />
              <InputField name="med2" placeholder="Name" value={form.med2} onChange={handleChange} />
              <InputField name="dose2" placeholder="Dosage/Frequency" value={form.dose2} onChange={handleChange} />
              <InputField name="reason2" placeholder="Reason" value={form.reason2} onChange={handleChange} />
              <InputField name="med3" placeholder="Name" value={form.med3} onChange={handleChange} />
              <InputField name="dose3" placeholder="Dosage/Frequency" value={form.dose3} onChange={handleChange} />
              <InputField name="reason3" placeholder="Reason" value={form.reason3} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="block mb-2 text-white">Please list any allergies</label>
            <input
              name="allergies"
              value={form.allergies}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4 text-white">Have you undergone any major surgeries/major accidents?</p>
            <input name="surgeries1" value={form.surgeries1} placeholder="1." onChange={handleChange} className="input w-full mb-3" />
            <input name="surgeries2" value={form.surgeries2} placeholder="2." onChange={handleChange} className="input w-full mb-3" />
            <input name="surgeries3" value={form.surgeries3} placeholder="3." onChange={handleChange} className="input w-full" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4 text-white">Are you currently involved in any exercise program?</p>
            <div className="flex gap-8 mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exercise_program"
                  value="Yes"
                  checked={form.exercise_program === 'Yes'}
                  onChange={handleChange}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exercise_program"
                  value="No"
                  checked={form.exercise_program === 'No'}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
            <p className="mb-4 text-white">Are you involved in recreational sports?</p>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField name="sport1" placeholder="1." value={form.sport1} onChange={handleChange} />
              <InputField name="sport4" placeholder="4." value={form.sport4} onChange={handleChange} />
              <InputField name="sport2" placeholder="2." value={form.sport2} onChange={handleChange} />
              <InputField name="sport5" placeholder="5." value={form.sport5} onChange={handleChange} />
              <InputField name="sport3" placeholder="3." value={form.sport3} onChange={handleChange} />
              <InputField name="sport6" placeholder="6." value={form.sport6} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-orange-400 font-bold mb-5">LIFESTYLE AND DIETARY FACTORS</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <SelectRow label="Smoking" name="smoking" value={form.smoking} onChange={handleChange} />
              <SelectRow label="Alcohol" name="alcohol" value={form.alcohol} onChange={handleChange} />
            </div>
            <div className="mt-6">
              <label className="block mb-3 text-white">Food Preference</label>
              <div className="flex gap-8">
                <label className="flex items-center gap-2">
                  <input type="radio" name="food_preference" value="Veg" checked={form.food_preference === 'Veg'} onChange={handleChange} /> Veg
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="food_preference" value="Non-Veg" checked={form.food_preference === 'Non-Veg'} onChange={handleChange} /> Non-Veg
                </label>
              </div>
            </div>
            <div className="mt-6">
              <label className="block mb-3 text-white">Do you take dietary supplements?</label>
              <div className="flex gap-8">
                <label className="flex items-center gap-2">
                  <input type="radio" name="supplements" value="Yes" checked={form.supplements === 'Yes'} onChange={handleChange} /> Yes
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="supplements" value="No" checked={form.supplements === 'No'} onChange={handleChange} /> No
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold">
            Save Health History
          </button>
        </form>
      </div>
    </div>
  );
};

const InputField = ({ name, placeholder, value, onChange }) => (
  <input
    name={name}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

const SelectRow = ({ label, name, value, onChange }) => (
  <div>
    <label className="block mb-2 text-white">{label}</label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
    >
      <option value="">Select</option>
      <option>Yes</option>
      <option>No</option>
    </select>
  </div>
);

export default HealthHistoryPage;

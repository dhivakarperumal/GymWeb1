import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const EnquiryFormPage = ({ data, onSubmit, readOnly }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    age: '',
    blood_group: '',
    gender: '',
    address: '',
    employer: '',
    occupation: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_address: '',
    emergency_contact_phone_home: '',
    emergency_contact_phone_work: '',
    fitness_goal: '',
    message: '',
    height: '',
    weight: '',
    bmi: '',
  });

  useEffect(() => {
    if (data) {
      let formattedDob = data.dob || '';
      if (formattedDob) {
        const parsed = dayjs(formattedDob);
        if (parsed.isValid()) {
          formattedDob = parsed.format('YYYY-MM-DD');
        }
      }

      setForm((prev) => ({
        ...prev,
        ...data,
        dob: formattedDob,
        age: data.age || '',
      }));
    }
  }, [data]);

  useEffect(() => {
    if (form.height && form.weight) {
      const heightMeters = parseFloat(form.height) / 100;
      const weightKg = parseFloat(form.weight);
      if (heightMeters > 0 && weightKg > 0) {
        const bmiVal = (weightKg / (heightMeters * heightMeters)).toFixed(1);
        setForm((prev) => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setForm((prev) => ({ ...prev, bmi: '' }));
    }
  }, [form.height, form.weight]);

  useEffect(() => {
    if (form.dob) {
      const ageValue = dayjs().diff(dayjs(form.dob), 'year');
      setForm((prev) => ({ ...prev, age: ageValue >= 0 ? String(ageValue) : '' }));
    }
  }, [form.dob]);

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
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
              Enquiry / Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" name="name" value={form.name} onChange={handleChange} readOnly={readOnly} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} readOnly={readOnly} required />
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} readOnly={readOnly} />
              <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} readOnly={readOnly} />
              <Field label="Age" name="age" type="number" value={form.age} onChange={handleChange} readOnly={readOnly} />
              <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} readOnly={readOnly} />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} readOnly={readOnly} gender />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
              Professional / Emergency Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Employer" name="employer" value={form.employer} onChange={handleChange} readOnly={readOnly} />
              <Field label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} readOnly={readOnly} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Emergency Contact" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} readOnly={readOnly} />
              <Field label="Relationship" name="emergency_contact_relationship" value={form.emergency_contact_relationship} onChange={handleChange} readOnly={readOnly} />
              <Field label="Home Phone" name="emergency_contact_phone_home" value={form.emergency_contact_phone_home} onChange={handleChange} readOnly={readOnly} />
              <Field label="Work Phone" name="emergency_contact_phone_work" value={form.emergency_contact_phone_work} onChange={handleChange} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Emergency Contact Address</label>
              <textarea
                name="emergency_contact_address"
                value={form.emergency_contact_address}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
              Health & Fitness Goals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} readOnly={readOnly} />
              <Field label="Weight (kg)" name="weight" type="number" value={form.weight} onChange={handleChange} readOnly={readOnly} />
              <Field label="BMI" name="bmi" value={form.bmi} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fitness Goals</label>
              <textarea
                name="fitness_goal"
                value={form.fitness_goal}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-slate-950/80 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Informed Consent</h3>
                <p className="text-white/60 text-sm">Please complete the consent form before moving to the next step.</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-white/80 leading-7">
                I <strong>{form.participant_name || '__________'}</strong> give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Participant Name</label>
                  <input
                    type="text"
                    name="participant_name"
                    value={form.participant_name || ''}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                    readOnly={readOnly}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  name="consent_agree"
                  checked={form.consent_agree || false}
                  onChange={(e) => setForm(prev => ({ ...prev, consent_agree: e.target.checked }))}
                  className="w-5 h-5 text-orange-500 bg-slate-800 border border-white/10 rounded"
                  required
                  disabled={readOnly}
                />
                <span className="text-white">I have read and agree to the informed consent above.</span>
              </label>

              <div className="text-sm text-red-400">
                {form.consent_agree ? '' : 'You must check the box to proceed.'}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                disabled
                className="flex-1 px-4 py-3 rounded-lg font-bold transition-all bg-gray-600/50 text-gray-400 cursor-not-allowed"
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
          )}
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, name, type = 'text', value, onChange, readOnly = false, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, readOnly = false, gender = false }) => (
  <div>
    <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      disabled={readOnly}
      className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {gender ? (
        <>
          <option value="" className="text-black">Select Gender</option>
          <option value="Male" className="text-black">Male</option>
          <option value="Female" className="text-black">Female</option>
          <option value="Other" className="text-black">Other</option>
        </>
      ) : (
        <>
          <option value="" className="text-black">Select Blood Group</option>
          <option value="A+" className="text-black">A+</option>
          <option value="A-" className="text-black">A-</option>
          <option value="B+" className="text-black">B+</option>
          <option value="B-" className="text-black">B-</option>
          <option value="O+" className="text-black">O+</option>
          <option value="O-" className="text-black">O-</option>
          <option value="AB+" className="text-black">AB+</option>
          <option value="AB-" className="text-black">AB-</option>
        </>
      )}
    </select>
  </div>
);

export default EnquiryFormPage;

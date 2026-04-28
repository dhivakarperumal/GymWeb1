import React, { useState, useEffect } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const PTFormUser = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enquiry');
  const [enquiryData, setEnquiryData] = useState({});
  const [healthHistoryData, setHealthHistoryData] = useState({});
  const [healthHistory2Data, setHealthHistory2Data] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasEnquiry, setHasEnquiry] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      // Fetch user info
      const userRes = await api.get(`/users/${user.id}`);
      const userData = userRes.data;

      // Check if enquiry exists
      const enquiryRes = await api.get('/enquiries');
      const enquiries = enquiryRes.data || [];
      const userEnquiry = enquiries.find(e => e.email === user.email);

      if (userEnquiry) {
        setHasEnquiry(true);
        setEnquiryData(userEnquiry);
      } else {
        // Auto-fill enquiry with user data
        setEnquiryData({
          name: userData.username || '',
          email: user.email || '',
          phone: userData.mobile || '',
          // Add other fields as needed
        });
      }

      // TODO: Fetch existing PT form data if any

    } catch (err) {
      console.error('Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnquirySubmit = async (data) => {
    try {
      await api.post('/enquiries', data);
      setHasEnquiry(true);
      toast.success('Enquiry submitted successfully!');
    } catch (err) {
      console.error('Failed to submit enquiry', err);
      toast.error('Failed to submit enquiry');
    }
  };

  const handleHealthHistorySubmit = async (data) => {
    // TODO: Save health history data
    toast.success('Health History saved!');
  };

  const handleHealthHistory2Submit = async (data) => {
    // TODO: Save health history 2 data
    toast.success('Health History 2 saved!');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-red-500">PT Forms</h2>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('enquiry')}
          className={`py-2 px-4 ${activeTab === 'enquiry' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400'}`}
        >
          Enquiry Form
        </button>
        <button
          onClick={() => setActiveTab('health1')}
          className={`py-2 px-4 ${activeTab === 'health1' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400'}`}
        >
          Health History
        </button>
        <button
          onClick={() => setActiveTab('health2')}
          className={`py-2 px-4 ${activeTab === 'health2' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400'}`}
        >
          Health History 2
        </button>
      </div>

      {/* Content */}
      {activeTab === 'enquiry' && (
        <EnquiryForm
          data={enquiryData}
          onSubmit={handleEnquirySubmit}
          readOnly={hasEnquiry}
        />
      )}

      {activeTab === 'health1' && (
        <HealthHistoryForm
          data={healthHistoryData}
          onSubmit={handleHealthHistorySubmit}
        />
      )}

      {activeTab === 'health2' && (
        <HealthHistory2Form
          data={healthHistory2Data}
          onSubmit={handleHealthHistory2Submit}
        />
      )}
    </div>
  );
};

// Enquiry Form Component
const EnquiryForm = ({ data, onSubmit, readOnly }) => {
  const [formData, setFormData] = useState(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (formData.dob) {
      const age = dayjs().diff(dayjs(formData.dob), 'year');
      setFormData(prev => ({ ...prev, age: age >= 0 ? age.toString() : "" }));
    }
  }, [formData.dob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob || ''}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Blood Group</label>
                <select
                  name="blood_group"
                  value={formData.blood_group || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Employer</label>
                <input
                  type="text"
                  name="employer"
                  value={formData.employer || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">In Case of Emergency</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Relationship</label>
                <input
                  type="text"
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Home Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone_home"
                  value={formData.emergency_contact_phone_home || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Work Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone_work"
                  value={formData.emergency_contact_phone_work || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Contact Address</label>
              <textarea
                name="emergency_contact_address"
                value={formData.emergency_contact_address || ''}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Health & Goals */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Health & Fitness Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleChange}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">BMI</label>
                <input
                  type="text"
                  name="bmi"
                  value={formData.bmi || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-white/20 border border-white/20 rounded-lg text-orange-400 font-bold focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fitness Goals</label>
              <textarea
                name="fitness_goal"
                value={formData.fitness_goal || ''}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your fitness objectives..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
              <textarea
                name="message"
                value={formData.message || ''}
                onChange={handleChange}
                readOnly={readOnly}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!readOnly && (
            <button
              type="submit"
              className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-600/20 transition-all"
            >
              Submit Enquiry
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// Health History Form Component
const HealthHistoryForm = ({ data, onSubmit }) => {
  const [form, setForm] = useState(data);

  React.useEffect(() => {
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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
          {/* Medications */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4 text-white">Are you taking any medications?</p>
            <div className="flex gap-8 mb-5">
              <label>
                <input
                  type="radio"
                  name="medications"
                  value="Yes"
                  checked={form.medications === "Yes"}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="medications"
                  value="No"
                  checked={form.medications === "No"}
                  onChange={handleChange}
                /> No
              </label>
            </div>
            <p className="text-orange-400 mb-4">If yes, complete the following</p>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="med1" value={form.med1 || ''} onChange={handleChange} placeholder="Name" className="input" />
              <input name="dose1" value={form.dose1 || ''} onChange={handleChange} placeholder="Dosage/Frequency" className="input" />
              <input name="reason1" value={form.reason1 || ''} onChange={handleChange} placeholder="Reason" className="input" />
              <input name="med2" value={form.med2 || ''} onChange={handleChange} placeholder="Name" className="input" />
              <input name="dose2" value={form.dose2 || ''} onChange={handleChange} placeholder="Dosage/Frequency" className="input" />
              <input name="reason2" value={form.reason2 || ''} onChange={handleChange} placeholder="Reason" className="input" />
              <input name="med3" value={form.med3 || ''} onChange={handleChange} placeholder="Name" className="input" />
              <input name="dose3" value={form.dose3 || ''} onChange={handleChange} placeholder="Dosage/Frequency" className="input" />
              <input name="reason3" value={form.reason3 || ''} onChange={handleChange} placeholder="Reason" className="input" />
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="block mb-2">Please list any allergies</label>
            <input
              name="allergies"
              value={form.allergies || ''}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          {/* Surgeries */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4">Have you undergone any major surgeries/major accidents?</p>
            <input name="surgeries1" value={form.surgeries1 || ''} placeholder="1." onChange={handleChange} className="input w-full mb-3" />
            <input name="surgeries2" value={form.surgeries2 || ''} placeholder="2." onChange={handleChange} className="input w-full mb-3" />
            <input name="surgeries3" value={form.surgeries3 || ''} placeholder="3." onChange={handleChange} className="input w-full" />
          </div>

          {/* Exercise Program */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="mb-4">Are you currently involved in any exercise program?</p>
            <div className="flex gap-8 mb-6">
              <label>
                <input
                  type="radio"
                  name="exercise_program"
                  value="Yes"
                  checked={form.exercise_program === "Yes"}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="exercise_program"
                  value="No"
                  checked={form.exercise_program === "No"}
                  onChange={handleChange}
                /> No
              </label>
            </div>
            <p className="mb-4">Are you involved in recreational sports?</p>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="sport1" value={form.sport1 || ''} placeholder="1." onChange={handleChange} className="input" />
              <input name="sport4" value={form.sport4 || ''} placeholder="4." onChange={handleChange} className="input" />
              <input name="sport2" value={form.sport2 || ''} placeholder="2." onChange={handleChange} className="input" />
              <input name="sport5" value={form.sport5 || ''} placeholder="5." onChange={handleChange} className="input" />
              <input name="sport3" value={form.sport3 || ''} placeholder="3." onChange={handleChange} className="input" />
              <input name="sport6" value={form.sport6 || ''} placeholder="6." onChange={handleChange} className="input" />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-orange-400 font-bold mb-5">LIFESTYLE AND DIETARY FACTORS</h3>
            <p className="mb-4 font-semibold">Smoking and Alcohol Consumption</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label>Smoking</label>
                <select name="smoking" value={form.smoking || ''} onChange={handleChange} className="input w-full mt-2">
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div>
                <label>Alcohol</label>
                <select name="alcohol" value={form.alcohol || ''} onChange={handleChange} className="input w-full mt-2">
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block mb-3">Food Preference</label>
              <div className="flex gap-8">
                <label>
                  <input type="radio" name="food_preference" value="Veg" checked={form.food_preference === "Veg"} onChange={handleChange} /> Veg
                </label>
                <label>
                  <input type="radio" name="food_preference" value="Non-Veg" checked={form.food_preference === "Non-Veg"} onChange={handleChange} /> Non-Veg
                </label>
              </div>
            </div>
            <div className="mt-6">
              <label className="block mb-3">Do you take dietary supplements?</label>
              <div className="flex gap-8">
                <label>
                  <input type="radio" name="supplements" value="Yes" checked={form.supplements === "Yes"} onChange={handleChange} /> Yes
                </label>
                <label>
                  <input type="radio" name="supplements" value="No" checked={form.supplements === "No"} onChange={handleChange} /> No
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold">
            Save Health History
          </button>
        </form>

        <style jsx>{`
          .input {
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,255,255,.2);
            padding: 12px;
            border-radius: 10px;
            width: 100%;
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
};

// Health History 2 Form Component
const HealthHistory2Form = ({ data, onSubmit }) => {
  const questions = [
    "Heart Attack",
    "Heart bypass or any other cardiac surgery",
    "Chest discomfort with Digine",
    "Palpitation",
    "Epilepsy",
    "Fainting or dizziness or loss of consciousness",
    "Hypertension (High blood pressure)",
    "Family history of heart disease (Male < 55 yrs & Female < 65 yrs)",
    "Rheumatic fever",
    "Shortness of breath with or without exercise",
    "Any Breathing difficulties / Wheezing / Asthma",
    "High blood cholesterol (lipid)",
    "Diabetes or impaired blood sugar",
    "Stroke",
    "Recent hospitalization / other medical conditions",
    "Orthopedic problem (including arthritis)"
  ];

  const [form, setForm] = useState(data);

  React.useEffect(() => {
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
    }
  }, [data]);

  const handleRadio = (name, val) => {
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-white/80 mb-6">Please fill out all information requested below</p>
            <div className="space-y-4">
              {questions.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center border-b border-white/10 pb-3">
                  <div className="col-span-7 md:col-span-8 text-sm md:text-base">{index + 1}. {item}</div>
                  <div className="col-span-5 md:col-span-4 flex gap-6 justify-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${index}`}
                        checked={form[`q${index}`] === "Yes"}
                        onChange={() => handleRadio(`q${index}`, "Yes")}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${index}`}
                        checked={form[`q${index}`] === "No"}
                        onChange={() => handleRadio(`q${index}`, "No")}
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

          {/* Medical Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-orange-400 font-bold text-xl mb-6">Medical Information</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2">Blood Pressure</label>
                <input name="bp" value={form.bp || ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block mb-2">Blood Sugar</label>
                <input name="sugar" value={form.sugar || ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block mb-2">Blood Cholesterol</label>
                <input name="cholesterol" value={form.cholesterol || ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block mb-2">Thyroid Level</label>
                <input name="thyroid" value={form.thyroid || ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block mb-2">Blood Uric Acid</label>
                <input name="uric" value={form.uric || ''} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block mb-2">Serum 3D</label>
                <input name="serum3d" value={form.serum3d || ''} onChange={handleChange} className="input" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold">
            Save Health History 2
          </button>
        </form>

        <style jsx>{`
          .input {
            width: 100%;
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,255,255,.2);
            padding: 12px;
            border-radius: 10px;
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PTFormUser;
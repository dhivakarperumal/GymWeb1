import React, { useEffect, useState } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import EnquiryFormPage from './PTFormPages/EnquiryFormPage';
import HealthHistoryPage from './PTFormPages/HealthHistoryPage';
import HealthHistory2Page from './PTFormPages/HealthHistory2Page';
import FitnessScreening from '../Admin/PTForm/FitnessScreening';
import FlexibilityAndMeasurements from '../Admin/PTForm/FlexibilityAndMeasurements';

const PTFormUser = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enquiry');
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasEnquiry, setHasEnquiry] = useState(false);

  useEffect(() => {
    fetchUserFormData();
  }, [user]);

  const safeParse = (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const buildInitialForm = (userData, memberData) => ({
    name: memberData?.name || userData.username || '',
    email: userData.email || '',
    phone: memberData?.phone || userData.mobile || '',
    dob: memberData?.dob || '',
    age: memberData?.age || '',
    blood_group: memberData?.blood_group || '',
    gender: memberData?.gender || '',
    address: memberData?.address || '',
    employer: memberData?.employer || '',
    occupation: memberData?.occupation || '',
    emergency_contact_name: memberData?.emergency_contact_name || '',
    emergency_contact_relationship: memberData?.emergency_contact_relationship || '',
    emergency_contact_address: memberData?.emergency_contact_address || '',
    emergency_contact_phone_home: memberData?.emergency_contact_phone_home || '',
    emergency_contact_phone_work: memberData?.emergency_contact_phone_work || '',
    fitness_goal: memberData?.fitness_goal || '',
    message: memberData?.message || '',
    height: memberData?.height || '',
    weight: memberData?.weight || '',
    bmi: memberData?.bmi || '',
    medications: memberData?.medications || '',
    med1: memberData?.med1 || '',
    dose1: memberData?.dose1 || '',
    reason1: memberData?.reason1 || '',
    med2: memberData?.med2 || '',
    dose2: memberData?.dose2 || '',
    reason2: memberData?.reason2 || '',
    med3: memberData?.med3 || '',
    dose3: memberData?.dose3 || '',
    reason3: memberData?.reason3 || '',
    allergies: memberData?.allergies || '',
    surgeries1: memberData?.surgeries1 || '',
    surgeries2: memberData?.surgeries2 || '',
    surgeries3: memberData?.surgeries3 || '',
    exercise_program: memberData?.exercise_program || '',
    sport1: memberData?.sport1 || '',
    sport2: memberData?.sport2 || '',
    sport3: memberData?.sport3 || '',
    sport4: memberData?.sport4 || '',
    sport5: memberData?.sport5 || '',
    sport6: memberData?.sport6 || '',
    smoking: memberData?.smoking || '',
    alcohol: memberData?.alcohol || '',
    food_preference: memberData?.food_preference || '',
    supplements: memberData?.supplements || '',
    bp: memberData?.bp || '',
    sugar: memberData?.sugar || '',
    cholesterol: memberData?.cholesterol || '',
    thyroid: memberData?.thyroid || '',
    uric: memberData?.uric || '',
    serum3d: memberData?.serum3d || '',
    ...memberData,
  });

  const fetchUserFormData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [memberRes, enquiryRes] = await Promise.allSettled([
        api.get(`/members/user/${user.id}`),
        api.get('/enquiries'),
      ]);

      let memberData = null;
      if (memberRes.status === 'fulfilled' && memberRes.value.data) {
        const fetchedMember = memberRes.value.data;
        memberData = fetchedMember.source === 'member' ? fetchedMember : null;
        setMember(memberData);
      }

      const enquiries =
        enquiryRes.status === 'fulfilled' && Array.isArray(enquiryRes.value.data)
          ? enquiryRes.value.data
          : [];
      const userEnquiry = enquiries.find((entry) => entry.email === user.email);
      setHasEnquiry(!!userEnquiry);

      let initialForm = buildInitialForm(user, memberData);
      if (memberData?.id) {
        try {
          const ptRes = await api.get(`/pt-forms/${memberData.id}`);
          if (ptRes.data && ptRes.data.form_data) {
            const savedData = safeParse(ptRes.data.form_data);
            initialForm = { ...initialForm, ...savedData };
            if (!hasEnquiry) {
              setHasEnquiry(!!savedData.name || !!savedData.email);
            }
          }
        } catch (error) {
          // no saved PT form available
        }
      }

      setFormData(initialForm);
    } catch (err) {
      console.error('Failed to load PT form data', err);
    } finally {
      setLoading(false);
    }
  };

  const savePtForm = async (updatedData) => {
    if (!member?.id) {
      toast.error('Unable to save health history: gym member record not linked.');
      return;
    }

    try {
      await api.post('/pt-forms', {
        member_id: member.id,
        user_id: user.id,
        formData: updatedData,
      });
      setFormData(updatedData);
      toast.success('Health data saved successfully.');
    } catch (err) {
      console.error('Failed to save PT form', err);
      toast.error('Failed to save health history.');
    }
  };

  const handleEnquirySubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      if (!hasEnquiry) {
        await api.post('/enquiries', data);
        setHasEnquiry(true);
      }

      if (member?.id) {
        await api.post('/pt-forms', {
          member_id: member.id,
          user_id: user.id,
          formData: updatedData,
        });
      }
      toast.success('Enquiry saved successfully.');
    } catch (err) {
      console.error('Enquiry submit failed', err);
      toast.error('Failed to save enquiry.');
    }
  };

  const handleHealthHistorySubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
  };

  const handleHealthHistory2Submit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
  };

  if (loading) {
    return <div className="text-center py-8">Loading PT form data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-red-500">PT Forms</h2>
      {!member?.id && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
          Your account is not yet linked to a gym member record. Enquiry can still be recorded, but health history data requires a linked member.
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-b border-white/10 pb-4">
        {[
          { key: 'enquiry', label: 'Enquiry Form' },
          { key: 'health1', label: 'Health History' },
          { key: 'health2', label: 'Health History 2' },
          { key: 'fitness', label: 'Fitness Screening' },
          { key: 'flexibility', label: 'Flexibility & Measurements' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 rounded-md transition ${
              activeTab === tab.key
                ? 'border-b-2 border-red-500 text-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'enquiry' && (
        <EnquiryFormPage
          data={formData}
          onSubmit={handleEnquirySubmit}
          readOnly={hasEnquiry}
        />
      )}

      {activeTab === 'health1' && (
        <HealthHistoryPage data={formData} onSubmit={handleHealthHistorySubmit} />
      )}

      {activeTab === 'health2' && (
        <HealthHistory2Page data={formData} onSubmit={handleHealthHistory2Submit} />
      )}

      {activeTab === 'fitness' && (
        <FitnessScreening
          formData={formData}
          readOnly
        />
      )}

      {activeTab === 'flexibility' && (
        <FlexibilityAndMeasurements
          formData={formData}
          readOnly
        />
      )}
    </div>
  );
};

export default PTFormUser;

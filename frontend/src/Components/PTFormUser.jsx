import React, { useEffect, useState } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { AlertTriangle, X } from 'lucide-react';
import EnquiryFormPage from './PTFormPages/EnquiryFormPage';
import HealthHistoryPage from './PTFormPages/HealthHistoryPage';
import HealthHistory2Page from './PTFormPages/HealthHistory2Page';
import FitnessScreening from '../Admin/PTForm/FitnessScreening';
import FlexibilityAndMeasurements from '../Admin/PTForm/FlexibilityAndMeasurements';
import SessionTracker from '../Admin/PTForm/SessionTracker';

const PTFormUser = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enquiry');
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasEnquiry, setHasEnquiry] = useState(false);
  const [isPtExpired, setIsPtExpired] = useState(false);
  const [ptExpiredAlert, setPtExpiredAlert] = useState(false);

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

  // Only Tab 1 (Enquiry/Personal Details) fields
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

      // Check if PT plan is expired
      const ptExpired =
        memberData?.pt_expiry_date &&
        dayjs(memberData.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;
      setIsPtExpired(!!ptExpired);

      // Fetch Trainer Assignment
      let trainerName = "";
      try {
        const assignRes = await api.get("/assignments");
        const allAssignments = Array.isArray(assignRes.data) ? assignRes.data : [];
        const myAssignment = allAssignments.find(a => 
          String(a.userId) === String(user.id) ||
          (a.userEmail && user.email && a.userEmail.toLowerCase() === user.email.toLowerCase())
        );
        if (myAssignment) {
          trainerName = myAssignment.trainerName || myAssignment.trainer_name || "";
        }
      } catch (err) {
        console.error("Failed to fetch assignment in PTFormUser", err);
      }

      // Build Tab 1 only base form
      let initialForm = buildInitialForm(user, memberData);
      initialForm.trainer_name_assigned = trainerName;

      if (memberData?.id) {
        try {
          const ptRes = await api.get(`/pt-forms/${memberData.id}`);
          if (ptRes.data && ptRes.data.form_data && memberData.pt_form_completed) {
            const savedData = safeParse(ptRes.data.form_data);

            if (ptExpired) {
              // PT plan expired — only merge Tab 1 fields from saved data, discard everything else
              const tab1Fields = [
                'name', 'email', 'phone', 'dob', 'age', 'blood_group', 'gender',
                'address', 'employer', 'occupation',
                'emergency_contact_name', 'emergency_contact_relationship',
                'emergency_contact_address', 'emergency_contact_phone_home',
                'emergency_contact_phone_work', 'fitness_goal', 'message',
                'height', 'weight', 'bmi', 'trainer_name_assigned',
                'participant_name', 'consent_agree', 'consent_signature',
                'consent_date', 'guardian_signature', 'witness',
              ];
              const tab1Only = {};
              tab1Fields.forEach(key => {
                if (savedData[key] !== undefined && savedData[key] !== null && savedData[key] !== '') {
                  tab1Only[key] = savedData[key];
                }
              });
              initialForm = { ...initialForm, ...tab1Only };

              // Reset backend PT form (clear form_data + pt_form_completed flag)
              try {
                await api.delete(`/pt-forms/${memberData.id}/reset`);
              } catch (resetErr) {
                console.log('Could not reset PT form on backend', resetErr);
              }

              toast('Your PT plan has expired. Health & fitness data has been cleared for a fresh session.', {
                icon: '⚠️',
                duration: 4000,
              });
              setPtExpiredAlert(true);
            } else {
              // PT plan active — merge all saved data as before
              initialForm = { ...initialForm, ...savedData };
              if (!hasEnquiry) {
                setHasEnquiry(!!savedData.name || !!savedData.email);
              }
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
      if (member?.id) {
        // Update gym_members table
        await api.put(`/members/${member.id}`, { ...member, ...data });

        // Update pt_forms table
        await api.post('/pt-forms', {
          member_id: member.id,
          user_id: user.id,
          formData: updatedData,
        });
      } else {
        if (!hasEnquiry) {
          await api.post('/enquiries', data);
          setHasEnquiry(true);
        }
      }
      toast.success('Personal details saved successfully.');
      setActiveTab('health1');
    } catch (err) {
      console.error('Submit failed', err);
      toast.error(err.response?.data?.error || 'Failed to save personal details.');
    }
  };

  const handleHealthHistorySubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
    setActiveTab('health2');
  };

  const handleHealthHistory2Submit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
    setActiveTab('fitness');
  };

  const handleFitnessSubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
    setActiveTab('flexibility');
  };

  const handleFlexibilitySubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    await savePtForm(updatedData);
    setActiveTab('sessions');
  };

  if (loading) {
    return <div className="text-center py-8">Loading PT form data...</div>;
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <h2 className="text-xl font-bold text-red-500">PT Forms</h2>

      {/* No member linked warning */}
      {!member?.id && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100 text-sm">
          Your account is not yet linked to a gym member record. Enquiry can still be recorded, but health history data requires a linked member.
        </div>
      )}

      {/* PT Plan Expired Alert Banner */}
      {ptExpiredAlert && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-orange-500/40 bg-orange-500/10">
          <AlertTriangle className="text-orange-400 mt-0.5 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-orange-300 font-semibold text-sm">PT Plan Expired</p>
            <p className="text-orange-200/80 text-xs mt-0.5 leading-relaxed">
              Your PT plan has expired. All previous health &amp; fitness form data has been cleared.
              Only your personal details have been retained. Please fill in the form again for your new session.
            </p>
          </div>
          <button
            onClick={() => setPtExpiredAlert(false)}
            className="text-orange-400/60 hover:text-orange-300 transition shrink-0 mt-0.5"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-0 overflow-x-auto -mx-2 px-2">
        {[
          { key: 'enquiry',     label: 'Enquiry Form' },
          { key: 'health1',     label: 'Health History' },
          { key: 'health2',     label: 'Health History 2' },
          { key: 'fitness',     label: 'Fitness Screening' },
          { key: 'flexibility', label: 'Flexibility & Measurements' },
          { key: 'sessions',    label: 'Session Tracker' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 py-2.5 px-4 text-sm font-medium border-b-2 transition-all duration-150 ${
              activeTab === tab.key
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
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
          readOnly={false}
        />
      )}

      {activeTab === 'health1' && (
        <HealthHistoryPage
          data={formData}
          onSubmit={handleHealthHistorySubmit}
          onPrevious={() => setActiveTab('enquiry')}
        />
      )}

      {activeTab === 'health2' && (
        <HealthHistory2Page
          data={formData}
          onSubmit={handleHealthHistory2Submit}
          onPrevious={() => setActiveTab('health1')}
        />
      )}

      {activeTab === 'fitness' && (
        <FitnessScreening
          formData={formData}
          readOnly={false}
          onNext={handleFitnessSubmit}
          onPrevious={() => setActiveTab('health2')}
          saveOnly={false}
        />
      )}

      {activeTab === 'flexibility' && (
        <FlexibilityAndMeasurements
          formData={formData}
          readOnly={false}
          onNext={handleFlexibilitySubmit}
          onPrevious={() => setActiveTab('fitness')}
          saveOnly={false}
        />
      )}

      {activeTab === 'sessions' && (
        <SessionTracker
          formData={formData}
          onNext={() => {}}
          onPrevious={() => {}}
          isFirstStep={true}
          isLastStep={true}
          readOnly={false}
          userMode={true}
          hideFooter
          onSaved={(updated) => setFormData(updated)}
        />
      )}
    </div>
  );
};

export default PTFormUser;

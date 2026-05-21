import React, { useEffect, useState } from "react";
import DietChart from "../WorkoutsDiet/DietChart";
import Workouts from "../WorkoutsDiet/Workouts";
import UserOrders from "./UserOrders";
import UserAddresses from "./UserAddresses";
import UserNotifications from "./UserNotifications"; // Added
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import MemberSBuyPlans from "../WorkoutsDiet/MemberBuyPlans";
import cache from "../cache";
import PTFormUser from "./PTFormUser";
import { toast } from "react-hot-toast";
import { Shield, Key, Eye, EyeOff, CalendarCheck, User, Mail, Phone, Menu, X, Home, ChevronLeft } from "lucide-react";


const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "personal"
  );

  const [userInfo, setUserInfo] = useState({});
  const [userEnquiry, setUserEnquiry] = useState(null);
  const [enquiryEditMode, setEnquiryEditMode] = useState(false);
  const [enquiryFormData, setEnquiryFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    age: "",
    blood_group: "",
    gender: "",
    address: "",
    employer: "",
    occupation: "",
    fitness_goal: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_address: "",
    emergency_contact_phone_home: "",
    emergency_contact_phone_work: "",
    participant_name: "",
    consent_agree: false,
    consent_signature: "",
    consent_date: "",
    guardian_signature: "",
    witness: "",
    plan_name: "",
    plan_duration: "",
  });
  const [savingEnquiry, setSavingEnquiry] = useState(false);
  const [plans, setPlans] = useState([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ================= FETCH USER INFO ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      if (cache.userInfo) {
        setUserInfo(cache.userInfo);
      }
      try {
        const res = await api.get(`/users/${userId}`);
        const data = res.data || {};
        setUserInfo(data);
        cache.userInfo = data;
      } catch (err) {
        console.error("failed to fetch user info", err);
      }
    };

    fetchUser();
  }, [userId]);

  /* ================= FETCH USER PLANS ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      if (cache.userPlans) {
        setPlans(cache.userPlans);
        const active = cache.userPlans.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      }
      try {
        const res = await api.get(`/memberships/user/${userId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlans(list);
        cache.userPlans = list;
        const active = list.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      } catch (err) {
        console.error("failed to fetch user plans", err);
      }
    };

    fetchPlans();
  }, [userId]);

  useEffect(() => {
    if (!user?.email && !user?.mobile) return;

    const fetchUserEnquiry = async () => {
      try {
        const res = await api.get('/enquiries');
        const list = Array.isArray(res.data) ? res.data : [];
        const match = list.find((entry) => {
          if (!entry) return false;
          const emailMatch = entry.email && user.email && entry.email.toLowerCase() === user.email.toLowerCase();
          const phoneMatch = entry.phone && user.mobile && entry.phone === user.mobile;
          return emailMatch || phoneMatch;
        });

        if (match) {
          setUserEnquiry(match);
          setEnquiryFormData({
            name: match.name || "",
            email: match.email || "",
            phone: match.phone || "",
            dob: formatEnquiryDob(match.dob),
            age: match.age || "",
            blood_group: match.blood_group || "",
            gender: match.gender || "",
            address: match.address || "",
            employer: match.employer || "",
            occupation: match.occupation || "",
            fitness_goal: match.fitness_goal || "",
            emergency_contact_name: match.emergency_contact_name || "",
            emergency_contact_relationship: match.emergency_contact_relationship || "",
            emergency_contact_address: match.emergency_contact_address || "",
            emergency_contact_phone_home: match.emergency_contact_phone_home || "",
            emergency_contact_phone_work: match.emergency_contact_phone_work || "",
            participant_name: getConsent(match.consent_data)?.participant_name || match.name || "",
            consent_agree: getConsent(match.consent_data)?.agree || false,
            consent_signature: getConsent(match.consent_data)?.signature || "",
            consent_date: getConsent(match.consent_data)?.date || "",
            guardian_signature: getConsent(match.consent_data)?.guardian_signature || "",
            witness: getConsent(match.consent_data)?.witness || "",
            plan_name: match.plan_name || "",
            plan_duration: match.plan_duration || "",
          });
        } else {
          setUserEnquiry(null);
        }
      } catch (err) {
        console.error('Failed to fetch user enquiry', err);
      }
    };

    fetchUserEnquiry();
  }, [user?.email, user?.mobile]);

  const formatEnquiryDob = (dob) => {
    if (!dob) return "";
    const parts = dob.split('-');
    if (parts.length !== 3) return dob;
    if (parts[0].length === 4) return dob;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getConsent = (consent_data) => {
    if (!consent_data) return {};
    if (typeof consent_data === 'string') {
      try {
        return JSON.parse(consent_data);
      } catch (err) {
        return {};
      }
    }
    return consent_data;
  };

  const buildEnquiryPayload = () => {
    const consentPayload = {
      participant_name: enquiryFormData.participant_name,
      agree: enquiryFormData.consent_agree,
      signature: enquiryFormData.consent_signature,
      date: enquiryFormData.consent_date,
      guardian_signature: enquiryFormData.guardian_signature,
      witness: enquiryFormData.witness,
    };

    return {
      name: enquiryFormData.name,
      email: enquiryFormData.email,
      phone: enquiryFormData.phone,
      subject: userEnquiry?.subject || null,
      message: userEnquiry?.message || null,
      location: userEnquiry?.location || null,
      dob: enquiryFormData.dob || null,
      age: enquiryFormData.age || null,
      address: enquiryFormData.address || null,
      employer: enquiryFormData.employer || null,
      occupation: enquiryFormData.occupation || null,
      emergency_contact_name: enquiryFormData.emergency_contact_name || null,
      emergency_contact_relationship: enquiryFormData.emergency_contact_relationship || null,
      emergency_contact_address: enquiryFormData.emergency_contact_address || null,
      emergency_contact_phone_home: enquiryFormData.emergency_contact_phone_home || null,
      emergency_contact_phone_work: enquiryFormData.emergency_contact_phone_work || null,
      fitness_goal: enquiryFormData.fitness_goal || null,
      blood_group: enquiryFormData.blood_group || null,
      height: userEnquiry?.height || null,
      weight: userEnquiry?.weight || null,
      bmi: userEnquiry?.bmi || null,
      gender: enquiryFormData.gender || null,
      plan_name: enquiryFormData.plan_name || null,
      plan_duration: enquiryFormData.plan_duration || null,
      status: userEnquiry?.status || 'pending',
      termsAccepted: userEnquiry?.terms_accepted === 1 || userEnquiry?.termsAccepted || false,
      consent_data: consentPayload,
      trainer_id: userEnquiry?.trainer_id || null,
      trainer_name: userEnquiry?.trainer_name || null,
    };
  };

  const handleSaveEnquiryEdits = async () => {
    if (!userEnquiry?.id) return;
    setSavingEnquiry(true);
    try {
      const payload = buildEnquiryPayload();
      const res = await api.put(`/enquiries/${userEnquiry.id}`, payload);
      const updated = res.data;
      setUserEnquiry(updated);
      setEnquiryFormData({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        dob: formatEnquiryDob(updated.dob),
        age: updated.age || "",
        blood_group: updated.blood_group || "",
        gender: updated.gender || "",
        address: updated.address || "",
        employer: updated.employer || "",
        occupation: updated.occupation || "",
        fitness_goal: updated.fitness_goal || "",
        emergency_contact_name: updated.emergency_contact_name || "",
        emergency_contact_relationship: updated.emergency_contact_relationship || "",
        emergency_contact_address: updated.emergency_contact_address || "",
        emergency_contact_phone_home: updated.emergency_contact_phone_home || "",
        emergency_contact_phone_work: updated.emergency_contact_phone_work || "",
        participant_name: getConsent(updated.consent_data)?.participant_name || updated.name || "",
        consent_agree: getConsent(updated.consent_data)?.agree || false,
        consent_signature: getConsent(updated.consent_data)?.signature || "",
        consent_date: getConsent(updated.consent_data)?.date || "",
        guardian_signature: getConsent(updated.consent_data)?.guardian_signature || "",
        witness: getConsent(updated.consent_data)?.witness || "",
        plan_name: updated.plan_name || "",
        plan_duration: updated.plan_duration || "",
      });
      setEnquiryEditMode(false);
      toast.success('Join details updated successfully.');
    } catch (err) {
      console.error('Failed to update enrolment details', err);
      toast.error(err.response?.data?.error || 'Unable to update join details.');
    } finally {
      setSavingEnquiry(false);
    }
  };

  const renderEnquiryDetailRow = (label, value) => {
    if (!value) return null;
    return (
      <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-white text-sm">{value}</p>
      </div>
    );
  };

  /* ================= SIDEBAR ================= */

  const tabs = [
    { key: "personal", label: "Personal Details", icon: User },
    { key: "plans", label: "My Plans", icon: CalendarCheck },
    ...(hasActivePlan
      ? [
        { key: "diet", label: "Diet Chart", icon: Shield },
        { key: "workouts", label: "Workouts", icon: Key },
        { key: "ptform", label: "PT Form", icon: CalendarCheck },
      ]
      : []),
    { key: "orders", label: "My Orders", icon: CalendarCheck },
    { key: "address", label: "Address", icon: Home },
    { key: "notifications", label: "Notifications", icon: CalendarCheck },
    { key: "security", label: "Set Password", icon: Key },
  ];

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 bg-linear-to-r from-gray-900 to-black border border-red-500/10 rounded-2xl sm:rounded-3xl">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  <span className="text-2xl sm:text-3xl font-black text-white uppercase">
                    {userInfo.username?.[0] || userInfo.email?.[0] || "?"}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                    {userInfo.username || userInfo.full_name || "User Profile"}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Member since {new Date(userInfo.created_at).toLocaleDateString()}
                    </span>
                    {userInfo.id && (
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold uppercase">
                        DB ID: #{userInfo.id}
                      </span>
                    )}

                    {userInfo.member_id && (
                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] font-bold uppercase text-red-400">
                        Member ID: #{userInfo.member_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { label: "Internal ID", value: userInfo.id ? `#${userInfo.id}` : null, icon: Shield },
                  { label: "Member ID", value: userInfo.member_id ? `#${userInfo.member_id}` : "Not a Gym Member", icon: User },
                  { label: "Username", value: userInfo.username, icon: User },
                  { label: "Email Address", value: userInfo.email, icon: Mail },
                  { label: "Phone Number", value: userInfo.mobile, icon: Phone },
                  { label: "Account Role", value: userInfo.role, icon: Shield },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-red-500/20 transition-all group">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-black/40 rounded-lg sm:rounded-xl group-hover:text-red-500 transition-colors shrink-0">
                        <item.icon size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-white font-medium wrap-break-word text-sm sm:text-base">{item.value || "Not Provided"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Badge */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl gap-4">
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Account Status</h4>
                  <p className="text-gray-500 text-xs">Your account is currently {userInfo.status || "active"}</p>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  userInfo.status === "inactive" ? "bg-gray-500/20 text-gray-500" : "bg-green-500/20 text-green-500"
                }`}>
                  {userInfo.status || "Active"}
                </div>
              </div>

              <div className="mt-8 bg-gray-900/50 border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">Join Now Details</h3>
                    <p className="text-sm text-gray-400">Your enquiry form data is visible here and can be updated from this page.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!userEnquiry) {
                        navigate('/userenquiry');
                        return;
                      }
                      setEnquiryEditMode((prev) => !prev);
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
                  >
                    {userEnquiry ? (enquiryEditMode ? 'Cancel edit' : 'Edit details') : 'Complete join form'}
                  </button>
                </div>

                {userEnquiry ? (
                  enquiryEditMode ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Full Name
                          <input
                            value={enquiryFormData.name}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, name: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Email Address
                          <input
                            value={enquiryFormData.email}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, email: e.target.value })}
                            type="email"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Phone Number
                          <input
                            value={enquiryFormData.phone}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Date of Birth
                          <input
                            value={enquiryFormData.dob}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, dob: e.target.value })}
                            type="date"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Gender
                          <select
                            value={enquiryFormData.gender}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, gender: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                        <label className="block text-sm text-gray-300">
                          Blood Group
                          <input
                            value={enquiryFormData.blood_group}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, blood_group: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Employer
                          <input
                            value={enquiryFormData.employer}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, employer: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Occupation
                          <input
                            value={enquiryFormData.occupation}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, occupation: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300 md:col-span-2">
                          Address
                          <textarea
                            value={enquiryFormData.address}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, address: e.target.value })}
                            rows={3}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Emergency Contact Name
                          <input
                            value={enquiryFormData.emergency_contact_name}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, emergency_contact_name: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Emergency Relationship
                          <input
                            value={enquiryFormData.emergency_contact_relationship}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, emergency_contact_relationship: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Emergency Phone
                          <input
                            value={enquiryFormData.emergency_contact_phone_home}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, emergency_contact_phone_home: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Secondary Contact
                          <input
                            value={enquiryFormData.emergency_contact_phone_work}
                            onChange={(e) => setEnquiryFormData({ ...enquiryFormData, emergency_contact_phone_work: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <label className="block text-sm text-gray-300">
                        Fitness Goal
                        <textarea
                          value={enquiryFormData.fitness_goal}
                          onChange={(e) => setEnquiryFormData({ ...enquiryFormData, fitness_goal: e.target.value })}
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                        />
                      </label>

                      <button
                        onClick={handleSaveEnquiryEdits}
                        disabled={savingEnquiry}
                        className="w-full rounded-2xl bg-linear-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingEnquiry ? 'Saving...' : 'Save Join Details'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderEnquiryDetailRow('Full Name', userEnquiry.name)}
                      {renderEnquiryDetailRow('Email', userEnquiry.email)}
                      {renderEnquiryDetailRow('Phone', userEnquiry.phone)}
                      {renderEnquiryDetailRow('Date of Birth', userEnquiry.dob)}
                      {renderEnquiryDetailRow('Age', userEnquiry.age)}
                      {renderEnquiryDetailRow('Gender', userEnquiry.gender)}
                      {renderEnquiryDetailRow('Blood Group', userEnquiry.blood_group)}
                      {renderEnquiryDetailRow('Address', userEnquiry.address)}
                      {renderEnquiryDetailRow('Employer', userEnquiry.employer)}
                      {renderEnquiryDetailRow('Occupation', userEnquiry.occupation)}
                      {renderEnquiryDetailRow('Fitness Goal', userEnquiry.fitness_goal)}
                      {renderEnquiryDetailRow('Emergency Contact', userEnquiry.emergency_contact_name)}
                      {renderEnquiryDetailRow('Relationship', userEnquiry.emergency_contact_relationship)}
                      {renderEnquiryDetailRow('Emergency Phone', userEnquiry.emergency_contact_phone_home)}
                      {renderEnquiryDetailRow('Secondary Phone', userEnquiry.emergency_contact_phone_work)}
                    </div>
                  )
                ) : (
                  <p className="text-gray-400">You have not submitted your join enquiry yet. Click the button above to fill the form.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "address":
        return <UserAddresses />;

      case "orders":
        return <UserOrders />;

      case "plans":
        return <MemberSBuyPlans preFetchedPlans={plans} />

      case "diet":
        return hasActivePlan ? (
          <DietChart planId={plans[0]?.planId} />
        ) : (
          <p className="text-gray-400">
            No active plan for diet chart.
          </p>
        );

      case "ptform":
        return <PTFormUser />;

      case "workouts":
        return <Workouts />;

      case "notifications":
        return <UserNotifications 
          userEmail={userInfo.email} 
          userId={userInfo.id} 
          memberId={userInfo.member_id} 
        />;

      case "security":
        return (
          <div className="flex justify-center w-full py-4 px-2 sm:px-4">
            <div className="max-w-md w-full space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl sm:rounded-2xl">
                  <Shield className="text-red-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Security Settings</h2>
                  <p className="text-xs sm:text-sm text-gray-400">Manage your account security and password</p>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-red-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Old Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!newPassword || !confirmPassword) {
                      toast.error("Please fill all fields");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast.error("Passwords do not match");
                      return;
                    }
                    if (newPassword.length < 6) {
                      toast.error("Password must be at least 6 characters");
                      return;
                    }

                    setLoading(true);
                    try {
                      await api.post("/auth/set-password", {
                        userId: user.id,
                        oldPassword,
                        newPassword
                      });
                      toast.success("Password updated successfully!");
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to update password");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-linear-to-r from-red-600 to-orange-600 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ================= LAYOUT ================= */

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pt-[90px] lg:pt-[80px]">
      {/* HEADER */}
      <header className="relative z-20 bg-black/95 backdrop-blur-xl border-b border-red-500/20 px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            {sidebarOpen ? <X size={20} className="text-red-500" /> : <Menu size={20} className="text-red-500" />}
          </button>

          {/* Back Button for Mobile */}
          {/* <button
            onClick={() => navigate(-1)}
            className="lg:hidden p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button> */}

          <h1 className="text-lg sm:text-xl font-bold text-white">My Account</h1>
        </div>

        {/* <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span>Welcome back,</span>
            <span className="text-red-500 font-medium">{userInfo.username || userInfo.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            Logout
          </button>
        </div> */}
      </header>

      {/* BODY */}
      <div className="flex flex-1 relative">
        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 top-24 lg:top-0 z-50 lg:z-20
          w-64 bg-gray-900/95 backdrop-blur-xl border-r border-red-500/20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:block
          pt-20 lg:pt-0
        `}>
          <div className="p-4 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6 text-white">Account Menu</h2>

            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all duration-200
                    ${activeTab === tab.key
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "hover:bg-red-500/10 text-gray-300 hover:text-white"
                    }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile User Info */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-xl lg:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white uppercase">
                    {userInfo.username?.[0] || userInfo.email?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{userInfo.username || "User"}</p>
                  <p className="text-xs text-gray-400">{userInfo.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;
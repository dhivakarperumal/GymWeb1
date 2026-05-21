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
  const [memberData, setMemberData] = useState(null);
  const [userEnquiry, setUserEnquiry] = useState(null);
  const [memberEditMode, setMemberEditMode] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    location: "",
    height: "",
    weight: "",
    bmi: "",
    dob: "",
    age: "",
    address: "",
    employer: "",
    occupation: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_address: "",
    emergency_contact_phone_home: "",
    emergency_contact_phone_work: "",
    fitness_goal: "",
    blood_group: "",
    gender: "",
    termsAccepted: false,
    participant_name: "",
    consent_agree: false,
    consent_signature: "",
    consent_date: "",
    guardian_signature: "",
    witness: "",
    plan_name: "",
    plan_duration: "",
  });
  const [savingMember, setSavingMember] = useState(false);
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

  /* ================= FETCH MEMBER DATA ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchMemberData = async () => {
      try {
        const res = await api.get(`/members/user/${userId}`);
        const data = res.data || null;
        if (data && (data.source === 'member' || data.member_id)) {
          setMemberData(data);
          setMemberFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            dob: data.dob || "",
            age: data.age || "",
            blood_group: data.blood_group || "",
            gender: data.gender || "",
            address: data.address || "",
            employer: data.employer || "",
            occupation: data.occupation || "",
            fitness_goal: data.fitness_goal || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_relationship: data.emergency_contact_relationship || "",
            emergency_contact_address: data.emergency_contact_address || "",
            emergency_contact_phone_home: data.emergency_contact_phone_home || "",
            emergency_contact_phone_work: data.emergency_contact_phone_work || "",
            plan_name: data.plan || "",
            plan_duration: data.duration || "",
          });
        } else {
          setMemberData(null);
        }
      } catch (err) {
        console.error('Failed to fetch member data', err);
        setMemberData(null);
      }
    };

    fetchMemberData();
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
          const consent = getConsent(match.consent_data);
          setMemberFormData({
            name: match.name || "",
            email: match.email || "",
            phone: match.phone || "",
            subject: match.subject || "",
            message: match.message || "",
            location: match.location || "",
            height: match.height || "",
            weight: match.weight || "",
            bmi: match.bmi || "",
            dob: formatEnquiryDob(match.dob) || "",
            age: match.age || "",
            address: match.address || "",
            employer: match.employer || "",
            occupation: match.occupation || "",
            emergency_contact_name: match.emergency_contact_name || "",
            emergency_contact_relationship: match.emergency_contact_relationship || "",
            emergency_contact_address: match.emergency_contact_address || "",
            emergency_contact_phone_home: match.emergency_contact_phone_home || "",
            emergency_contact_phone_work: match.emergency_contact_phone_work || "",
            fitness_goal: match.fitness_goal || "",
            blood_group: match.blood_group || "",
            gender: match.gender || "",
            termsAccepted: match.terms_accepted === 1 || match.termsAccepted || false,
            participant_name: consent.participant_name || match.name || "",
            consent_agree: consent.agree || false,
            consent_signature: consent.signature || "",
            consent_date: consent.date || "",
            guardian_signature: consent.guardian_signature || "",
            witness: consent.witness || "",
            plan_name: match.plan_name || "",
            plan_duration: match.plan_duration || "",
          });
        } else {
          setUserEnquiry(null);
        }
      } catch (err) {
        console.error('Failed to fetch user enquiry', err);
        setUserEnquiry(null);
      }
    };

    fetchUserEnquiry();
  }, [user?.email, user?.mobile]);

  useEffect(() => {
    if (userEnquiry) return;
    if (memberData) return;
    if (!userInfo) return;

    setMemberFormData((prev) => ({
      ...prev,
      name: prev.name || userInfo.username || userInfo.full_name || "",
      email: prev.email || userInfo.email || "",
      phone: prev.phone || userInfo.mobile || "",
    }));
  }, [userInfo, userEnquiry, memberData]);

  const handleSaveMemberEdits = async () => {
    if (!memberData?.id && !userEnquiry?.id) return;
    setSavingMember(true);

    const enquiryPayload = {
      name: memberFormData.name || memberData?.name || userInfo.username || "",
      email: memberFormData.email || memberData?.email || userInfo.email || "",
      phone: memberFormData.phone || memberData?.phone || userInfo.mobile || "",
      subject: memberFormData.subject || userEnquiry?.subject || null,
      message: memberFormData.message || userEnquiry?.message || null,
      location: memberFormData.location || userEnquiry?.location || null,
      dob: memberFormData.dob || memberData?.dob || null,
      age: memberFormData.age || memberData?.age || null,
      address: memberFormData.address || memberData?.address || null,
      employer: memberFormData.employer || memberData?.employer || null,
      occupation: memberFormData.occupation || memberData?.occupation || null,
      emergency_contact_name: memberFormData.emergency_contact_name || memberData?.emergency_contact_name || null,
      emergency_contact_relationship: memberFormData.emergency_contact_relationship || memberData?.emergency_contact_relationship || null,
      emergency_contact_address: memberFormData.emergency_contact_address || memberData?.emergency_contact_address || null,
      emergency_contact_phone_home: memberFormData.emergency_contact_phone_home || memberData?.emergency_contact_phone_home || null,
      emergency_contact_phone_work: memberFormData.emergency_contact_phone_work || memberData?.emergency_contact_phone_work || null,
      fitness_goal: memberFormData.fitness_goal || memberData?.fitness_goal || null,
      blood_group: memberFormData.blood_group || memberData?.blood_group || null,
      height: memberFormData.height || memberData?.height || null,
      weight: memberFormData.weight || memberData?.weight || null,
      bmi: memberFormData.bmi || memberData?.bmi || null,
      gender: memberFormData.gender || memberData?.gender || null,
      plan_name: memberFormData.plan_name || userEnquiry?.plan_name || memberData?.plan || null,
      plan_duration: memberFormData.plan_duration || userEnquiry?.plan_duration || memberData?.duration || null,
      status: userEnquiry?.status || 'pending',
      termsAccepted: memberFormData.termsAccepted || userEnquiry?.termsAccepted || false,
      consent_data: {
        participant_name: memberFormData.participant_name || userEnquiry?.participant_name || memberFormData.name || "",
        agree: memberFormData.consent_agree,
        signature: memberFormData.consent_signature,
        date: memberFormData.consent_date,
        guardian_signature: memberFormData.guardian_signature,
        witness: memberFormData.witness,
      },
      trainer_id: userEnquiry?.trainer_id || null,
      trainer_name: userEnquiry?.trainer_name || null,
    };

    const memberPayload = {
      name: memberFormData.name || memberData?.name,
      email: memberFormData.email || memberData?.email,
      phone: memberFormData.phone || memberData?.phone,
      gender: memberFormData.gender || memberData?.gender,
      height: memberFormData.height || memberData?.height,
      weight: memberFormData.weight || memberData?.weight,
      bmi: memberFormData.bmi || memberData?.bmi,
      plan: memberFormData.plan_name || memberData?.plan,
      duration: memberFormData.plan_duration || memberData?.duration,
      dob: memberFormData.dob || memberData?.dob,
      age: memberFormData.age || memberData?.age,
      address: memberFormData.address || memberData?.address,
      employer: memberFormData.employer || memberData?.employer,
      occupation: memberFormData.occupation || memberData?.occupation,
      emergency_contact_name: memberFormData.emergency_contact_name || memberData?.emergency_contact_name,
      emergency_contact_relationship: memberFormData.emergency_contact_relationship || memberData?.emergency_contact_relationship,
      emergency_contact_address: memberFormData.emergency_contact_address || memberData?.emergency_contact_address,
      emergency_contact_phone_home: memberFormData.emergency_contact_phone_home || memberData?.emergency_contact_phone_home,
      emergency_contact_phone_work: memberFormData.emergency_contact_phone_work || memberData?.emergency_contact_phone_work,
      fitness_goal: memberFormData.fitness_goal || memberData?.fitness_goal,
      blood_group: memberFormData.blood_group || memberData?.blood_group,
    };

    try {
      let updatedEnquiry = null;
      if (userEnquiry?.id) {
        const res = await api.put(`/enquiries/${userEnquiry.id}`, enquiryPayload);
        updatedEnquiry = res.data;
        setUserEnquiry(updatedEnquiry);
      }

      let updatedMember = memberData;
      if (memberData?.id) {
        const memberId = memberData.id || memberData.member_id;
        const res = await api.put(`/members/${memberId}`, memberPayload);
        updatedMember = res.data;
        setMemberData(updatedMember);
      }

      const merged = updatedEnquiry || updatedMember || {};
      setMemberFormData({
        name: merged.name || "",
        email: merged.email || "",
        phone: merged.phone || "",
        subject: merged.subject || memberFormData.subject || "",
        message: merged.message || memberFormData.message || "",
        location: merged.location || memberFormData.location || "",
        height: merged.height || memberFormData.height || "",
        weight: merged.weight || memberFormData.weight || "",
        bmi: merged.bmi || memberFormData.bmi || "",
        dob: merged.dob || memberFormData.dob || "",
        age: merged.age || memberFormData.age || "",
        address: merged.address || memberFormData.address || "",
        employer: merged.employer || memberFormData.employer || "",
        occupation: merged.occupation || memberFormData.occupation || "",
        emergency_contact_name: merged.emergency_contact_name || memberFormData.emergency_contact_name || "",
        emergency_contact_relationship: merged.emergency_contact_relationship || memberFormData.emergency_contact_relationship || "",
        emergency_contact_address: merged.emergency_contact_address || memberFormData.emergency_contact_address || "",
        emergency_contact_phone_home: merged.emergency_contact_phone_home || memberFormData.emergency_contact_phone_home || "",
        emergency_contact_phone_work: merged.emergency_contact_phone_work || memberFormData.emergency_contact_phone_work || "",
        fitness_goal: merged.fitness_goal || memberFormData.fitness_goal || "",
        blood_group: merged.blood_group || memberFormData.blood_group || "",
        gender: merged.gender || memberFormData.gender || "",
        termsAccepted: memberFormData.termsAccepted || false,
        participant_name: memberFormData.participant_name || "",
        consent_agree: memberFormData.consent_agree || false,
        consent_signature: memberFormData.consent_signature || "",
        consent_date: memberFormData.consent_date || "",
        guardian_signature: memberFormData.guardian_signature || "",
        witness: memberFormData.witness || "",
        plan_name: memberFormData.plan_name || merged.plan_name || merged.plan || "",
        plan_duration: memberFormData.plan_duration || merged.plan_duration || merged.duration || "",
      });

      setMemberEditMode(false);
      setUserInfo((prev) => ({
        ...prev,
        email: updatedMember?.email || updatedEnquiry?.email || prev.email,
        mobile: updatedMember?.phone || updatedEnquiry?.phone || prev.mobile,
        username: updatedMember?.name || updatedEnquiry?.name || prev.username,
      }));
      toast.success('Member details updated successfully.');
    } catch (err) {
      console.error('Failed to update member details', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Unable to save member details.');
    } finally {
      setSavingMember(false);
    }
  };

  const renderMemberDetailRow = (label, value) => {
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
                    <h3 className="text-xl font-bold uppercase text-white">Member Details</h3>
                    <p className="text-sm text-gray-400">If you are already a member, your gym profile is auto-filled here and can be edited directly.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!memberData) {
                        navigate('/userenquiry', {
                          state: {
                            prefilledUser: {
                              name: userInfo.username || userInfo.full_name || "",
                              email: userInfo.email || "",
                              phone: userInfo.mobile || ""
                            }
                          }
                        });
                        return;
                      }
                      setMemberEditMode((prev) => !prev);
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
                  >
                    {memberData ? (memberEditMode ? 'Cancel edit' : 'Edit details') : 'Complete join form'}
                  </button>
                </div>

                {memberData || userEnquiry ? (
                  memberEditMode ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Full Name
                          <input
                            value={memberFormData.name}
                            onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Email Address
                          <input
                            value={memberFormData.email}
                            onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                            type="email"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Phone Number
                          <input
                            value={memberFormData.phone}
                            onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Subject
                          <input
                            value={memberFormData.subject}
                            onChange={(e) => setMemberFormData({ ...memberFormData, subject: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Location
                          <input
                            value={memberFormData.location}
                            onChange={(e) => setMemberFormData({ ...memberFormData, location: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Date of Birth
                          <input
                            value={memberFormData.dob}
                            onChange={(e) => setMemberFormData({ ...memberFormData, dob: e.target.value })}
                            type="date"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Current Age
                          <input
                            value={memberFormData.age}
                            onChange={(e) => setMemberFormData({ ...memberFormData, age: e.target.value })}
                            type="number"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Gender
                          <select
                            value={memberFormData.gender}
                            onChange={(e) => setMemberFormData({ ...memberFormData, gender: e.target.value })}
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
                            value={memberFormData.blood_group}
                            onChange={(e) => setMemberFormData({ ...memberFormData, blood_group: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Height (cm)
                          <input
                            value={memberFormData.height}
                            onChange={(e) => setMemberFormData({ ...memberFormData, height: e.target.value })}
                            type="number"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Weight (kg)
                          <input
                            value={memberFormData.weight}
                            onChange={(e) => setMemberFormData({ ...memberFormData, weight: e.target.value })}
                            type="number"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          BMI
                          <input
                            value={memberFormData.bmi}
                            onChange={(e) => setMemberFormData({ ...memberFormData, bmi: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Plan Name
                          <input
                            value={memberFormData.plan_name}
                            onChange={(e) => setMemberFormData({ ...memberFormData, plan_name: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Plan Duration
                          <input
                            value={memberFormData.plan_duration}
                            onChange={(e) => setMemberFormData({ ...memberFormData, plan_duration: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <InputField
                        label="Permanent Address"
                        value={memberFormData.address}
                        onChange={(val) => setMemberFormData({ ...memberFormData, address: val })}
                        isTextArea
                      />

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest">Work & Career</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Company / Employer"
                            value={memberFormData.employer}
                            onChange={(val) => setMemberFormData({ ...memberFormData, employer: val })}
                          />
                          <InputField
                            label="Job Title / Occupation"
                            value={memberFormData.occupation}
                            onChange={(val) => setMemberFormData({ ...memberFormData, occupation: val })}
                          />
                        </div>
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Guardian / Contact Name"
                            value={memberFormData.emergency_contact_name}
                            onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_name: val })}
                          />
                          <InputField
                            label="Relationship"
                            value={memberFormData.emergency_contact_relationship}
                            onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_relationship: val })}
                          />
                          <InputField
                            label="Home / Primary Phone"
                            type="tel"
                            value={memberFormData.emergency_contact_phone_home}
                            onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_phone_home: val.replace(/\D/g, '').slice(0, 10) })}
                          />
                          <InputField
                            label="Work / Secondary Phone"
                            type="tel"
                            value={memberFormData.emergency_contact_phone_work}
                            onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_phone_work: val.replace(/\D/g, '').slice(0, 10) })}
                          />
                        </div>
                        <InputField
                          label="Emergency Contact Address"
                          value={memberFormData.emergency_contact_address}
                          onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_address: val })}
                          isTextArea
                        />
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest">Fitness Profile</h4>
                        <InputField
                          label="Fitness Goal"
                          value={memberFormData.fitness_goal}
                          onChange={(val) => setMemberFormData({ ...memberFormData, fitness_goal: val })}
                          isTextArea
                        />
                        <InputField
                          label="Additional Notes / Medical History"
                          value={memberFormData.message}
                          onChange={(val) => setMemberFormData({ ...memberFormData, message: val })}
                          isTextArea
                        />
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowConsent((prev) => !prev)}
                          className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                        >
                          <span className="text-white font-bold tracking-wider">Informed Consent Form</span>
                          <span className="text-orange-500 text-2xl">{showConsent ? '−' : '+'}</span>
                        </button>

                        {showConsent && (
                          <div className="mt-5 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                            <div className="flex flex-wrap items-center gap-3 text-white leading-8">
                              <span>I</span>
                              <input
                                type="text"
                                value={memberFormData.participant_name}
                                onChange={(e) => setMemberFormData({ ...memberFormData, participant_name: e.target.value })}
                                placeholder="Full Name"
                                className="min-w-[170px] bg-transparent border-b border-orange-400 px-2 py-1 text-white outline-none"
                              />
                              <span>give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</span>
                            </div>

                            <label className="flex items-center gap-3 mt-4 text-white">
                              <input
                                type="checkbox"
                                checked={memberFormData.consent_agree}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMemberFormData({
                                    ...memberFormData,
                                    consent_agree: checked,
                                    termsAccepted: checked,
                                  });
                                }}
                                className="w-5 h-5"
                              />
                              <span>I Agree</span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InputField
                                label="Signature"
                                value={memberFormData.consent_signature}
                                onChange={(val) => setMemberFormData({ ...memberFormData, consent_signature: val })}
                              />
                              <InputField
                                label="Consent Date"
                                type="date"
                                value={memberFormData.consent_date}
                                onChange={(val) => setMemberFormData({ ...memberFormData, consent_date: val })}
                              />
                            </div>

                            <InputField
                              label="Parent / Guardian Signature"
                              value={memberFormData.guardian_signature}
                              onChange={(val) => setMemberFormData({ ...memberFormData, guardian_signature: val })}
                            />
                            <InputField
                              label="Witness"
                              value={memberFormData.witness}
                              onChange={(val) => setMemberFormData({ ...memberFormData, witness: val })}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSaveMemberEdits}
                        disabled={savingMember}
                        className="w-full rounded-2xl bg-linear-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingMember ? 'Saving...' : 'Save Join Details'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderMemberDetailRow('Full Name', memberFormData.name)}
                      {renderMemberDetailRow('Email', memberFormData.email)}
                      {renderMemberDetailRow('Phone', memberFormData.phone)}
                      {renderMemberDetailRow('Member ID', memberData?.member_id ? `#${memberData.member_id}` : null)}
                      {renderMemberDetailRow('Subject', memberFormData.subject)}
                      {renderMemberDetailRow('Location', memberFormData.location)}
                      {renderMemberDetailRow('Plan Name', memberFormData.plan_name)}
                      {renderMemberDetailRow('Plan Duration', memberFormData.plan_duration)}
                      {renderMemberDetailRow('DOB', memberFormData.dob)}
                      {renderMemberDetailRow('Age', memberFormData.age)}
                      {renderMemberDetailRow('Gender', memberFormData.gender)}
                      {renderMemberDetailRow('Blood Group', memberFormData.blood_group)}
                      {renderMemberDetailRow('Height', memberFormData.height)}
                      {renderMemberDetailRow('Weight', memberFormData.weight)}
                      {renderMemberDetailRow('BMI', memberFormData.bmi)}
                      {renderMemberDetailRow('Address', memberFormData.address)}
                      {renderMemberDetailRow('Employer', memberFormData.employer)}
                      {renderMemberDetailRow('Occupation', memberFormData.occupation)}
                      {renderMemberDetailRow('Fitness Goal', memberFormData.fitness_goal)}
                      {renderMemberDetailRow('Message / Notes', memberFormData.message)}
                      {renderMemberDetailRow('Emergency Contact', memberFormData.emergency_contact_name)}
                      {renderMemberDetailRow('Relationship', memberFormData.emergency_contact_relationship)}
                      {renderMemberDetailRow('Emergency Phone', memberFormData.emergency_contact_phone_home)}
                      {renderMemberDetailRow('Secondary Phone', memberFormData.emergency_contact_phone_work)}
                      {renderMemberDetailRow('Consent Participant', memberFormData.participant_name)}
                      {renderMemberDetailRow('Consent Agreed', memberFormData.consent_agree ? 'Yes' : 'No')}
                      {renderMemberDetailRow('Signature', memberFormData.consent_signature)}
                      {renderMemberDetailRow('Consent Date', memberFormData.consent_date)}
                      {renderMemberDetailRow('Guardian Signature', memberFormData.guardian_signature)}
                      {renderMemberDetailRow('Witness', memberFormData.witness)}
                    </div>
                  )
                ) : (
                  <p className="text-gray-400">No member profile or join enquiry found yet. Click the button above to complete your join form.</p>
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

const InputField = ({ label, value, onChange, type = 'text', isTextArea = false }) => {
  if (isTextArea) {
    return (
      <label className="block text-sm text-gray-300">
        {label}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />
      </label>
    );
  }

  return (
    <label className="block text-sm text-gray-300">
      {label}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
      />
    </label>
  );
};

export default Account;
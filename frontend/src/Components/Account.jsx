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
  const [memberEditMode, setMemberEditMode] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
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
    plan: "",
    duration: "",
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
            plan: data.plan || "",
            duration: data.duration || "",
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
    if (memberData) return;
    if (!userInfo) return;

    setMemberFormData((prev) => ({
      ...prev,
      name: prev.name || userInfo.username || userInfo.full_name || "",
      email: prev.email || userInfo.email || "",
      phone: prev.phone || userInfo.mobile || "",
    }));
  }, [userInfo, memberData]);

  const handleSaveMemberEdits = async () => {
    if (!memberData?.id) return;
    setSavingMember(true);
    try {
      const payload = {
        name: memberFormData.name || memberData.name,
        email: memberFormData.email || memberData.email,
        phone: memberFormData.phone || memberData.phone,
        gender: memberFormData.gender || memberData.gender,
        dob: memberFormData.dob || memberData.dob,
        age: memberFormData.age || memberData.age,
        blood_group: memberFormData.blood_group || memberData.blood_group,
        address: memberFormData.address || memberData.address,
        employer: memberFormData.employer || memberData.employer,
        occupation: memberFormData.occupation || memberData.occupation,
        fitness_goal: memberFormData.fitness_goal || memberData.fitness_goal,
        emergency_contact_name: memberFormData.emergency_contact_name || memberData.emergency_contact_name,
        emergency_contact_relationship: memberFormData.emergency_contact_relationship || memberData.emergency_contact_relationship,
        emergency_contact_address: memberFormData.emergency_contact_address || memberData.emergency_contact_address,
        emergency_contact_phone_home: memberFormData.emergency_contact_phone_home || memberData.emergency_contact_phone_home,
        emergency_contact_phone_work: memberFormData.emergency_contact_phone_work || memberData.emergency_contact_phone_work,
      };
      const memberId = memberData.id || memberData.member_id;
      const res = await api.put(`/members/${memberId}`, payload);
      const updated = res.data;
      setMemberData(updated);
      setMemberFormData({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        dob: updated.dob || "",
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
        plan: updated.plan || "",
        duration: updated.duration || "",
      });
      setMemberEditMode(false);
      setUserInfo((prev) => ({
        ...prev,
        email: updated.email || prev.email,
        mobile: updated.phone || prev.mobile,
        username: updated.name || prev.username,
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

                {memberData ? (
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
                          Date of Birth
                          <input
                            value={memberFormData.dob}
                            onChange={(e) => setMemberFormData({ ...memberFormData, dob: e.target.value })}
                            type="date"
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
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
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
                          Employer
                          <input
                            value={memberFormData.employer}
                            onChange={(e) => setMemberFormData({ ...memberFormData, employer: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Occupation
                          <input
                            value={memberFormData.occupation}
                            onChange={(e) => setMemberFormData({ ...memberFormData, occupation: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300 md:col-span-2">
                          Address
                          <textarea
                            value={memberFormData.address}
                            onChange={(e) => setMemberFormData({ ...memberFormData, address: e.target.value })}
                            rows={3}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm text-gray-300">
                          Emergency Contact Name
                          <input
                            value={memberFormData.emergency_contact_name}
                            onChange={(e) => setMemberFormData({ ...memberFormData, emergency_contact_name: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Emergency Relationship
                          <input
                            value={memberFormData.emergency_contact_relationship}
                            onChange={(e) => setMemberFormData({ ...memberFormData, emergency_contact_relationship: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Emergency Phone
                          <input
                            value={memberFormData.emergency_contact_phone_home}
                            onChange={(e) => setMemberFormData({ ...memberFormData, emergency_contact_phone_home: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Secondary Contact
                          <input
                            value={memberFormData.emergency_contact_phone_work}
                            onChange={(e) => setMemberFormData({ ...memberFormData, emergency_contact_phone_work: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            type="tel"
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>

                      <label className="block text-sm text-gray-300">
                        Fitness Goal
                        <textarea
                          value={memberFormData.fitness_goal}
                          onChange={(e) => setMemberFormData({ ...memberFormData, fitness_goal: e.target.value })}
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                        />
                      </label>

                      <button
                        onClick={handleSaveMemberEdits}
                        disabled={savingMember}
                        className="w-full rounded-2xl bg-linear-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingMember ? 'Saving...' : 'Save Member Details'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderMemberDetailRow('Full Name', memberData.name)}
                      {renderMemberDetailRow('Email', memberData.email)}
                      {renderMemberDetailRow('Phone', memberData.phone)}
                      {renderMemberDetailRow('Member ID', memberData.member_id ? `#${memberData.member_id}` : null)}
                      {renderMemberDetailRow('Date of Birth', memberData.dob)}
                      {renderMemberDetailRow('Age', memberData.age)}
                      {renderMemberDetailRow('Gender', memberData.gender)}
                      {renderMemberDetailRow('Blood Group', memberData.blood_group)}
                      {renderMemberDetailRow('Address', memberData.address)}
                      {renderMemberDetailRow('Employer', memberData.employer)}
                      {renderMemberDetailRow('Occupation', memberData.occupation)}
                      {renderMemberDetailRow('Fitness Goal', memberData.fitness_goal)}
                      {renderMemberDetailRow('Emergency Contact', memberData.emergency_contact_name)}
                      {renderMemberDetailRow('Relationship', memberData.emergency_contact_relationship)}
                      {renderMemberDetailRow('Emergency Phone', memberData.emergency_contact_phone_home)}
                      {renderMemberDetailRow('Secondary Phone', memberData.emergency_contact_phone_work)}
                    </div>
                  )
                ) : (
                  <p className="text-gray-400">No member profile found yet. Click the button above to complete your join form.</p>
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
import React, { useEffect, useState } from "react";
import DietChart from "../WorkoutsDiet/DietChart";
import Workouts from "../WorkoutsDiet/Workouts";
import UserOrders from "./UserOrders";
import UserAddresses from "./UserAddresses";
import UserNotifications from "./UserNotifications";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import MemberSBuyPlans from "../WorkoutsDiet/MemberBuyPlans";
import cache from "../cache";
import PTFormUser from "./PTFormUser";
import SessionTracker from "../Admin/PTForm/SessionTracker";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { Shield, Key, Eye, EyeOff, CalendarCheck, User, Mail, Phone, Menu, X, Home, ChevronLeft, Users, CreditCard } from "lucide-react";


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
  const [ptFormData, setPtFormData] = useState(null);
  const [savingMember, setSavingMember] = useState(false);
  const [memberEditMode, setMemberEditMode] = useState(false);
  const [plans, setPlans] = useState([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [assignedTrainer, setAssignedTrainer] = useState(null);


  const isActivePtPlan = (member) => {
    if (!member) return false;
    const hasPlan = Boolean(member.pt_plan);
    const hasDates = Boolean(member.pt_join_date && member.pt_expiry_date);
    const isActive = String(member.pt_status || '').toLowerCase() === 'active';

    let isNotExpired = true;
    if (member.pt_expiry_date) {
      const isExpired = dayjs(member.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;
      // We will keep the isExpired check here in case we need it, but we won't hide the tabs.
      // The user wants the PT tabs to be visible even if the plan is expired.
    }

    return isActive && hasPlan && hasDates;
  };

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasActivePtMembership = isActivePtPlan(memberData);

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
            dob: normalizeDateForDateInput(data.dob) || "",
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
            height: data.height || "",
            weight: data.weight || "",
            bmi: data.bmi || "",
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

    const fetchUserMemberships = async () => {
      try {
        const res = await api.get(`/memberships/user/${userId}`);
        const memberships = Array.isArray(res.data) ? res.data : [];
        setPlans(memberships);
      } catch (err) {
        console.error('Failed to fetch user memberships', err);
        setPlans([]);
      }
    };

    const fetchAssignedTrainer = async () => {
      try {
        const res = await api.get("/assignments");
        const all = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mine = all.find(a =>
          String(a.userId) === String(userId) ||
          String(a.gymMemberId) === String(memberData?.id)
        );
        if (mine) {
          setAssignedTrainer({
            name: mine.trainerName || mine.trainer_name || "",
            email: mine.trainerEmail || mine.trainer_email || "",
            phone: mine.trainerPhone || mine.trainer_phone || "",
            specialization: mine.specialization || "",
          });
        } else {
          setAssignedTrainer(null);
        }
      } catch (err) {
        console.error("Failed to fetch trainer assignment", err);
      }
    };

    fetchMemberData();
    fetchUserMemberships();
    fetchAssignedTrainer();
  }, [userId]);

  useEffect(() => {
    const hasMembershipActive = Array.isArray(plans) && plans.some((m) => String(m.status || '').toLowerCase() === 'active');
    setHasActivePlan(hasMembershipActive || isActivePtPlan(memberData));
  }, [plans, memberData]);

  // Re-fetch trainer when memberData loads so gymMemberId match works
  useEffect(() => {
    if (!memberData?.id) return;
    const fetchTrainer = async () => {
      try {
        const res = await api.get("/assignments");
        const all = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mine = all.find(a =>
          String(a.userId) === String(userId) ||
          String(a.gymMemberId) === String(memberData.id)
        );
        if (mine) {
          setAssignedTrainer({
            name: mine.trainerName || mine.trainer_name || "",
            email: mine.trainerEmail || mine.trainer_email || "",
            phone: mine.trainerPhone || mine.trainer_phone || "",
            specialization: mine.specialization || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch trainer assignment by memberId", err);
      }
    };
    fetchTrainer();
  }, [memberData?.id]);

  useEffect(() => {
    if (!memberData?.id) {
      setPtFormData(null);
      return;
    }

    const fetchPtForm = async () => {
      try {
        const isExpired = memberData?.pt_expiry_date && dayjs(memberData.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day') < 0;

        const res = await api.get(`/pt-forms/${memberData.id}`);
        const ptData = res.data || {};
        const formData = typeof ptData.form_data === 'string' ? JSON.parse(ptData.form_data || '{}') : ptData.form_data || {};

        let finalFormData = { ...formData };

        // Check if plan was renewed by comparing joining dates
        const isRenewed = formData.pt_join_date && memberData?.pt_join_date && !dayjs(formData.pt_join_date).isSame(dayjs(memberData.pt_join_date), 'day');

        if (isExpired || isRenewed) {
          finalFormData = {
            ...formData,
            sessions: []
          };
        }

        setPtFormData(normalizeSessionForm({
          member_id: memberData.id,
          u_id: userId,
          trainer_name_assigned: memberFormData.trainer_name_assigned || "",
          ...finalFormData,
        }));
      } catch (err) {
        setPtFormData({
          member_id: memberData.id,
          u_id: userId,
          trainer_name_assigned: memberFormData.trainer_name_assigned || "",
          ...memberFormData,
        });
      }
    };

    fetchPtForm();
  }, [memberData?.id, userId, memberFormData]);

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
            dob: normalizeDateForDateInput(match.dob) || "",
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

  useEffect(() => {
    if (!memberData || !userEnquiry) return;

    setMemberFormData((prev) => ({
      ...prev,
      height: prev.height || memberData.height || "",
      weight: prev.weight || memberData.weight || "",
      bmi: prev.bmi || memberData.bmi || "",
      dob: prev.dob || normalizeDateForDateInput(memberData.dob) || "",
      age: prev.age || memberData.age || "",
      blood_group: prev.blood_group || memberData.blood_group || "",
      gender: prev.gender || memberData.gender || "",
      address: prev.address || memberData.address || "",
      employer: prev.employer || memberData.employer || "",
      occupation: prev.occupation || memberData.occupation || "",
      emergency_contact_name: prev.emergency_contact_name || memberData.emergency_contact_name || "",
      emergency_contact_relationship: prev.emergency_contact_relationship || memberData.emergency_contact_relationship || "",
      emergency_contact_address: prev.emergency_contact_address || memberData.emergency_contact_address || "",
      emergency_contact_phone_home: prev.emergency_contact_phone_home || memberData.emergency_contact_phone_home || "",
      emergency_contact_phone_work: prev.emergency_contact_phone_work || memberData.emergency_contact_phone_work || "",
      fitness_goal: prev.fitness_goal || memberData.fitness_goal || "",
    }));
  }, [memberData, userEnquiry]);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (memberFormData.height && memberFormData.weight) {
      const h = parseFloat(memberFormData.height) / 100;
      const w = parseFloat(memberFormData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setMemberFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setMemberFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [memberFormData.height, memberFormData.weight]);

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
      dob: memberFormData.dob ? dayjs(memberFormData.dob).format('DD-MM-YYYY') : memberData?.dob || null,
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
      dob: memberFormData.dob ? dayjs(memberFormData.dob).format('DD-MM-YYYY') : memberData?.dob,
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

  const saveSessionTracker = async (updatedData) => {
    if (!memberData?.id) {
      toast.error('Unable to save session tracker: member record not linked.');
      return;
    }

    const normalizeSessionForm = (rawData) => {
      const trainerSign = rawData.trainer_name_assigned || memberFormData.trainer_name_assigned || "";
      const sessions = Array.isArray(rawData.sessions) && rawData.sessions.length > 0
        ? rawData.sessions.map((session, index) => ({
          session_no: index + 1,
          date: session.date || "",
          workout: session.workout || "",
          status: session.status || "Pending",
          client_sign: session.client_sign || "",
          trainer_sign: session.trainer_sign || trainerSign,
        }))
        : undefined;

      return {
        ...rawData,
        member_id: memberData.id,
        u_id: userId,
        trainer_name_assigned: trainerSign,
        pt_join_date: memberData.pt_join_date,
        pt_expiry_date: memberData.pt_expiry_date,
        join_date: memberData.join_date,
        expiry_date: memberData.expiry_date,
        sessions,
      };
    };

    try {
      await api.post('/pt-forms', {
        member_id: memberData.id,
        user_id: userId,
        formData: normalizeSessionForm(updatedData),
        completed: true,
      });
      setPtFormData(normalizeSessionForm(updatedData));
      toast.success('Session tracker saved successfully.');
    } catch (err) {
      console.error('Failed to save session tracker', err);
      toast.error('Failed to save session tracker.');
    }
  };

  const normalizeSession = (session, trainerSign) => {
    const rawStatus = String(session?.status || '').trim();
    const status = rawStatus.length
      ? rawStatus.toLowerCase() === 'completed'
        ? 'Completed'
        : rawStatus
      : 'Pending';

    return {
      session_no: Number(session?.session_no) || 0,
      date: session?.date || '',
      workout: session?.workout || '',
      status,
      client_sign: session?.client_sign || '',
      trainer_sign: session?.trainer_sign || trainerSign,
    };
  };

  const normalizeSessionForm = (rawData) => {
    const trainerSign = rawData.trainer_name_assigned || memberFormData.trainer_name_assigned || '';
    const sessions = Array.isArray(rawData.sessions) && rawData.sessions.length > 0
      ? rawData.sessions.map((session, index) => ({
        ...normalizeSession(session, trainerSign),
        session_no: index + 1,
      }))
      : undefined;

    return {
      ...rawData,
      member_id: memberData.id,
      u_id: userId,
      trainer_name_assigned: trainerSign,
      pt_join_date: memberData?.pt_join_date,
      pt_expiry_date: memberData?.pt_expiry_date,
      join_date: memberData?.join_date,
      expiry_date: memberData?.expiry_date,
      sessions,
    };
  };

  const renderMemberDetailRow = (label, value) => {
    const displayValue = value === undefined || value === null || value === "" ? "-" : value;
    return (
      <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-white text-sm">{displayValue}</p>
      </div>
    );
  };

  const formatCurrency = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return `₹${number.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const safeParseDues = (membership) => {
    if (!membership) return [];
    let dues = membership.dues ?? [];
    if (typeof dues === "string") {
      try {
        dues = JSON.parse(dues || "[]");
      } catch (err) {
        dues = [];
      }
    }
    return Array.isArray(dues) ? dues : [];
  };

  const getMembershipField = (membership, ...keys) => {
    return keys.reduce((value, key) => value ?? membership?.[key], undefined);
  };

  const getMembershipTotal = (membership) => {
    const total = getMembershipField(membership, "price", "amount", "total", "total_amount") || 0;
    return Number(total) || 0;
  };

  const getMembershipPaid = (membership) => {
    const initialPaid = Number(getMembershipField(membership, "pricePaid", "price_paid", "paid")) || 0;
    const secondPaid = Number(getMembershipField(membership, "secondPaymentPaid", "second_payment_paid")) || 0;
    return initialPaid + secondPaid;
  };

  const getMembershipRemaining = (membership) => {
    const remaining = getMembershipTotal(membership) - getMembershipPaid(membership);
    return Math.max(0, Number.isFinite(remaining) ? remaining : 0);
  };

  const getMembershipDisplayValue = (membership, fallback = "-") => {
    return getMembershipField(membership, "planName", "plan_name", "plan") || fallback;
  };

  const getMembershipDuration = (membership) => {
    const duration = getMembershipField(membership, "duration", "plan_duration");
    return duration || "-";
  };

  const getMembershipPaymentEntries = (membership) => {
    return safeParseDues(membership).map((due) => {
      const amount = Number(due?.amount ?? due?.amt ?? 0);
      const collectedBy = getMembershipField(due, "collectedBy", "collected_by") || "Admin";
      const paymentId = getMembershipField(due, "paymentId", "payment_id") || "Cash";
      const collectedAt = getMembershipField(due, "collectedAt", "collected_at", "createdAt", "date");
      return {
        amount: Number.isFinite(amount) ? amount : 0,
        collectedBy,
        paymentId,
        collectedAt,
      };
    });
  };

  const tabs = [
    { key: "personal", label: "Personal Details", icon: User },
    { key: "plans", label: "My Plans", icon: CalendarCheck },

    ...(hasActivePlan
      ? [
        { key: "emi", label: "EMI Details", icon: CreditCard },
        { key: "diet", label: "Diet Chart", icon: Shield },
        { key: "workouts", label: "Workouts", icon: Key },
      ]
      : []),

    ...(hasActivePtMembership
      ? [
        { key: "ptform", label: "PT Form", icon: CalendarCheck },
        { key: "sessionTracker", label: "Session Tracker", icon: CalendarCheck },
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

              {/* Assigned Trainer Card */}
              {assignedTrainer?.name && (
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-red-950/40 to-black border border-red-500/20 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 sm:p-3 bg-red-600/20 rounded-lg sm:rounded-xl shrink-0">
                      <Users size={20} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Assigned Trainer</p>
                      <p className="text-white font-bold text-base sm:text-lg">{assignedTrainer.name}</p>
                    </div>
                    <span className="ml-auto px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] font-bold uppercase text-red-300">
                      Your Trainer
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedTrainer.email && (
                      <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3">
                        <Mail size={14} className="text-red-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Email</p>
                          <p className="text-white text-sm break-all">{assignedTrainer.email}</p>
                        </div>
                      </div>
                    )}
                    {assignedTrainer.phone && (
                      <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3">
                        <Phone size={14} className="text-red-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Phone</p>
                          <p className="text-white text-sm">{assignedTrainer.phone}</p>
                        </div>
                      </div>
                    )}
                    {assignedTrainer.specialization && (
                      <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3">
                        <Shield size={14} className="text-red-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Specialization</p>
                          <p className="text-white text-sm">{assignedTrainer.specialization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl gap-4">
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Account Status</h4>
                  <p className="text-gray-500 text-xs">Your account is currently {userInfo.status || "active"}</p>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${userInfo.status === "inactive" ? "bg-gray-500/20 text-gray-500" : "bg-green-500/20 text-green-500"
                  }`}>
                  {userInfo.status || "Active"}
                </div>
              </div>

              <div className="mt-8 bg-gray-900/50 border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">Join Form Details</h3>
                    <p className="text-sm text-gray-400">View your Join Now form information here. Tap Edit Details to update it on the enquiry page.</p>
                  </div>
                  <button
                    onClick={() => {
                      // If we have an actual enquiry, pass it as selectedEnquiry so UserEnquiry will edit it.
                      if (userEnquiry) {
                        navigate('/userenquiry', {
                          state: {
                            selectedEnquiry: userEnquiry,
                            prefilledUser: {
                              name: userInfo.username || userInfo.full_name || "",
                              email: userInfo.email || "",
                              phone: userInfo.mobile || "",
                            },
                          },
                        });
                        return;
                      }

                      // If we only have a member record (admin-created), pass its fields as a prefill object
                      if (memberData) {
                        // Pass the member as `selectedMember` so UserEnquiry will edit via /members/:id
                        navigate('/userenquiry', {
                          state: {
                            selectedMember: memberData,
                            prefilledUser: {
                              name: userInfo.username || userInfo.full_name || "",
                              email: userInfo.email || "",
                              phone: userInfo.mobile || "",
                            },
                          },
                        });
                        return;
                      }

                      // Fallback: send prefilled user only
                      navigate('/userenquiry', {
                        state: {
                          prefilledUser: {
                            name: userInfo.username || userInfo.full_name || "",
                            email: userInfo.email || "",
                            phone: userInfo.mobile || "",
                          },
                        },
                      });
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
                  >
                    Edit Details
                  </button>
                </div>

                {memberData || userEnquiry ? (
                  memberEditMode ? (
                    <form className="space-y-10">
                      {/* SECTION: PLAN INFO */}
                      {(memberFormData.plan_name || memberFormData.plan_duration) && (
                        <div className="grid md:grid-cols-2 gap-6">
                          <InputField
                            label="Selected Plan"
                            value={memberFormData.plan_name}
                            readOnly
                          />
                          <InputField
                            label="Plan Duration"
                            value={memberFormData.plan_duration}
                            readOnly
                          />
                        </div>
                      )}

                      {/* SECTION: PERSONAL INFO */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                            <Users className="w-5 h-5 text-orange-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-widest">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField label="Full Name" value={memberFormData.name} onChange={(val) => setMemberFormData({ ...memberFormData, name: val })} placeholder="e.g. John Doe" />
                          <InputField label="Email Address" type="email" value={memberFormData.email} onChange={(val) => setMemberFormData({ ...memberFormData, email: val })} placeholder="john@example.com" />
                          <InputField label="Phone Number" type="tel" value={memberFormData.phone} onChange={(val) => setMemberFormData({ ...memberFormData, phone: val.replace(/\D/g, '').slice(0, 10) })} placeholder="e.g. 9876543210" />

                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Date of Birth" type="date" value={memberFormData.dob} onChange={(val) => setMemberFormData({ ...memberFormData, dob: val })} />
                            <InputField label="Current Age" type="number" value={memberFormData.age} onChange={(val) => setMemberFormData({ ...memberFormData, age: val })} placeholder="Years" />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
                            <select
                              value={memberFormData.blood_group}
                              onChange={(e) => setMemberFormData({ ...memberFormData, blood_group: e.target.value })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                            >
                              <option value="" className="bg-gray-900">Select Blood Group</option>
                              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(g => (
                                <option key={g} value={g} className="bg-gray-900">{g}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Gender</label>
                            <select
                              value={memberFormData.gender}
                              onChange={(e) => setMemberFormData({ ...memberFormData, gender: e.target.value })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                            >
                              <option value="" className="bg-gray-900">Select Gender</option>
                              <option value="Male" className="bg-gray-900">Male</option>
                              <option value="Female" className="bg-gray-900">Female</option>
                              <option value="Other" className="bg-gray-900">Other</option>
                            </select>
                          </div>
                        </div>

                        <InputField label="Permanent Address" value={memberFormData.address} onChange={(val) => setMemberFormData({ ...memberFormData, address: val })} isTextArea placeholder="Enter your full residential address..." />
                      </div>

                      {/* SECTION: PROFESSIONAL INFO */}
                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Work & Career</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField label="Company / Employer" value={memberFormData.employer} onChange={(val) => setMemberFormData({ ...memberFormData, employer: val })} placeholder="Company name" />
                          <InputField label="Job Title / Occupation" value={memberFormData.occupation} onChange={(val) => setMemberFormData({ ...memberFormData, occupation: val })} placeholder="e.g. Software Engineer" />
                        </div>
                      </div>

                      {/* SECTION: EMERGENCY CONTACT */}
                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField label="Guardian/Contact Name" value={memberFormData.emergency_contact_name} onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_name: val })} placeholder="Full name" />
                          <InputField label="Relationship" value={memberFormData.emergency_contact_relationship} onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_relationship: val })} placeholder="e.g. Father, Spouse, Friend" />
                          <InputField label="Home / Primary Phone" type="tel" value={memberFormData.emergency_contact_phone_home} onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_phone_home: val.replace(/\D/g, '').slice(0, 10) })} placeholder="e.g. 9876543210" />
                          <InputField label="Work / Secondary Phone" type="tel" value={memberFormData.emergency_contact_phone_work} onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_phone_work: val.replace(/\D/g, '').slice(0, 10) })} placeholder="Alternative number" />
                        </div>
                        <InputField label="Emergency Contact Address" value={memberFormData.emergency_contact_address} onChange={(val) => setMemberFormData({ ...memberFormData, emergency_contact_address: val })} isTextArea placeholder="Guardian's address..." />
                      </div>

                      {/* SECTION: HEALTH & GOALS */}
                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Fitness Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <InputField label="Height (cm)" type="number" value={memberFormData.height} onChange={(val) => setMemberFormData({ ...memberFormData, height: val })} placeholder="Height in cm" />
                          <InputField label="Weight (kg)" type="number" value={memberFormData.weight} onChange={(val) => setMemberFormData({ ...memberFormData, weight: val })} placeholder="Weight in kg" />
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Current BMI</label>
                            <div className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-orange-500 font-black text-center text-xl">
                              {memberFormData.bmi || "0.0"}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField label="What are your fitness goals?" value={memberFormData.fitness_goal} onChange={(val) => setMemberFormData({ ...memberFormData, fitness_goal: val })} isTextArea placeholder="Describe what you want to achieve (e.g. Lose 5kg, build muscle, marathon prep)..." />
                          <InputField label="Any Medical History or Notes?" value={memberFormData.message} onChange={(val) => setMemberFormData({ ...memberFormData, message: val })} isTextArea placeholder="List any injuries, conditions, or specific requests..." />
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <p className="text-sm text-gray-400 mb-3">
                            Please read the <span className="text-orange-500 font-semibold">Terms & Conditions</span>
                          </p>

                          <button
                            type="button"
                            onClick={() => setShowConsent(!showConsent)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                          >
                            <span className="text-white font-bold tracking-wider">INFORMED CONSENT FORM</span>
                            <span className="text-orange-500 text-2xl">{showConsent ? "−" : "+"}</span>
                          </button>

                          {showConsent && (
                            <div className="mt-5 p-8 rounded-2xl bg-white/5 border border-white/10 space-y-8">
                              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <p className="uppercase text-sm text-orange-400 font-semibold mb-5">Please Fill In All Information Requested Below</p>

                                <div className="flex flex-wrap items-center gap-3 leading-8 text-white">
                                  <span>I</span>
                                  <input
                                    type="text"
                                    value={memberFormData.participant_name}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, participant_name: e.target.value })}
                                    placeholder="Full Name"
                                    className="min-w-[180px] bg-transparent border-b border-orange-400 px-2 py-1 text-white outline-none"
                                  />
                                  <span>give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</span>
                                </div>

                                <label className="flex items-center gap-3 mt-6">
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
                                  <span className="text-white">I Agree</span>
                                </label>
                              </div>

                              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-orange-400 font-bold text-lg mb-4">BENEFITS</h3>
                                <p className="text-white/80 leading-8">
                                  Participation in a regular program of physical activity has been shown to produce positive changes in a number of organ systems. These changes include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance.
                                </p>
                              </div>

                              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-orange-400 font-bold text-lg mb-4">RISKS</h3>
                                <p className="text-white/80 leading-8">
                                  Exercise carries some risk to the musculoskeletal system (sprains, strains) and cardiorespiratory system (dizziness, discomfort in breathing, heart attack). I certify that I know of no medical problem that would increase my risk of illness or injury.
                                </p>
                              </div>

                              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-orange-400 font-bold text-lg mb-4">TESTING AND EVALUATION RESULTS</h3>
                                <p className="text-white/80 leading-8 mb-5">
                                  I understand I will undergo initial testing to determine my current physical fitness status including health inventory, body composition, treadmill testing, muscular fitness and flexibility screening.
                                </p>
                                <p className="text-white/80 leading-8 mb-5">
                                  My individual results will be made available only to me and are not intended to replace any medical test or physician services.
                                </p>
                                <p className="text-white/80 leading-8">
                                  By signing this consent form, I understand I am personally responsible for my actions during my tenure at DAP Unisex Fitness Studio.
                                </p>
                              </div>

                              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 text-orange-300 font-semibold">
                                * No Refund • No Transfer • No Extension • No Freezing
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Signature" value={memberFormData.consent_signature} onChange={(val) => setMemberFormData({ ...memberFormData, consent_signature: val })} placeholder="Type your signature" />
                                <InputField label="Date" type="date" value={memberFormData.consent_date} onChange={(val) => setMemberFormData({ ...memberFormData, consent_date: val })} />
                              </div>

                              <InputField label="Parent / Guardian Signature" value={memberFormData.guardian_signature} onChange={(val) => setMemberFormData({ ...memberFormData, guardian_signature: val })} placeholder="Guardian signature" />
                              <InputField label="Witness" value={memberFormData.witness} onChange={(val) => setMemberFormData({ ...memberFormData, witness: val })} placeholder="Witness name" />
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleSaveMemberEdits}
                        disabled={savingMember}
                        className="w-full rounded-2xl bg-linear-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingMember ? 'Saving...' : 'Save All Changes'}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      {(memberFormData.plan_name || memberFormData.plan_duration) && (
                        <div className="grid md:grid-cols-2 gap-6">
                          {renderMemberDetailRow('Selected Plan', memberFormData.plan_name)}
                          {renderMemberDetailRow('Plan Duration', memberFormData.plan_duration)}
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-white font-bold uppercase tracking-widest">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderMemberDetailRow('Full Name', memberFormData.name)}
                          {renderMemberDetailRow('Email', memberFormData.email)}
                          {renderMemberDetailRow('Phone', memberFormData.phone)}
                          {renderMemberDetailRow('DOB', memberFormData.dob)}
                          {renderMemberDetailRow('Age', memberFormData.age)}
                          {renderMemberDetailRow('Blood Group', memberFormData.blood_group)}
                          {renderMemberDetailRow('Gender', memberFormData.gender)}
                          {renderMemberDetailRow('Address', memberFormData.address)}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-white font-bold uppercase tracking-widest">Work & Career</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderMemberDetailRow('Employer', memberFormData.employer)}
                          {renderMemberDetailRow('Occupation', memberFormData.occupation)}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-white font-bold uppercase tracking-widest">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderMemberDetailRow('Contact Name', memberFormData.emergency_contact_name)}
                          {renderMemberDetailRow('Relationship', memberFormData.emergency_contact_relationship)}
                          {renderMemberDetailRow('Home Phone', memberFormData.emergency_contact_phone_home)}
                          {renderMemberDetailRow('Work Phone', memberFormData.emergency_contact_phone_work)}
                          {renderMemberDetailRow('Address', memberFormData.emergency_contact_address)}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-white font-bold uppercase tracking-widest">Fitness Profile</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderMemberDetailRow('Height (cm)', memberFormData.height)}
                          {renderMemberDetailRow('Weight (kg)', memberFormData.weight)}
                          {renderMemberDetailRow('BMI', memberFormData.bmi)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderMemberDetailRow('Fitness Goals', memberFormData.fitness_goal)}
                          {renderMemberDetailRow('Medical Notes', memberFormData.message)}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-white font-bold uppercase tracking-widest">Consent Form</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderMemberDetailRow('Participant Name', memberFormData.participant_name)}
                          {renderMemberDetailRow('Consent', memberFormData.consent_agree ? 'Agreed' : 'Not Agreed')}
                          {renderMemberDetailRow('Signature', memberFormData.consent_signature)}
                          {renderMemberDetailRow('Date', memberFormData.consent_date)}
                          {renderMemberDetailRow('Guardian Signature', memberFormData.guardian_signature)}
                          {renderMemberDetailRow('Witness', memberFormData.witness)}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-gray-400 text-center py-8">No join form details found. Click "Edit Details" to get started.</p>
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
        return <MemberSBuyPlans preFetchedPlans={plans} memberData={memberData} />

      case "emi": {
        const activePlans = plans || [];
        return (
          <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold uppercase text-white">EMI Details</h2>
                    <p className="text-sm text-gray-400 max-w-2xl">
                      Review your membership EMI schedule, plan summary, total amount paid and remaining dues.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-black/50 border border-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-300">Total Plans</p>
                      <p className="text-white font-semibold mt-2">{activePlans.length}</p>
                    </div>
                    <div className="rounded-2xl bg-black/50 border border-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-300">Active Plans</p>
                      <p className="text-white font-semibold mt-2">{activePlans.filter((membership) => membership.status === "active").length}</p>
                    </div>
                    <div className="rounded-2xl bg-black/50 border border-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-300">Pending Dues</p>
                      <p className="text-white font-semibold mt-2">
                        {activePlans.reduce((sum, membership) => sum + getMembershipRemaining(membership), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {activePlans.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-gray-900/50 p-8 text-center text-gray-400">
                  No EMI membership records found for your account.
                </div>
              ) : (
                <div className="space-y-6">
                  {activePlans.map((membership, index) => {
                    const planName = getMembershipDisplayValue(membership, "Unknown Plan");
                    const duration = getMembershipDuration(membership);
                    const totalAmount = getMembershipTotal(membership);
                    const paidAmount = getMembershipPaid(membership);
                    const remainingAmount = getMembershipRemaining(membership);
                    const dues = getMembershipPaymentEntries(membership);
                    const status = getMembershipField(membership, "status") || "-";
                    const paymentStatus = getMembershipField(membership, "paymentStatus", "payment_status") || "-";
                    const paymentMode = getMembershipField(membership, "paymentMode", "payment_mode") || "-";
                    const startDate = getMembershipField(membership, "startDate", "start_date");
                    const endDate = getMembershipField(membership, "endDate", "end_date");
                    const createdAt = getMembershipField(membership, "createdAt", "created_at");
                    const membershipId = membership.id || membership.membershipId || index;

                    return (
                      <div key={membershipId} className="rounded-3xl border border-white/10 bg-gray-900/50 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-500">Plan</p>
                            <h3 className="text-xl font-bold text-white">{planName}</h3>
                            <p className="text-sm text-gray-400">{duration !== "-" ? `${duration} month${duration === 1 ? "" : "s"}` : "Duration not set"}</p>
                          </div>
                          <div className="space-y-2 text-left sm:text-right">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${status?.toLowerCase() === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-300 border border-white/10"}`}>
                              {status}
                            </span>
                            <p className="text-xs text-gray-400">Created {formatDate(createdAt)}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Total Amount</p>
                            <p className="text-white font-semibold mt-2">{formatCurrency(totalAmount)}</p>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Initial Paid</p>
                            <p className="text-white font-semibold mt-2">{formatCurrency(getMembershipField(membership, "pricePaid", "price_paid") || 0)}</p>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Second Paid</p>
                            <p className="text-white font-semibold mt-2">{formatCurrency(getMembershipField(membership, "secondPaymentPaid", "second_payment_paid") || 0)}</p>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Remaining</p>
                            <p className="text-white font-semibold mt-2">{formatCurrency(remainingAmount)}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300 mb-2">
                              Next EMI Due
                            </p>

                            <div className="inline-flex px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                              <span className="text-lg font-bold text-blue-200">
                                {(() => {
                                  const dueDate = new Date(membership.createdAt);
                                  dueDate.setDate(dueDate.getDate() + 30);

                                  return dueDate.toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  });
                                })()}
                              </span>
                            </div>

                            <p className="text-sm text-gray-300 mt-3">
                              EMI Amount: <span className="font-semibold text-white">
                                {formatCurrency(remainingAmount)}
                              </span>
                            </p>
                          </div>
                          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Payment Status</p>
                            <p className="text-white font-semibold mt-2">{paymentStatus}</p>
                          </div>


                          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">Start Date</p>
                            <p className="text-white font-semibold mt-2">{formatDate(startDate)}</p>
                          </div>
                          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-blue-300">End Date</p>
                            <p className="text-white font-semibold mt-2">{formatDate(endDate)}</p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-3">EMI Dues History</h4>
                          {dues.length > 0 ? (
                            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/40">
                              <table className="min-w-full divide-y divide-white/10 text-sm">
                                <thead>
                                  <tr className="bg-white/5 text-left text-xs uppercase tracking-widest text-gray-400">
                                    <th className="px-4 py-3">Due Amount</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Collected By</th>
                                    <th className="px-4 py-3">Reference</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 bg-black/20">

                                  {/* Initial Payment */}
                                  <tr>
                                    <td className="px-4 py-4 text-white font-semibold">
                                      {formatCurrency(getMembershipField(membership, "pricePaid", "price_paid") || 0)}
                                    </td>

                                    <td className="px-4 py-4 text-gray-300">
                                      {formatDate(createdAt)}
                                    </td>

                                    <td className="px-4 py-4 text-gray-300">
                                      {getMembershipField(
                                        membership,
                                        "createdBy",
                                        "created_by",
                                        "collectedBy",
                                        "collected_by"
                                      )}
                                    </td>

                                    <td className="px-4 py-4 text-gray-300">
                                      {paymentMode}
                                    </td>
                                  </tr>

                                  {/* EMI Due History */}
                                  {dues.map((due, dueIndex) => (
                                    <tr key={dueIndex} className="hover:bg-white/5 transition-colors">
                                      <td className="px-4 py-4 text-white font-semibold">
                                        {formatCurrency(due.amount)}
                                      </td>

                                      <td className="px-4 py-4 text-gray-300">
                                        {formatDate(due.collectedAt)}
                                      </td>

                                      <td className="px-4 py-4 text-gray-300">
                                        {due.collectedBy}
                                      </td>

                                      <td className="px-4 py-4 text-gray-300">
                                        {due.paymentId || "Cash"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-400">No dues recorded yet for this plan.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

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

      case "sessionTracker":
        return (
          <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
            {!memberData?.id ? (
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
                Session tracker is available once your account is linked to a gym member record.
              </div>
            ) : (
              <SessionTracker
                formData={ptFormData || { member_id: memberData.id, u_id: userId, trainer_name_assigned: memberFormData.trainer_name_assigned || "" }}
                standalone
                userMode={true}
                hideFooter
                onSaved={saveSessionTracker}
              />
            )}
          </div>
        );

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

const InputField = ({ label, value, onChange, type = 'text', isTextArea = false, readOnly = false, placeholder = '', required = false }) => {
  if (isTextArea) {
    return (
      <label className="block text-sm text-gray-300">
        {label}
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          rows={3}
          readOnly={readOnly}
          placeholder={placeholder}
          required={required}
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
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
      />
    </label>
  );
};

const normalizeDateForDateInput = (value) => {
  if (!value) return "";
  const parsed = dayjs(value, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY'], true);
  if (!parsed.isValid()) {
    const fallback = dayjs(value);
    return fallback.isValid() ? fallback.format('YYYY-MM-DD') : "";
  }
  return parsed.format('YYYY-MM-DD');
};

const getConsent = (consentData) => {
  if (!consentData) return {};
  try {
    return typeof consentData === 'string' ? JSON.parse(consentData) : consentData;
  } catch (err) {
    return {};
  }
};

export default Account;
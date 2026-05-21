import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../api";
import emailjs from "@emailjs/browser";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Search, X } from "lucide-react";
import { useAuth } from "../../PrivateRouter/AuthContext";
const MEMBERS_API = "/members";
const PLANS_API = "/plans";
const MEMBERSHIP_API = "/memberships";

const BuyPlanadmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName, user } = useAuth();

  // Logged-in user's display name for Referred By
  const loggedInName = profileName || user?.username || user?.name || "";

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberHistory, setMemberHistory] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [initialPayment, setInitialPayment] = useState("");
  const [discount, setDiscount] = useState("");
  const [referredBy, setReferredBy] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [planSearch, setPlanSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Auto-fill Referred By with logged-in user name on mount
  useEffect(() => {
    if (loggedInName) setReferredBy(loggedInName);
  }, [loggedInName]);

  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    height: "",
    weight: "",
    bmi: "",
    startDate: today,
    endDate: "",
    paymentMode: "cash",
    paymentDate: today,
  });

  // ================= FILTER MEMBERS FOR DROPDOWN =================
  const getFilteredMembers = () => {
    const seenPhones = new Set();
    return members
      .filter((m) => {
        // only gym members converted from enquiry should appear
        if (m.source === "users") return false;

        // 1. Skip if already has a pending or active plan
        const status = (m.status || "").toLowerCase();
        const hasExistingPlan = m.plan && (status === "active" || status === "pending");
        if (hasExistingPlan) return false;

        // 2. Skip duplicates by phone
        if (seenPhones.has(m.phone)) return false;
        seenPhones.add(m.phone);

        // 3. Filter by search term
        const searchLower = memberSearch.toLowerCase().trim();
        if (!searchLower) return true;

        const name = (m.name || m.username || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const email = (m.email || "").toLowerCase();

        return (
          name.includes(searchLower) ||
          phone.includes(searchLower) ||
          email.includes(searchLower)
        );
      });
  };

  // ================= FILTER PLANS FOR DROPDOWN =================
  const getFilteredPlans = () => {
    const searchLower = planSearch.toLowerCase().trim();
    if (!searchLower) return plans;

    return plans.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const duration = (p.duration || "").toLowerCase();
      const price = ((p.finalPrice ?? p.final_price ?? p.price) || "").toString();

      return (
        name.includes(searchLower) ||
        duration.includes(searchLower) ||
        price.includes(searchLower)
      );
    });
  };

  const normalizePlanText = (text) =>
    text
      ? text.toString().trim().toLowerCase().replace(/\s+/g, " ")
      : "";

  const parseDurationValue = (value) => {
    if (value == null) return null;

    const raw = value.toString().trim().toLowerCase();
    const numberMatch = raw.match(/(\d+(?:\.\d+)?)/);
    const amount = numberMatch ? Number(numberMatch[1]) : NaN;
    if (Number.isNaN(amount)) return null;

    if (raw.includes("year")) return Math.round(amount * 12);
    if (raw.includes("month")) return Math.round(amount);
    if (raw.includes("week")) return Math.ceil((amount * 7) / 30);
    if (raw.includes("day")) return Math.ceil(amount / 30);

    return Number.isFinite(amount) ? Math.round(amount) : null;
  };

  const parseDecimal = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const getSelectedPlanTotal = () => {
    if (!selectedPlan) return 0;
    const originalPrice = parseDecimal(
      selectedPlan.finalPrice ?? selectedPlan.final_price ?? selectedPlan.price
    );
    const discountVal = parseDecimal(discount);
    return Math.max(0, originalPrice - discountVal);
  };

  const getSelectedPlanDuration = () => {
    if (!selectedPlan) return 1;
    return parseDurationValue(selectedPlan.duration) || 1;
  };

  const getSelectedPlanEMI = () => {
    const total = getSelectedPlanTotal();
    const duration = getSelectedPlanDuration();
    return duration > 0 ? Number((total / duration).toFixed(2)) : 0;
  };

  const isEMIAllowed = selectedPlan ? getSelectedPlanDuration() > 1 : false;

  useEffect(() => {
    if (!selectedPlan) return;
    if (paymentType === "emi" && !initialPayment) {
      setInitialPayment(getSelectedPlanEMI().toString());
    }
  }, [selectedPlan, paymentType]);

  const findMatchingPlan = (user, planList, enquiryList) => {
    if (!user || !Array.isArray(planList)) return null;

    let planName = normalizePlanText(user.plan);
    let durationValue = parseDurationValue(user.duration);

    // Do not auto-select a plan from enquiry history for users without an active plan.
    // Converted members should choose a plan explicitly in the Buy Plan flow.

    if (planName) {
      const exactByName = planList.find(
        (p) => normalizePlanText(p.name) === planName
      );
      if (exactByName) return exactByName;

      const partialByName = planList.find((p) => {
        const normalized = normalizePlanText(p.name);
        return normalized.includes(planName) || planName.includes(normalized);
      });
      if (partialByName) return partialByName;
    }

    if (durationValue != null) {
      const exactByDuration = planList.find(
        (p) => parseDurationValue(p.duration) === durationValue
      );
      if (exactByDuration) return exactByDuration;
    }

    return null;
  };

  // Try to find the most recent enquiry for this user that contains a plan preference
  const findPreferredEnquiryPlan = (user, enquiryList) => {
    if (!user || !Array.isArray(enquiryList)) return null;

    const normalizePhone = (p) => {
      if (!p) return null;
      const digits = p.toString().replace(/\D/g, '');
      return digits.length <= 10 ? digits : digits.slice(-10);
    };

    const userPhone = normalizePhone(user.phone || user.mobile || user.user_mobile || user.user_phone);
    const userEmail = (user.email || user.user_email || '').toString().trim().toLowerCase();
    const userName = (user.name || user.username || '').toString().trim().toLowerCase();

    const candidates = enquiryList
      .filter((q) => {
        const qPhone = normalizePhone(q.phone);
        const qEmail = (q.email || '').toString().trim().toLowerCase();
        const qName = (q.name || q.fullname || '').toString().trim().toLowerCase();

        if (userPhone && qPhone && userPhone === qPhone) return true;
        if (userEmail && qEmail && userEmail === qEmail) return true;
        // fallback: match by name similarity (exact lowercase match)
        if (userName && qName && userName === qName) return true;
        return false;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const latest = candidates.find((q) => q.plan_name || q.plan_duration || q.plan);
    if (!latest) return null;
    return { plan: latest.plan_name || latest.plan, duration: latest.plan_duration || latest.duration };
  };

  // ================= FETCH MEMBERS =================
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(MEMBERS_API);
        setMembers(res.data || []);
      } catch (err) {
        console.error("Failed to load members:", err);
      }
    };

    fetchMembers();
  }, []);

  // ================= FETCH PLANS =================
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(PLANS_API);
        setPlans((res.data || []).filter((p) => p.active));
      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await api.get('/enquiries');
        setEnquiries(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchFollowups = async () => {
      try {
        const res = await api.get('/followups');
        setFollowups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load followups', err);
      }
    };

    fetchEnquiries();
    fetchFollowups();
  }, []);

  useEffect(() => {
    if (!selectedUser || plans.length === 0) return;
    const combined = Array.isArray(enquiries) ? [...enquiries] : [];
    if (Array.isArray(followups)) combined.push(...followups);

    // prefer explicit user enquiry/followup preference
    const pref = findPreferredEnquiryPlan(selectedUser, combined);
    if (pref && (pref.plan || pref.duration)) {
      const byName = plans.find(
        (p) => normalizePlanText(p.name) === normalizePlanText(pref.plan)
      );
      if (byName && byName.id !== selectedPlan?.id) {
        setSelectedPlan(byName);
        return;
      }

      const durationVal = parseDurationValue(pref.duration);
      if (durationVal != null) {
        const byDuration = plans.find(
          (p) => parseDurationValue(p.duration) === durationVal
        );
        if (byDuration && byDuration.id !== selectedPlan?.id) {
          setSelectedPlan(byDuration);
          return;
        }
      }
    }

    const matchedPlan = findMatchingPlan(selectedUser, plans, combined);
    if (matchedPlan && matchedPlan.id !== selectedPlan?.id) {
      setSelectedPlan(matchedPlan);
    }
  }, [selectedUser, plans, enquiries]);

  // ================= FETCH TRAINERS =================
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/staff");
        const data = res.data || [];
        // Filter trainer-role staff client-side to avoid query param dependency
        const normalized = Array.isArray(data)
          ? data
              .filter((t) => !t.role || t.role.toLowerCase() === "trainer")
              .map((t) => ({ id: t.id, name: t.name || t.username || "Trainer" }))
          : [];
        setTrainers(normalized);
      } catch (err) {
        console.error("Failed to load trainers:", err);
        // Non-critical: trainer dropdown will just show empty
      }
    };

    fetchTrainers();
  }, []);

  // ================= LOAD MEMBER FROM NAVIGATION STATE =================
  useEffect(() => {
    if (location.state?.member && members.length > 0) {
      const stateMember = location.state.member;
      // Find the member in our members array
      const user = members.find(
        (m) =>
          (m.phone && m.phone === stateMember.phone) ||
          (m.id && m.id === stateMember.id)
      );

      if (user) {
        setSelectedUser(user);
        setMemberSearch("");
        
        // FETCH HISTORY
        const uId = user.u_id || user.user_id || user.id;
        api.get(`/memberships/user/${uId}`)
          .then(res =>
            setMemberHistory(
              Array.isArray(res.data) ? res.data : []
            )
          )
          .catch(err =>
            console.error("History fetch error:", err)
          );

        setForm((prev) => ({
          ...prev,
          phone: user.phone || "",
          email: user.email || "",
          address: user.address || "",
          height: user.height || "",
          weight: user.weight || "",
          bmi: user.bmi || "",
        }));

        const forceChange = location.state?.forceChange;
        const matchedPlan = findMatchingPlan(user, plans, enquiries);
        if (matchedPlan && !forceChange) {
          setSelectedPlan(matchedPlan);
        }
      }
    }
  }, [location.state, members, plans, enquiries]);

  // ================= CALCULATE BMI =================
  useEffect(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    if (h > 0 && w > 0) {
      const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(2);
      setForm(prev => ({ ...prev, bmi: bmiVal }));
    }
  }, [form.height, form.weight]);

  // ================= CALCULATE END DATE =================
  useEffect(() => {
    if (!selectedPlan) return;

    const durationMonths = parseDurationValue(selectedPlan.duration) || 0;

    const start = new Date(form.startDate || today);
    const end = new Date(start);

    // Use 30 days per month for consistent plan durations
    end.setDate(start.getDate() + (durationMonths * 30));

    setForm((prev) => ({
      ...prev,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan, form.startDate]);

  // ================= AOS =================
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);



  // ================= GENERATE PDF =================
  const generateAndDownloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22); // Orange
    doc.text("GYM MEMBERSHIP RECEIPT", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
    doc.text(`Receipt No: REC-${Math.floor(Math.random() * 1000000)}`, 15, 45);

    // Member Info
    doc.setFontSize(14);
    doc.setTextColor(249, 115, 22);
    doc.text("Member Details", 15, 60);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${selectedUser?.name || selectedUser?.username || "Member"}`, 15, 70);
    doc.text(`Mobile: ${form.phone}`, 15, 80);
    doc.text(`Email: ${form.email}`, 15, 90);

    // Plan Info
    const paidNow = paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal();
    const paymentModeLabel = paymentType === "emi" && isEMIAllowed ? "EMI" : form.paymentMode;

    const originalPrice = parseDecimal(selectedPlan?.finalPrice ?? selectedPlan?.final_price ?? selectedPlan?.price);
    const discountVal = parseDecimal(discount);

    doc.autoTable({
      startY: 100,
      head: [["Description", "Details"]],
      body: [
        ["Plan Name", selectedPlan?.name || "N/A"],
        ["Duration", `${selectedPlan?.duration || "N/A"} Months`],
        ["Start Date", form.startDate],
        ["End Date", form.endDate],
        ["Original Price", `Rs. ${originalPrice}`],
        ["Discount Amount", `Rs. ${discountVal}`],
        ["Total Amount (After Discount)", `Rs. ${getSelectedPlanTotal()}`],
        ["Amount Paid", `Rs. ${paidNow}`],
        ["Payment Mode", paymentModeLabel],
        ["Payment Status", paymentType === "emi" && isEMIAllowed ? "Partial Payment" : "Paid"],
      ],
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] }, // Orange header
    });

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for joining our gym!", 105, doc.lastAutoTable.finalY + 20, null, null, "center");

    // Download the PDF
    doc.save(`Receipt_${selectedUser?.name || selectedUser?.username || "Member"}.pdf`);

    // Return Data URI for email attachment
    return doc.output('datauristring');
  };

  // ================= EMAIL JS =================
  const sendEmailReceipt = async () => {
    // Always generate and download PDF, even if email is missing
    let pdfDataUri = null;
    try {
      pdfDataUri = generateAndDownloadPDF();
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }

    if (!form.email) {
      console.warn("No email provided, skipping email sending.");
      return;
    }

    const paidNow = paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal();
    const paymentModeLabel = paymentType === "emi" && isEMIAllowed ? "EMI" : form.paymentMode;

    const templateParams = {
      to_name: selectedUser.name || "Member",
      to_email: form.email,
      plan_name: selectedPlan.name,
      duration: selectedPlan.duration,
      start_date: form.startDate,
      end_date: form.endDate,
      amount_paid: paidNow,
      payment_mode: paymentModeLabel,
      total_price: getSelectedPlanTotal(),
      discount_amount: parseDecimal(discount),
      content: pdfDataUri // Attaching the PDF base64 to the email template
    };

    try {
      const response = await emailjs.send(
        'service_gesrr9d',
        'template_3hkcx6m',
        templateParams,
        'e9Nfh3WsTPBxH3bn1'
      );
      console.log('Email sent SUCCESS!', response.status, response.text);
    } catch (error) {
      console.error('Email sent FAILED...', error);
    }
  };

  // ================= ASSIGN PLAN =================
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      alert("Select member and plan");
      return;
    }

    setLoading(true);
    try {
      const planTotal = getSelectedPlanTotal();
      const isEMI = paymentType === "emi" && isEMIAllowed;
      const amountNow = isEMI ? parseDecimal(initialPayment) : planTotal;
      const paymentModeValue = isEMI ? "emi" : form.paymentMode;

      // ===== UPDATE/CREATE MEMBER FIRST =====
      const updatedMember = {
        ...selectedUser,
        phone: form.phone,
        email: form.email,
        address: form.address,
        height: form.height,
        weight: form.weight,
        bmi: form.bmi,
        plan: selectedPlan.name,
        duration: selectedPlan.duration,
        joinDate: form.startDate,
        expiryDate: form.endDate,
        status: location.pathname.startsWith("/trainer") ? "pending" : "active",
      };

      let finalUserId = selectedUser.u_id || selectedUser.user_id || selectedUser.id;
      let finalUserUuid = selectedUser.u_uuid || selectedUser.user_id;

      try {
        let memberRes;
        if (selectedUser.id) {
          memberRes = await api.put(`${MEMBERS_API}/${selectedUser.id}`, updatedMember);
        } else {
          memberRes = await api.post(MEMBERS_API, updatedMember);
        }

        if (memberRes && memberRes.data) {
          finalUserId = memberRes.data.u_id || memberRes.data.user_id || memberRes.data.id || finalUserId;
          finalUserUuid = memberRes.data.u_uuid || memberRes.data.user_id || finalUserUuid;
        }
      } catch (error) {
        const errMsg =
          error?.response?.data?.message || error?.message || "Plan assign failed";
        alert(errMsg);
        return;
      }

      // ===== SAVE OR UPDATE MEMBERSHIP HISTORY =====
      const originalPrice = parseDecimal(
        selectedPlan.finalPrice ?? selectedPlan.final_price ?? selectedPlan.price
      );
      const discountVal = parseDecimal(discount);

      const membershipData = {
        userId: finalUserId,
        userName: selectedUser.name || selectedUser.username,
        userEmail: form.email,
        userPhone: form.phone,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: planTotal,
        pricePaid: amountNow,
        secondPaymentPaid: 0,
        duration: selectedPlan.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentMode: paymentModeValue,
        paymentDate: form.paymentDate || today,
        paymentStatus: isEMI ? "Pending" : "Paid",
        status: location.pathname.startsWith("/trainer") ? "pending" : "active",
        referredBy: user?.username || user?.name || profileName || "",
        trainerId: user?.user_id || user?.id || null,
        trainerName: profileName || user?.username || user?.name || "",
        discount: discountVal,
        amount: originalPrice,
      };

      const activeOrPendingMembership = memberHistory
        .filter((h) => h && h.status)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .find((h) => ["active", "pending"].includes((h.status || "").toLowerCase()));

      if (activeOrPendingMembership) {
        await api.put(`/memberships/${activeOrPendingMembership.id}`, membershipData);
      } else {
        await api.post("/memberships", membershipData);
      }

      // ===== OPTIONAL ASSIGN TRAINER =====
      if (selectedTrainer && selectedTrainer !== "") {
        const assignPayload = {
          userId: finalUserId,
          username: selectedUser.username || selectedUser.name || "",
          userEmail: selectedUser.userEmail || selectedUser.email || "",
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          planDuration: selectedPlan.duration,
          planStartDate: form.startDate,
          planEndDate: form.endDate,
          planPrice: selectedPlan.finalPrice ?? selectedPlan.final_price,
          trainerId: selectedTrainer,
          trainerName:
            trainers.find((t) => t.id === selectedTrainer)?.name || "",
          trainerSource: "staff",
          status: "active",
          updatedAt: new Date().toISOString(),
          sessionTime: sessionTime || null,
        };
        await api.post("/assignments", { assignments: [assignPayload] });
      }

      alert("Plan assigned successfully");

      // sendWhatsApp();
      await sendEmailReceipt();

      navigate(location.pathname.startsWith("/trainer") ? "/trainer" : "/admin/members");
    } catch (err) {
      console.error(err);
      alert("Plan save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white min-h-screen p-6">

      <div className="grid md:grid-cols-2 gap-10">

        {/* LEFT FORM */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          {/* SELECT MEMBER */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Select Member</label>
            <div className="relative">
              {/* Search Input */}
              <div className="flex items-center gap-2 px-3 py-3 bg-gray-900 rounded-lg border border-white/10 focus-within:ring-2 focus-within:ring-orange-500">
                <Search size={18} className="text-white flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onFocus={() => setShowMemberDropdown(true)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                />
                {memberSearch && (
                  <button
                    onClick={() => {
                      setMemberSearch("");
                      setSelectedUser(null);
                      setSelectedPlan(null);
                    }}
                    className="text-white hover:text-white/80 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              {showMemberDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {getFilteredMembers().length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {memberSearch ? "No members found" : "No members available"}
                    </div>
                  ) : (
                    getFilteredMembers().map((m) => {
                      const uniqueKey = `${m.source}-${m.id || m.u_id}`;
                      const isSelected =
                        selectedUser?.source === m.source &&
                        (selectedUser?.id === m.id || selectedUser?.u_id === m.u_id);

                      return (
                        <button
                          key={uniqueKey}
                          onClick={() => {
                            const user = members.find(
                              (member) =>
                                member.source === m.source &&
                                (member.id === m.id || member.u_id === m.u_id)
                            );

                            setSelectedUser(user);
                            setMemberSearch("");
                            setShowMemberDropdown(false);

                            // FETCH HISTORY
                            if (user) {
                              const uId = user.u_id || user.user_id || user.id;
                              api.get(`/memberships/user/${uId}`)
                                .then(res =>
                                  setMemberHistory(
                                    Array.isArray(res.data) ? res.data : []
                                  )
                                )
                                .catch(err =>
                                  console.error("History fetch error:", err)
                                );

                              setForm((prev) => ({
                                ...prev,
                                phone: user.phone || "",
                                email: user.email || "",
                                address: user.address || "",
                                height: user.height || "",
                                weight: user.weight || "",
                                bmi: user.bmi || "",
                              }));

                              // First try to find a preferred plan from enquiries for this user
                              const combined = Array.isArray(enquiries) ? [...enquiries] : [];
                              if (Array.isArray(followups)) combined.push(...followups);
                              const pref = findPreferredEnquiryPlan(user, combined);
                              if (pref && (pref.plan || pref.duration)) {
                                // try exact name match
                                const byName = plans.find(
                                  (p) => normalizePlanText(p.name) === normalizePlanText(pref.plan)
                                );
                                if (byName) {
                                  setSelectedPlan(byName);
                                  return;
                                }

                                // try match by duration if provided
                                const durationVal = parseDurationValue(pref.duration);
                                if (durationVal != null) {
                                  const byDuration = plans.find(
                                    (p) => parseDurationValue(p.duration) === durationVal
                                  );
                                  if (byDuration) {
                                    setSelectedPlan(byDuration);
                                    return;
                                  }
                                }
                              }

                              const matchedPlan = findMatchingPlan(user, plans, combined);
                              if (matchedPlan) {
                                setSelectedPlan(matchedPlan);
                                return;
                              }
                            }

                            setSelectedPlan(null);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                            isSelected
                              ? "bg-orange-500/20 text-orange-400"
                              : "text-white"
                          }`}
                        >
                          <div className="font-medium">{m.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {m.phone}
                            {m.email && ` • ${m.email}`}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Member Display */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedUser.name || selectedUser.username || "Member"}
                  </p>
                  <p className="text-xs text-gray-400">{selectedUser.phone}</p>
                  {selectedUser.plan && selectedUser.plan !== 'user' && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Current Plan:</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-orange-400 text-[10px] font-bold">
                        {selectedUser.plan} ({selectedUser.duration || "N/A"})
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setMemberSearch("");
                    setSelectedPlan(null);
                    setForm((prev) => ({
                      ...prev,
                      phone: "",
                      email: "",
                      address: "",
                      height: "",
                      weight: "",
                      bmi: "",
                    }));
                  }}
                  className="text-white hover:text-white/80"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Close dropdown when clicking outside */}
          {showMemberDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMemberDropdown(false)}
            />
          )}

          {/* PHONE */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Mobile Number</label>
            <input
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.phone}
              placeholder="Enter mobile number"
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.email}
              placeholder="Enter email address"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* ADDRESS */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <textarea
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.address}
              placeholder="Enter full address"
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />
          </div>

          {/* HEIGHT WEIGHT BMI */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 175"
                value={form.height}
                onChange={(e) =>
                  setForm({ ...form, height: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 70"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">BMI</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Auto-calculated"
                value={form.bmi}
                onChange={(e) =>
                  setForm({ ...form, bmi: e.target.value })
                }
              />
            </div>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10"
              />
            </div>
          </div>

          {/* PAYMENT TYPE */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Payment Type</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="full">Full Payment</option>
              <option value="emi" disabled={!isEMIAllowed}>
                EMI
              </option>
            </select>
            {selectedPlan && !isEMIAllowed && (
              <p className="mt-2 text-xs text-red-400">
                EMI is available only for plans longer than 1 month.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Payment Mode</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.paymentMode}
              onChange={(e) =>
                setForm({ ...form, paymentMode: e.target.value })
              }
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {/* PAYMENT DATE */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Payment Date</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
              }
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10"
            />
          </div>

          {/* DISCOUNT AMOUNT */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Discount Amount (₹)</label>
            <input
              type="number"
              min="0"
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10"
              placeholder="Enter discount amount"
              value={discount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  setDiscount(val);
                }
              }}
            />
          </div>

          {/* REFERRED BY — trainer route only, auto-filled with logged-in trainer's name */}
          {location.pathname.startsWith("/trainer") && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Referred By</label>
              <input
                type="text"
                placeholder="Enter referrer name (if any)"
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
              />
            </div>
          )}

          {selectedPlan && paymentType === "emi" && isEMIAllowed && (
            <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/50 shadow-lg shadow-orange-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">EMI Payment Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Plan Price</p>
                  <p className="text-white font-bold text-2xl">₹{getSelectedPlanTotal()}</p>
                  <p className="text-gray-500 text-xs mt-1">{getSelectedPlanDuration()} months duration</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Payment Method</p>
                  <p className="text-orange-400 font-bold text-2xl">30-Day Plan</p>
                  <p className="text-gray-500 text-xs mt-1">Pay balance in 30 days</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
                  Initial Payment Amount (Today)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white font-semibold text-lg">₹</span>
                  <input
                    type="number"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10 hover:border-orange-500/50 transition-all"
                    placeholder="Enter initial payment amount"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Amount to be collected today</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-4 rounded-xl border border-green-500/30">
                  <p className="text-green-400 text-xs uppercase tracking-wide font-semibold mb-1">Amount Collected Today</p>
                  <p className="text-white font-bold text-xl">₹{parseDecimal(initialPayment).toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 p-4 rounded-xl border border-blue-500/30">
                  <p className="text-blue-400 text-xs uppercase tracking-wide font-semibold mb-1">Remaining Balance</p>
                  <p className="text-white font-bold text-xl">₹{(getSelectedPlanTotal() - parseDecimal(initialPayment)).toFixed(2)}</p>
                  <p className="text-blue-400 text-xs mt-1">Due in 30 days</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 p-4 rounded-xl border border-purple-500/30">
                  <p className="text-purple-400 text-xs uppercase tracking-wide font-semibold mb-1">Due Date</p>
                  <p className="text-white font-bold text-lg">
                    {(() => {
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + 30);
                      return dueDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                    })()}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-2">📋 Payment Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Step 1: Pay Today</span>
                    <span className="text-green-400 font-semibold">₹{parseDecimal(initialPayment).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Step 2: Pay in 30 Days</span>
                    <span className="text-blue-400 font-semibold">₹{(getSelectedPlanTotal() - parseDecimal(initialPayment)).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Total Amount</span>
                    <span className="text-orange-400">₹{getSelectedPlanTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAssignPlan}
            disabled={loading}
            className="mt-5 w-full py-3 bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Assigning Plan..." : <>
              Assign Plan ₹{selectedPlan ? (paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal()) : 0}
            </>}
          </button>
        </div>

        {/* RIGHT PLAN SELECT */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          <h2 className="text-xl mb-4 font-semibold text-white">Select Plan</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Gym Plan</label>
            <div className="relative">
              {/* Search Input */}
              <div className="flex items-center gap-2 px-3 py-3 bg-gray-900 rounded-lg border border-white/10 focus-within:ring-2 focus-within:ring-orange-500">
                <Search size={18} className="text-white flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by plan name, duration, or price..."
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  onFocus={() => setShowPlanDropdown(true)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                />
                {planSearch && (
                  <button
                    onClick={() => {
                      setPlanSearch("");
                    }}
                    className="text-white hover:text-white/80 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              {showPlanDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {getFilteredPlans().length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {planSearch ? "No plans found" : "No plans available"}
                    </div>
                  ) : (
                    getFilteredPlans().map((p) => {
                      const isSelected = selectedPlan?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPlan(p);
                            setPlanSearch("");
                            setShowPlanDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                            isSelected
                              ? "bg-orange-500/20 text-orange-400"
                              : "text-white"
                          }`}
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {p.duration} • ₹{p.finalPrice ?? p.final_price}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Plan Display */}
            {selectedPlan && (
              <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedPlan.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedPlan.duration} • ₹{selectedPlan.finalPrice ?? selectedPlan.final_price}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setPlanSearch("");
                  }}
                  className="text-white hover:text-white/80"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Close dropdown when clicking outside */}
          {showPlanDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPlanDropdown(false)}
            />
          )}

          {selectedPlan && (
            <div className="p-5 border border-orange-500/30 rounded-xl bg-orange-500/5 mt-4">
              <h3 className="font-bold text-xl text-orange-400 mb-2">
                {selectedPlan.name}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-gray-400">Duration:</span> {selectedPlan.duration}</p>
                <p>
                  <span className="text-gray-400">Base Price:</span>{" "}
                  <span className={parseDecimal(discount) > 0 ? "line-through text-gray-500" : "text-white font-semibold"}>
                    ₹{selectedPlan.finalPrice ?? selectedPlan.final_price}
                  </span>
                </p>
                {parseDecimal(discount) > 0 && (
                  <>
                    <p className="text-green-400">
                      <span className="text-gray-400">Discount Applied:</span> -₹{parseDecimal(discount)}
                    </p>
                    <p className="text-orange-400 font-bold text-lg">
                      <span className="text-gray-400 text-sm font-normal">Final Price:</span> ₹{getSelectedPlanTotal()}
                    </p>
                  </>
                )}
                {selectedPlan.description && (
                  <p className="text-gray-400 text-xs mt-3 italic border-t border-white/5 pt-2">
                    {selectedPlan.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MEMBER HISTORY */}
          {selectedUser && (
            <div className="mt-8">
              <h2 className="text-xl mb-4 font-semibold text-orange-400 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                Membership History
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {memberHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm italic p-4 bg-white/5 rounded-xl border border-white/5">No previous plan history found.</p>
                ) : (
                  memberHistory.map((h, i) => (
                    <div key={h.id || i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-white">{h.planName}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {h.status || 'Past'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                        <div>
                          <p>Original Price: <span className="text-white/60 font-semibold">₹{h.amount || h.price}</span></p>
                          {h.discount > 0 && (
                            <p>Discount: <span className="text-red-400 font-semibold">-₹{h.discount}</span></p>
                          )}
                          <p>Final Price: <span className="text-emerald-400 font-semibold">₹{h.price}</span></p>
                          <p>Paid: ₹{h.pricePaid}</p>
                        </div>
                        <div className="text-right">
                          <p>{new Date(h.startDate).toLocaleDateString()} -</p>
                          <p>{new Date(h.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyPlanadmin;
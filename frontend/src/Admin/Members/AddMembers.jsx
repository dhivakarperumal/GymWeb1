import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api";
const API = `/members`;


const AddMember = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState([]);
  const [originalPlan, setOriginalPlan] = useState(null);
  const [pendingEMIs, setPendingEMIs] = useState([]);

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    gender: "",
    dob: "",
    age: "",
    height: "",
    weight: "",
    bmi: "",
    plan: "",
    duration: "",
    joinDate: dayjs().format("YYYY-MM-DD"),
    expiryDate: "",
    status: "active",
    photo: "",
    notes: "",
    address: "",
    pt_form_completed: false,
    fingerprintId: Math.floor(1000 + Math.random() * 9000).toString(),
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl;
  const isEdit = Boolean(id);

  // ✏️ FETCH PLANS
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        const activePlans = (res.data || []).filter((p) => {
          if (!p.active) return false;
          // Filter out PT Plans (trainer_included)
          const isPT = p.trainerIncluded === true || 
                       p.trainerIncluded === 1 || 
                       p.trainer_included === true || 
                       p.trainer_included === 1;
          return !isPT;
        });
        setPlans(activePlans);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    };
    fetchPlans();
  }, []);

  // ✏️ FETCH MEMBER (EDIT) OR USER (NEW)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get("user_id");

    if (isEdit) {
      const fetchMember = async () => {
        try {
          const res = await api.get(`${API}/${id}`);
          const data = res.data;

          setOriginalPlan(data.plan || null);

          // Fetch memberships to check for pending EMIs
          try {
            const uId = data.u_id || data.user_id || id;
            const membershipsRes = await api.get(`/memberships/user/${uId}`);
            const memberships = Array.isArray(membershipsRes.data) ? membershipsRes.data : [];
            const pending = memberships.filter(m => {
              const pMode = (m.paymentMode || m.payment_mode || '').toLowerCase();
              if (pMode !== 'emi') return false;
              const pStatus = (m.paymentStatus || m.payment_status || '').toLowerCase();
              return pStatus === 'pending' || pStatus === 'partial';
            });
            setPendingEMIs(pending);
          } catch (err) {
            console.error('Failed to load memberships for EMI check:', err);
          }

          setForm({
            ...data,
            username: data.email ? data.email.split('@')[0] : '',
            password: '', // don't prefill
            height: data.height || "",
            weight: data.weight || "",
            bmi: data.bmi || "",
            dob: (function(){
              if (!data.dob) return "";
              const dStr = String(data.dob);
              if (dStr.includes('0000') || dStr.includes('1899')) return "";
              if (dStr.includes('-') && dStr.split('-')[2]?.length === 4) {
                return `${dStr.split('-')[2]}-${dStr.split('-')[1]}-${dStr.split('-')[0]}`;
              }
              const parsed = dayjs(dStr);
              if (parsed.isValid() && parsed.year() > 1900) return parsed.format('YYYY-MM-DD');
              return "";
            })(),
            age: data.age || "",
            plan: data.plan || "",
            duration: data.duration != null ? data.duration.toString() : "",
            status: data.status || "active",
            notes: data.notes || "",
            address: data.address || "",
            pt_form_completed: data.pt_form_completed === 1,
            joinDate: data.join_date ? dayjs(data.join_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            expiryDate: data.expiry_date
              ? dayjs(data.expiry_date).format("YYYY-MM-DD")
              : "",
            fingerprintId: data.fingerprint_id || Math.floor(1000 + Math.random() * 9000).toString(),
          });
        } catch {
          toast.error("Failed to load member");
        }
      };
      fetchMember();
    } else if (userId) {
      // Fetch user info to prefill
      const fetchUser = async () => {
        try {
          const res = await api.get(`/users/${userId}`);
          const data = res.data;
          setForm(prev => ({
            ...prev,
            name: data.username || "",
            username: data.username || "",
            phone: data.mobile || "",
            email: data.email || "",
            password: data.mobile || "", // Default password to mobile
          }));
        } catch {
          console.error("Failed to load user info");
        }
      };
      fetchUser();
    }
  }, [id, isEdit, location.search, plans]);

  const [extensionDays, setExtensionDays] = useState(5);

  const parseDurationValue = (value) => {
    if (value == null || value === "") return null;
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

  const calculateExpiryDate = (joinDate, duration) => {
    const durationMonths = parseDurationValue(duration);
    if (!joinDate || !durationMonths || durationMonths <= 0) return "";
    return dayjs(joinDate).add(durationMonths, "month").format("YYYY-MM-DD");
  };

  // 🎂 AGE
  useEffect(() => {
    if (form.dob) {
      const calculatedAge = dayjs().diff(dayjs(form.dob), 'year');
      setForm((prev) => ({ ...prev, age: calculatedAge >= 0 ? calculatedAge.toString() : "" }));
    } else {
      setForm((prev) => ({ ...prev, age: "" }));
    }
  }, [form.dob]);

  // 📏 BMI
  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const w = Number(form.weight);
      if (h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setForm((prev) => ({ ...prev, bmi }));
      }
    }
  }, [form.height, form.weight]);

  // 📅 AUTO-UPDATE EXPIRY DATE when start date or duration changes
  useEffect(() => {
    const durationMonths = parseDurationValue(form.duration);
    if (form.joinDate && durationMonths && durationMonths > 0) {
      const calculatedExpiry = calculateExpiryDate(form.joinDate, durationMonths);
      setForm((prev) => ({ ...prev, expiryDate: calculatedExpiry }));
    }
  }, [form.joinDate, form.duration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      const uname = value.split('@')[0];
      setForm(prev => ({ ...prev, email: value, username: uname }));
    } else if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, phone: numericValue, password: numericValue }));
    } else if (name === 'dob') {
      setForm(prev => ({ ...prev, dob: value }));
    } else if (name === 'duration') {
      const expiryDate = calculateExpiryDate(form.joinDate, value);
      setForm(prev => ({ ...prev, duration: value, expiryDate }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // 🖼 IMAGE COMPRESS
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image compression failed");
    }
  };

  // 💾 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      setLoading(false);
      return;
    }
    if (!form.phone || form.phone.length !== 10) {
      toast.error("A valid 10-digit phone number is required");
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (isEdit && originalPlan && form.plan && originalPlan !== form.plan && pendingEMIs.length > 0) {
      alert("⚠️ This member has pending EMI! Please clear the EMI first before changing to a new plan.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        dob: form.dob ? dayjs(form.dob).format('YYYY-MM-DD') : "",
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bmi: form.bmi ? Number(form.bmi) : null,
        age: form.age ? Number(form.age) : null,
        duration: form.duration ? Number(form.duration) : null,
        // In edit mode:
        //   - If admin typed a new password → send it
        //   - Otherwise → send the current phone so backend keeps password = mobile
        password: !isEdit
          ? form.password
          : (form.password?.trim() ? form.password.trim() : form.phone),
      };

      console.log('Submitting payload:', payload);

      const res = isEdit 
        ? await api.put(`${API}/${id}`, payload)
        : await api.post(API, payload);

      const data = res.data;
      console.log('Response:', data);

      if (res.status !== 200 && res.status !== 201) {
        toast.error(data.message || data.error || "Error saving member");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Member updated ✅" : "Member added 💪");
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        const basePath = location.pathname.includes('/trainer') ? '/trainer' : '/admin';
        navigate(`${basePath}/members`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Server error");
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

          <h2 className="text-2xl font-semibold text-white mb-6">
            {isEdit ? "Update Member" : "Add Member"}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Full Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Doe" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Username (Auto-generated)</label>
              <input name="username" value={form.username} placeholder="username" readOnly disabled className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-500" />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-white/70 ml-1">Mobile Number <span className="text-red-500">*</span></label>
              <input name="phone" value={form.phone} onChange={handleChange} maxLength={10} placeholder="e.g. 9876543210" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Email Address <span className="text-red-500">*</span></label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Age</label>
              <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 25" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">
                {isEdit ? 'Password (Default = Mobile Number)' : 'Password (Same as Mobile Number)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password || (isEdit ? form.phone : '')}
                  onChange={isEdit ? handleChange : undefined}
                  readOnly={!isEdit}
                  disabled={!isEdit}
                  placeholder={isEdit ? "Leave blank — defaults to mobile number" : "Password"}
                  className={`w-full rounded-lg border px-4 py-3 text-white placeholder-gray-500 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 ${isEdit ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {isEdit && (
                <p className="text-xs text-orange-400/70 ml-1">
                  🔑 Default password = Mobile Number. Change mobile to auto-update password.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Gender</option>
                <option className="text-black">Male</option>
                <option className="text-black">Female</option>
                <option className="text-black">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Height (cm)</label>
              <input name="height" value={form.height} onChange={handleChange} placeholder="e.g. 175" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Weight (kg)</label>
              <input name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 70" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">BMI (Auto-calculated)</label>
              <input name="bmi" value={form.bmi} readOnly placeholder="BMI" className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-500" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">PT Form Status</label>
              <div className="flex items-center gap-3 mt-2 bg-white/5 border border-white/10 p-3 rounded-lg">
                <input
                  type="checkbox"
                  name="pt_form_completed"
                  checked={form.pt_form_completed}
                  onChange={(e) => setForm(prev => ({ ...prev, pt_form_completed: e.target.checked }))}
                  className="w-5 h-5 text-orange-500 bg-transparent border border-white/40 rounded focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-white text-sm font-medium">PT Form Completed</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Fingerprint ID (For Biometric Attendance)</label>
              <div className="flex gap-2">
                <input 
                  name="fingerprintId" 
                  value={form.fingerprintId} 
                  onChange={handleChange} 
                  placeholder="e.g. 1001" 
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, fingerprintId: Math.floor(1000 + Math.random() * 9000).toString() }))}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>



            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="active" className="text-black">Active</option>
                <option value="inactive" className="text-black">Inactive</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Home Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full address"
                rows={1}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Additional Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Health conditions, goals, etc."
                rows={1}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70 ml-1">Profile Photo</label>
              <input type="file" accept="image/*" onChange={handleImage} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {form.photo && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/70 ml-1 mb-2 block">Photo Preview</label>
                <img src={form.photo} alt="preview" className="w-24 h-24 rounded-full object-cover border-2 border-orange-500 shadow-lg shadow-orange-500/20" />
              </div>
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 min-w-[180px] bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-60"
              >
                {loading ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMember;

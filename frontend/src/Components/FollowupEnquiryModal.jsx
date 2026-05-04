import { useState, useEffect } from "react";
import { X, Phone, Mail, Target, History, Clock, ChevronDown } from "lucide-react";
import api from "../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const FollowupEnquiryModal = ({ visible, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState(dayjs());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
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
    status: "pending",
    plan_name: "",
    plan_price: "",
    plan_duration: "",
    organization: "",
    website: "",
    best_time_to_reach: "",
    updated_by: "Website Lead",
    referred_by: "",
    trainer_id: "",
    trainer_name: "",
  });
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    if (!visible) return;
    setCreatedAt(dayjs());
    fetchPlans();
    fetchTrainers();
    resetForm();
  }, [visible]);

  const fetchTrainers = async () => {
    try {
      const res = await api.get("/staff");
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching trainers:", err);
    }
  };

  useEffect(() => {
    if (formData.dob) {
      const age = dayjs().diff(dayjs(formData.dob), "year");
      setFormData(prev => ({ ...prev, age: age >= 0 ? age.toString() : "" }));
    }
  }, [formData.dob]);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans");
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching plans", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
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
      status: "pending",
      plan_name: "",
      plan_price: "",
      plan_duration: "",
      organization: "",
      website: "",
      best_time_to_reach: "",
      updated_by: "Website Lead",
      referred_by: "",
      trainer_id: "",
      trainer_name: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        reg_no: "",
        created_at: createdAt.toISOString(),
      };
      await api.post("/followups", payload);
      toast.success("Followup enquiry submitted!");
      onClose();
    } catch (err) {
      console.error("Error submitting followup enquiry", err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="followup-modal-root fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl w-full max-w-6xl max-h-[93vh] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="p-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2">
              <h2 className="text-2xl font-black text-white">Create New Followup</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">New Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Entry Date</label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={createdAt.format("YYYY-MM-DD")}
                    readOnly
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 outline-none text-xs font-bold"
                  />
                  <input
                    type="time"
                    value={createdAt.format("HH:mm")}
                    readOnly
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Name</label>
                <div className="col-span-2 relative">
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter lead full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                  <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Date Of Birth</label>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-white/20 uppercase">Age</label>
                    <input
                      type="text"
                      value={formData.age}
                      readOnly
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-2.5 text-white outline-none text-xs text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Gender</label>
                <div className="col-span-2 relative group">
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full py-2.5 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="">[SELECT]</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., name@example.com"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                  placeholder="e.g., 9876543210"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 items-start gap-4">
                <label className="text-xs font-bold text-white/60 pt-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="House No, Street, City, State, ZIP"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 items-start gap-4">
                <label className="text-xs font-bold text-white/60 pt-2">Message</label>
                <div className="col-span-2 relative">
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={2}
                    placeholder="Additional details or special requirements..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none resize-none"
                  />
                  <span className="absolute -right-4 top-4 text-red-500 font-bold">*</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Reg. No</label>
                <input
                  type="text"
                  value="NEW"
                  readOnly
                  className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white/60 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Company or Employer name"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Mobile</label>
                <div className="col-span-2 flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10}
                      placeholder="Secondary contact..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                    />
                    <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Select Trainer</label>
                <div className="col-span-2 relative group">
                  <select
                    value={formData.trainer_id || ""}
                    onChange={(e) => {
                      const selectedTrainer = trainers.find(t => t.id.toString() === e.target.value);
                      setFormData({
                        ...formData,
                        trainer_id: e.target.value,
                        trainer_name: selectedTrainer ? (selectedTrainer.name || selectedTrainer.username) : ""
                      });
                    }}
                    className="w-full py-2.5 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="">[SELECT TRAINER]</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id} className="bg-neutral-900">
                        {t.name || t.username} ({t.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Status</label>
                <div className="col-span-2 relative group">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full py-2.5 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="followup">Followup</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Plan</label>
                <div className="col-span-2 relative group">
                  <select
                    value={formData.plan_name}
                    onChange={(e) => {
                      const selectedPlan = plans.find((p) => p.name === e.target.value);
                      setFormData({
                        ...formData,
                        plan_name: e.target.value,
                        plan_price: selectedPlan ? (selectedPlan.finalPrice || selectedPlan.price) : "",
                      });
                    }}
                    className="w-full py-2.5 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="">[SELECT PLAN]</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.name}>
                        {plan.name} - ₹{plan.finalPrice || plan.price}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Plan Price</label>
                <input
                  type="text"
                  value={formData.plan_price ? `₹${formData.plan_price}` : ""}
                  readOnly
                  placeholder="Auto-filled on plan select"
                  className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-orange-400 font-bold outline-none placeholder:text-white/20 placeholder:font-normal placeholder:text-xs"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Updated By</label>
                <input
                  type="text"
                  value={formData.updated_by}
                  readOnly
                  className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white/40 outline-none text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-white/60">Referred By</label>
                <input
                  type="text"
                  value={formData.referred_by}
                  onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                  placeholder="Agent name or Friend's name"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white/5 text-white/60 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              {loading ? "Submitting..." : "CREATE FOLLOWUP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowupEnquiryModal;

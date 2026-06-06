import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft, User, Phone, Mail, MapPin, Calendar,
  Clock, CreditCard, Activity, FileText, Trash2, Pencil,
  Dumbbell, Utensils, Info, CheckCircle, Shield
} from "lucide-react";
import api from "../../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl;

  // State
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, workout, diet

  const [workouts, setWorkouts] = useState([]);
  const [dietPlan, setDietPlan] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [activeDietDay, setActiveDietDay] = useState(null);

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Member Basic Info
      const res = await api.get(`/members/${id}`);
      const memberData = res.data;

      // 2. Fetch Additional Data in parallel
      if (memberData) {
        const userId = memberData.u_id || memberData.user_id || memberData.id;
        const [workoutRes, dietRes, assignRes, staffRes, membershipRes] = await Promise.all([
          api.get("/workouts").catch(() => ({ data: [] })),
          api.get("/diet-plans").catch(() => ({ data: [] })),
          api.get("/assignments").catch(() => ({ data: [] })),
          api.get("/staff").catch(() => ({ data: [] })),
          api.get(`/memberships/user/${userId}`).catch(() => ({ data: [] }))
        ]);

        // Get latest membership price if available
        const userMemberships = Array.isArray(membershipRes.data) ? membershipRes.data : [];
        const activeMembership = userMemberships.find(m => m.status === 'active') || userMemberships[0];

        const enhancedMember = {
          ...memberData,
          price: activeMembership?.price || memberData.price,
          pricePaid: activeMembership?.pricePaid || 0,
          secondPaymentPaid: activeMembership?.secondPaymentPaid || 0,
          payment_status: activeMembership?.paymentStatus || memberData.payment_status,
          discount: activeMembership?.discount || 0,
          amount: activeMembership?.amount || 0,
        };
        setMember(enhancedMember);

        // Filter Workouts
        const myWorkouts = (Array.isArray(workoutRes.data) ? workoutRes.data : [])
          .filter(w => w.member_email?.toLowerCase() === memberData.email?.toLowerCase());
        setWorkouts(myWorkouts);

        // Filter Diet Plans
        const myDiets = (Array.isArray(dietRes.data) ? dietRes.data : [])
          .filter(d => d.member_email?.toLowerCase() === memberData.email?.toLowerCase())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (myDiets.length > 0) {
          const latestDiet = myDiets[0];
          let daysData = latestDiet.days;
          if (typeof daysData === "string") {
            try { daysData = JSON.parse(daysData); } catch (e) { daysData = null; }
          }
          setDietPlan({ ...latestDiet, days: daysData });
          if (daysData) setActiveDietDay(Object.keys(daysData)[0]);
        }

        // Find Assigned Trainer
        const allAssignments = Array.isArray(assignRes.data) ? assignRes.data : [];
        const allStaff = Array.isArray(staffRes.data) ? staffRes.data : [];

        const myAssignment = allAssignments.find(a =>
          String(a.member_id || a.memberId) === String(memberData.id) ||
          String(a.userId) === String(memberData.u_id || memberData.user_id) ||
          String(a.userId) === `m_${memberData.id}` ||
          (a.userEmail && a.userEmail.toLowerCase() === memberData.email?.toLowerCase())
        );

        if (myAssignment) {
          const trainerInfo = allStaff.find(s => String(s.id) === String(myAssignment.trainerId || myAssignment.trainer_id));
          setTrainer({
            name: myAssignment.trainer_name || myAssignment.trainerName || trainerInfo?.name,
            role: myAssignment.trainer_role || "Trainer",
            phone: trainerInfo?.phone || myAssignment.trainer_phone || "N/A",
            email: trainerInfo?.email || "N/A"
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-[0.4em]">Loading Member Profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 text-white">
        <p className="text-white/40 text-lg">Member not found</p>
        <button onClick={() => navigate(returnUrl || "/admin/members")} className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-xl">
          <ChevronLeft size={20} /> Back to Directory
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${member.name}?`)) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success("Deleted successfully");
      navigate(returnUrl || "/admin/members");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/members/${id}`, { ...member, status: newStatus });
      setMember(res.data);
      toast.success(`Member set to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDeletePtPlan = async () => {
    if (!member) return;
    if (!window.confirm(`Delete PT Plan for ${member.name}? This will not affect the normal plan.`)) return;
    try {
      const payload = {
        pt_plan: null,
        pt_join_date: null,
        pt_expiry_date: null,
        pt_duration: null,
        pt_status: null,
        has_pt_plan: false
      };
      const res = await api.put(`/members/${id}`, payload);
      setMember(res.data);
      toast.success("PT Plan removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete PT Plan");
    }
  };

  const handleDeleteNormalPlan = async () => {
    if (!member) return;
    if (!window.confirm(`Delete Normal Plan for ${member.name}? This will not affect the PT plan.`)) return;
    try {
      const payload = {
        plan: null,
        duration: null,
        joinDate: null,
        expiryDate: null
      };
      const res = await api.put(`/members/${id}`, payload);
      setMember(res.data);
      toast.success("Normal plan removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Normal Plan");
    }
  };

  return (
    <div className="min-h-screen pb-12 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(returnUrl || "/admin/members")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="font-bold uppercase tracking-wider text-xs">Back to Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/addmembers/${id}`, { state: { returnUrl: returnUrl || "/admin/members" } })} className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold text-sm">
            <Pencil size={18} className="text-orange-500" />
            Edit Profile
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
            <Trash2 size={18} />
            Terminate
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
          { id: 'workout', label: 'Workout Plan', icon: <Dumbbell size={16} /> },
          { id: 'diet', label: 'Diet Chart', icon: <Utensils size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
              ${activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105 z-10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Profile Card */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white text-4xl font-black mx-auto mb-4 shadow-xl">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{member.name}</h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">ID: #{member.id}</p>

                <button
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl transition-all hover:scale-105 active:scale-95 ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                  title={`Click to set as ${member.status === 'active' ? 'Inactive' : 'Active'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-xs font-bold uppercase">{member.status || 'Active'}</span>
                </button>
              </div>

              {/* Trainer Card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">Assigned Trainer</h3>
                {trainer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <Shield size={24} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{trainer.name}</p>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{trainer.role}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <Phone size={14} className="text-orange-500" />
                        <span>{trainer.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <Mail size={14} className="text-orange-500" />
                        <span className="truncate">{trainer.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-white/20 text-xs font-bold uppercase">No trainer assigned</p>
                    <button onClick={() => navigate("/admin/buyplanadmin")} className="text-orange-500 text-[10px] font-black uppercase mt-2 hover:underline">Assign Now</button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">Contact</h3>
                <div className="space-y-4">
                  <InfoRow icon={<Phone size={18} className="text-orange-500" />} label="Phone" value={member.phone || 'N/A'} />
                  <InfoRow icon={<Mail size={18} className="text-orange-500" />} label="Email" value={member.email || member.user_email || 'N/A'} />
                  <InfoRow icon={<MapPin size={18} className="text-orange-500" />} label="Address" value={member.address || 'N/A'} />
                </div>
              </div>
            </div>

            {/* Right: Membership & Metrics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-sm font-black text-white/20 uppercase tracking-widest">Membership</h3>
                    {member.payment_status && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${member.payment_status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                        {member.payment_status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <InfoRow icon={<CreditCard size={18} className="text-orange-500" />} label="Plan" value={member.plan || 'No Active Plan'} />
                    <InfoRow icon={<Calendar size={18} className="text-orange-500" />} label="Joined" value={member.join_date ? dayjs(member.join_date).format('MMM DD, YYYY') : 'N/A'} />
                    <InfoRow icon={<Clock size={18} className="text-orange-500" />} label="Expiry" value={member.expiry_date ? dayjs(member.expiry_date).format('MMM DD, YYYY') : 'N/A'} />

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      {member.amount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/40">Original Price</span>
                          <span className="text-white/80 font-semibold">₹{member.amount}</span>
                        </div>
                      )}
                      {member.discount > 0 && (
                        <div className="flex justify-between items-center text-sm text-red-400/80">
                          <span className="text-white/40">Discount</span>
                          <span className="font-semibold">-₹{member.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40">Total Price</span>
                        <span className="text-white font-bold">₹{member.price || '0'}</span>
                      </div>
                      {member.pricePaid > 0 && (
                        <div className="flex justify-between items-center text-sm text-emerald-400/80">
                          <span className="text-white/40">Initial Paid</span>
                          <span className="font-bold">₹{member.pricePaid}</span>
                        </div>
                      )}
                      {member.secondPaymentPaid > 0 && (
                        <div className="flex justify-between items-center text-sm text-cyan-400/80">
                          <span className="text-white/40">Second Paid</span>
                          <span className="font-bold">₹{member.secondPaymentPaid}</span>
                        </div>
                      )}
                      {member.price > (member.pricePaid || 0) + (member.secondPaymentPaid || 0) && (
                        <div className="flex justify-between items-center text-sm text-orange-400">
                          <span className="text-white/40">Remaining</span>
                          <span className="font-bold">₹{member.price - (member.pricePaid || 0) - (member.secondPaymentPaid || 0)}</span>
                        </div>
                      )}
                    </div>
                    {member.plan && (
                      <div className="pt-4 border-t border-white/10">
                        <button
                          onClick={handleDeleteNormalPlan}
                          className="w-full px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase"
                        >
                          Delete Normal Plan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {(member.pt_plan || member.has_pt_plan) && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="text-sm font-black text-white/20 uppercase tracking-widest">PT Plan</h3>
                      {member.pt_status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${member.pt_status === 'Paid' || member.pt_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {member.pt_status}
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      <InfoRow icon={<CreditCard size={18} className="text-orange-500" />} label="Plan" value={member.pt_plan || 'No Active PT Plan'} />
                      <InfoRow icon={<Calendar size={18} className="text-orange-500" />} label="Joined" value={member.pt_join_date ? dayjs(member.pt_join_date).format('MMM DD, YYYY') : 'N/A'} />
                      <InfoRow icon={<Clock size={18} className="text-orange-500" />} label="Expiry" value={member.pt_expiry_date ? dayjs(member.pt_expiry_date).format('MMM DD, YYYY') : 'N/A'} />
                      {member.pt_duration && (
                        <InfoRow icon={<Activity size={18} className="text-orange-500" />} label="Duration" value={`${member.pt_duration} Days`} />
                      )}
                      
                      {(member.pt_plan || member.has_pt_plan) && (
                        <div className="pt-4 border-t border-white/10">
                          <button
                            onClick={handleDeletePtPlan}
                            className="w-full px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase"
                          >
                            Delete PT Plan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 md:col-span-2">
                  <h3 className="text-sm font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">Health Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard label="Height" value={member.height} unit="cm" />
                    <MetricCard label="Weight" value={member.weight} unit="kg" />
                    <div className="col-span-2">
                      <MetricCard label="BMI Index" value={member.bmi} color="text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">Notes</h3>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl min-h-[100px]">
                  <p className="text-white/60 text-sm italic">{member.notes || 'No additional notes.'}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${member.pt_form_completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">PT Registration Form</h4>
                    <p className="text-white/40 text-xs">{member.pt_form_completed ? 'Form completed' : 'Awaiting completion'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {member.pt_form_completed ? (
                    <>
                      <button
                        onClick={() => navigate(`/admin/pt-form/print/${id}`)}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                      >
                        View Form
                      </button>
                      <button
                        onClick={() => navigate(`/admin/pt-form?member_id=${id}&edit=true`)}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition-all bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                        Edit Form
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/admin/pt-form?member_id=${id}`)}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition-all bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      Complete Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workout' && (
          <div className="space-y-8">
            {workouts.length > 0 ? (
              workouts.map((plan, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-6 bg-white/5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.category}</h3>
                      <p className="text-white/40 text-xs font-bold uppercase mt-1">{plan.goal} • {plan.duration_weeks} Weeks • {plan.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Assigned By</p>
                      <p className="text-orange-500 font-bold text-sm">{plan.trainer_name}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(plan.days || {}).map(([day, exercises], i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <p className="text-orange-500 font-bold uppercase text-xs mb-4 border-b border-white/5 pb-2">{day}</p>
                          <div className="space-y-3">
                            {exercises.map((ex, j) => (
                              <div key={j} className="flex items-center justify-between text-sm">
                                <span className="text-white/80">{ex.name}</span>
                                <span className="text-white/30 text-xs">{ex.time || ex.sets}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-white/5 border border-white/10 border-dashed rounded-3xl">
                <Dumbbell size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/40 font-bold uppercase">No workout plans found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diet' && (
          <div className="space-y-8">
            {dietPlan ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{dietPlan.title || 'Diet Chart'}</h3>
                    <p className="text-white/40 text-xs font-bold uppercase mt-1">Nutritional Meal Plan</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(dietPlan.days || {}).map((day) => {
                      const displayDay = !isNaN(day) ? `Day ${parseInt(day) + 1}` : day;
                      return (
                        <button
                          key={day}
                          onClick={() => setActiveDietDay(day)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeDietDay === day ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                          {displayDay}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeDietDay && dietPlan.days[activeDietDay] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(dietPlan.days[activeDietDay])
                      .filter(([meal]) => meal !== 'notes')
                      .map(([meal, data], i) => {
                        const items = data.items || [];
                        const totalCalories = items.reduce((sum, item) => sum + (parseInt(item.calories) || 0), 0);

                        return (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-orange-500 font-bold uppercase text-[10px]">{meal}</span>
                                {data.time && <span className="text-[10px] text-white/30">{data.time}</span>}
                              </div>
                              <div className="space-y-2 mb-4">
                                {items.length > 0 ? (
                                  items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-sm">
                                      <span className="text-white font-bold pr-2">{item.food}</span>
                                      <span className="text-white/40 text-xs shrink-0">{item.quantity}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-white/40 font-bold text-sm">N/A</p>
                                )}
                              </div>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                              <span className="text-[10px] text-white/20 font-bold uppercase">Energy</span>
                              <span className="text-emerald-500 font-bold text-xs">{totalCalories > 0 ? totalCalories : '-'} kcal</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-white/20 italic">Select a day to view nutrition info</div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-white/5 border border-white/10 border-dashed rounded-3xl">
                <Utensils size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/40 font-bold uppercase">No diet plan found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components
const InfoRow = ({ icon, label, value }) => (
  <div className="flex gap-4">
    <div className="shrink-0 mt-1">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-white/80 font-bold text-sm">{value}</p>
    </div>
  </div>
);

const MetricCard = ({ label, value, unit, color = "text-white" }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-xl font-bold ${color}`}>
      {value || '-'} {value && unit && <span className="text-xs font-normal opacity-40 ml-1">{unit}</span>}
    </p>
  </div>
);

export default MemberDetails;

import React, { useState, useEffect, useRef } from "react";
import { X, Printer, User, Phone, MapPin, Activity, FileText, Clock } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const AdminJoinForm = ({ isOpen, onClose, memberData }) => {
  const printRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dob: "", age: "", gender: "",
    blood_group: "", address: "", employer: "", occupation: "",
    height: "", weight: "", bmi: "", fitness_goal: "", medical_history: "",
    emergency_contact_name: "", emergency_contact_relationship: "",
    emergency_contact_address: "", emergency_contact_phone_home: "",
    emergency_contact_phone_work: "", participant_name: "",
    consent_agree: false, termsAccepted: false,
  });

  useEffect(() => {
    if (isOpen && memberData) {
      setViewMode(false);
      const m = memberData;
      setMember(m);
      let consentData = {};
      try { consentData = typeof m.consent_data === "string" ? JSON.parse(m.consent_data) : (m.consent_data || {}); } catch (e) {}
      setFormData({
        name: m.name || "", email: m.email || m.user_email || "", phone: m.phone || "",
        dob: m.dob ? dayjs(m.dob).format("YYYY-MM-DD") : "", age: m.age || "",
        gender: m.gender || "", blood_group: m.blood_group || "", address: m.address || "",
        employer: m.employer || "", occupation: m.occupation || "",
        height: m.height || "", weight: m.weight || "", bmi: m.bmi || "",
        fitness_goal: m.fitness_goal || "", medical_history: m.medical_history || m.message || "",
        emergency_contact_name: m.emergency_contact_name || "",
        emergency_contact_relationship: m.emergency_contact_relationship || "",
        emergency_contact_address: m.emergency_contact_address || "",
        emergency_contact_phone_home: m.emergency_contact_phone_home || "",
        emergency_contact_phone_work: m.emergency_contact_phone_work || "",
        participant_name: consentData.participant_name || m.participant_name || m.name || "",
        consent_agree: consentData.agree === true || consentData.agree === "true" || m.consent_agree === true,
        termsAccepted: m.termsAccepted === true || m.termsAccepted === "true" || consentData.agree === true,
      });
    }
  }, [isOpen, memberData]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      if (h > 0) setFormData(prev => ({ ...prev, bmi: (w / (h * h)).toFixed(1) }));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (formData.dob) {
      const age = dayjs().diff(dayjs(formData.dob), "year");
      setFormData(prev => ({ ...prev, age: age >= 0 ? String(age) : "" }));
    }
  }, [formData.dob]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) { toast.error("Please accept the Terms & Conditions."); return; }
    if (!formData.consent_agree) { toast.error("Please agree to the Informed Consent Form."); return; }
    try {
      setLoading(true);
      const payload = { ...member, ...formData, consent_data: JSON.stringify({ participant_name: formData.participant_name, agree: formData.consent_agree }) };
      await api.put(`/members/${member.id}`, payload);
      toast.success("Join form saved successfully!");
      setViewMode(true);
    } catch (err) {
      toast.error("Failed to save join form");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!isOpen) return null;

  if (viewMode) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl relative print-container">
          <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; color: black !important; background: white !important; overflow: visible !important; max-height: none !important; } .no-print { display: none !important; } }`}</style>
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 no-print shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Join Form — Print View</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setViewMode(false)} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">Edit Form</button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 rounded-xl text-white hover:bg-orange-600 transition-all font-bold text-sm"><Printer size={18} /> Print Form</button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X size={20} /></button>
            </div>
          </div>
          <div className="p-8" ref={printRef}>
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200"><h1 className="text-3xl font-black tracking-wider text-gray-900">Join Form</h1></div>
            <div className="space-y-6 text-sm">
              <div className="pb-4 border-b border-gray-200"><h2 className="text-lg font-bold mb-3 uppercase">Personal Information</h2><div className="grid grid-cols-2 gap-2"><p><strong>Full Name: </strong>{formData.name}</p><p><strong>Email: </strong>{formData.email}</p><p><strong>Phone: </strong>{formData.phone}</p><p><strong>Date of Birth: </strong>{formData.dob}</p><p><strong>Age: </strong>{formData.age} Years</p><p><strong>Gender: </strong>{formData.gender}</p><p><strong>Blood Group: </strong>{formData.blood_group}</p><p className="col-span-2"><strong>Address: </strong>{formData.address}</p></div></div>
              <div className="pb-4 border-b border-gray-200"><h2 className="text-lg font-bold mb-3 uppercase">Work & Career</h2><div className="grid grid-cols-2 gap-2"><p><strong>Company: </strong>{formData.employer}</p><p><strong>Occupation: </strong>{formData.occupation}</p></div></div>
              <div className="pb-4 border-b border-gray-200"><h2 className="text-lg font-bold mb-3 uppercase">Emergency Contact</h2><div className="grid grid-cols-2 gap-2"><p><strong>Name: </strong>{formData.emergency_contact_name}</p><p><strong>Relationship: </strong>{formData.emergency_contact_relationship}</p><p><strong>Home Phone: </strong>{formData.emergency_contact_phone_home}</p><p><strong>Work Phone: </strong>{formData.emergency_contact_phone_work}</p><p className="col-span-2"><strong>Address: </strong>{formData.emergency_contact_address}</p></div></div>
              <div className="pb-4 border-b border-gray-200"><h2 className="text-lg font-bold mb-3 uppercase">Fitness Profile</h2><div className="grid grid-cols-2 gap-2"><p><strong>Height: </strong>{formData.height} cm</p><p><strong>Weight: </strong>{formData.weight} kg</p><p><strong>BMI: </strong>{formData.bmi}</p><p className="col-span-2"><strong>Fitness Goals: </strong>{formData.fitness_goal}</p><p className="col-span-2"><strong>Medical History: </strong>{formData.medical_history}</p></div></div>
              <div><h2 className="text-lg font-bold mb-3 uppercase">Informed Consent Form</h2><p className="font-bold text-center mb-3">Please Fill In All Information Requested Below</p><p className="mb-2">I <strong>{formData.participant_name}</strong> give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</p><p className="mb-4 font-bold">[ {formData.consent_agree ? "X" : " "} ] I Agree</p><div className="space-y-2 text-gray-700 leading-relaxed"><p><strong>BENEFITS: </strong>Participation in a regular program of physical activity has been shown to produce positive changes in a number of organ systems. These changes include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance.</p><p><strong>RISKS: </strong>Exercise carries some risk to the musculoskeletal system (sprains, strains) and cardiorespiratory system (dizziness, discomfort in breathing, heart attack). I certify that I know of no medical problem that would increase my risk of illness or injury.</p><p><strong>TESTING AND EVALUATION RESULTS: </strong>I understand I will undergo initial testing to determine my current physical fitness status. My individual results will be made available only to me and are not intended to replace any medical test or physician services. By signing this consent form, I understand I am personally responsible for my actions during my tenure at DAP Unisex Fitness Studio.</p></div><p className="mt-6 font-bold text-center">* No Refund • No Transfer • No Extension • No Freezing</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
          <h1 className="text-xl font-bold flex items-center gap-3 text-white"><FileText className="text-orange-500" />Join Form — {member?.name}</h1>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all"><X size={20} /></button>
        </div>
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><User size={16} /> Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Phone Number *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Date of Birth *</label><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [color-scheme:dark] focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Current Age</label><div className="relative"><input type="text" value={formData.age} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/50" /><span className="absolute right-4 top-2 text-white/30 text-sm">Years</span></div></div>
                <div><label className="block text-sm text-white/60 mb-1">Blood Group</label><select name="blood_group" value={formData.blood_group} onChange={handleInputChange} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"><option value="">Select Blood Group</option>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                <div><label className="block text-sm text-white/60 mb-1">Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm text-white/60 mb-1">Permanent Address</label><textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter your full residential address..." rows="2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><Clock size={16} /> Work & Career</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Company / Employer</label><input type="text" name="employer" value={formData.employer} onChange={handleInputChange} placeholder="Company name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Job Title / Occupation</label><input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="e.g. Software Engineer" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><Phone size={16} /> Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Guardian/Contact Name</label><input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} placeholder="Full name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Relationship</label><input type="text" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleInputChange} placeholder="e.g. Father, Spouse, Friend" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Home / Primary Phone</label><input type="tel" name="emergency_contact_phone_home" value={formData.emergency_contact_phone_home} onChange={handleInputChange} placeholder="e.g. 9876543210" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Work / Secondary Phone</label><input type="tel" name="emergency_contact_phone_work" value={formData.emergency_contact_phone_work} onChange={handleInputChange} placeholder="Alternative number" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div className="md:col-span-2"><label className="block text-sm text-white/60 mb-1">Emergency Contact Address</label><textarea name="emergency_contact_address" value={formData.emergency_contact_address} onChange={handleInputChange} placeholder="Guardian's address..." rows="2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><Activity size={16} /> Fitness Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Height (cm)</label><input type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Height in cm" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Weight (kg)</label><input type="number" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Weight in kg" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Current BMI</label><input type="text" value={formData.bmi || "0.0"} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/50" /></div>
                <div className="md:col-span-3"><label className="block text-sm text-white/60 mb-1">What are your fitness goals?</label><textarea name="fitness_goal" value={formData.fitness_goal} onChange={handleInputChange} placeholder="Describe what you want to achieve..." rows="2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50" /></div>
                <div className="md:col-span-3"><label className="block text-sm text-white/60 mb-1">Any Medical History or Notes?</label><textarea name="medical_history" value={formData.medical_history} onChange={handleInputChange} placeholder="List any injuries, conditions, or specific requests..." rows="3" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><MapPin size={16} /> Informed Consent Form</h2>
              <div className="space-y-5">
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" /><span className="text-sm text-white/80">Please read the Terms & Conditions</span></label>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-5">
                  <p className="font-bold text-center text-white">Please Fill In All Information Requested Below</p>
                  <div className="flex flex-col md:flex-row items-center gap-3"><span className="text-white whitespace-nowrap">I</span><input type="text" name="participant_name" value={formData.participant_name} onChange={handleInputChange} placeholder="Full Name" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-center placeholder-white/30 focus:outline-none focus:border-orange-500/50" /><span className="text-white/70 text-sm text-center">give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</span></div>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="consent_agree" checked={formData.consent_agree} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" /><span className="font-bold text-white">I Agree</span></label>
                  <div className="space-y-4 text-sm text-white/60 leading-relaxed border-t border-white/10 pt-4">
                    <div><h3 className="font-bold text-white mb-1">BENEFITS</h3><p>Participation in a regular program of physical activity has been shown to produce positive changes in a number of organ systems. These changes include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance.</p></div>
                    <div><h3 className="font-bold text-white mb-1">RISKS</h3><p>Exercise carries some risk to the musculoskeletal system (sprains, strains) and cardiorespiratory system (dizziness, discomfort in breathing, heart attack). I certify that I know of no medical problem that would increase my risk of illness or injury.</p></div>
                    <div><h3 className="font-bold text-white mb-1">TESTING AND EVALUATION RESULTS</h3><p>I understand I will undergo initial testing to determine my current physical fitness status including health inventory, body composition, treadmill testing, muscular fitness and flexibility screening.</p><p className="mt-1">My individual results will be made available only to me and are not intended to replace any medical test or physician services.</p><p className="mt-1">By signing this consent form, I understand I am personally responsible for my actions during my tenure at DAP Unisex Fitness Studio.</p></div>
                  </div>
                  <p className="text-center text-white/40 text-sm font-bold">* No Refund • No Transfer • No Extension • No Freezing</p>
                </div>
              </div>
            </section>
            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all font-bold">Cancel</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-orange-500 rounded-xl text-white font-bold hover:bg-orange-600 transition-all disabled:opacity-50">{loading ? "Saving..." : "Submit Join Now"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminJoinForm;

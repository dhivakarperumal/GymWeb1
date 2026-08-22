import React, { useState, useEffect } from "react";
import { X, Printer, User, Phone, MapPin, Activity, FileText, Clock } from "lucide-react";
import dayjs from "dayjs";

const AdminJoinForm = ({ isOpen, onClose, memberData }) => {

  const [member, setMember] = useState(null);
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

  const handlePrint = () => window.print();

  if (!isOpen) return null;

  return (
    <>
      {/* ===== PRINT STYLES — only active during window.print() ===== */}
      <style>{`
        @media screen {
          #join-print-view { display: none; }
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #join-print-view {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            padding: 10mm 12mm !important;
            font-family: Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            z-index: 999999 !important;
          }
          #join-print-view * { visibility: visible !important; }
          #join-print-view h1 { font-size: 18px; text-align: center; margin: 0; flex: 1; }
          #join-print-view .print-header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
          #join-print-view .print-logo { width: 80px; height: auto; object-fit: contain; }
          #join-print-view .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #bbb; padding-bottom: 2px; margin: 10px 0 6px; color: #111; }
          #join-print-view .grid1 { display: block !important; }
          #join-print-view .field { margin: 4px 0; font-size: 11px; }
          #join-print-view .consent-text { font-size: 10px; line-height: 1.4; }
          #join-print-view .consent-text p { margin: 3px 0; }
          #join-print-view .consent-text h4 { font-weight: bold; margin: 6px 0 2px; font-size: 10px; }
          #join-print-view .footer-note { text-align: center; font-weight: bold; margin-top: 15px; font-size: 9px; border-top: 1px solid #ccc; padding-top: 6px; }
        }
      `}</style>

      {/* ===== HIDDEN PRINT DOCUMENT (only shows when printing) ===== */}
      <div id="join-print-view">
        <div className="print-header">
          <img src="/images/logo-dark.png" alt="Logo" className="print-logo" onError={(e) => { e.target.onerror = null; e.target.src = "/images/logo.jpeg" }} />
          <h1>Join Form — DAP Unisex Fitness Studio</h1>
          <div style={{ width: '80px' }}></div> {/* Spacer for center alignment */}
        </div>

        <div className="section-title">Personal Information</div>
        <div className="grid1">
          <div className="field"><strong>Full Name: </strong>{formData.name}</div>
          <div className="field"><strong>Email: </strong>{formData.email}</div>
          <div className="field"><strong>Phone: </strong>{formData.phone}</div>
          <div className="field"><strong>Date of Birth: </strong>{formData.dob}</div>
          <div className="field"><strong>Age: </strong>{formData.age} Years</div>
          <div className="field"><strong>Gender: </strong>{formData.gender}</div>
          <div className="field"><strong>Blood Group: </strong>{formData.blood_group}</div>
          <div className="field"><strong>Permanent Address: </strong>{formData.address}</div>
        </div>

        <div className="section-title">Work & Career</div>
        <div className="grid1">
          <div className="field"><strong>Company / Employer: </strong>{formData.employer}</div>
          <div className="field"><strong>Job Title / Occupation: </strong>{formData.occupation}</div>
        </div>

        <div className="section-title">Emergency Contact</div>
        <div className="grid1">
          <div className="field"><strong>Guardian/Contact Name: </strong>{formData.emergency_contact_name}</div>
          <div className="field"><strong>Relationship: </strong>{formData.emergency_contact_relationship}</div>
          <div className="field"><strong>Home Phone: </strong>{formData.emergency_contact_phone_home}</div>
          <div className="field"><strong>Work Phone: </strong>{formData.emergency_contact_phone_work}</div>
          <div className="field"><strong>Emergency Address: </strong>{formData.emergency_contact_address}</div>
        </div>

        <div className="section-title">Fitness Profile</div>
        <div className="grid1">
          <div className="field"><strong>Height: </strong>{formData.height} cm</div>
          <div className="field"><strong>Weight: </strong>{formData.weight} kg</div>
          <div className="field"><strong>BMI: </strong>{formData.bmi}</div>
          <div className="field"><strong>Fitness Goals: </strong>{formData.fitness_goal}</div>
          <div className="field"><strong>Medical History / Notes: </strong>{formData.medical_history}</div>
        </div>

        <div className="section-title">Informed Consent Form</div>
        <div className="consent-text">
          <p>I <strong>{formData.participant_name}</strong> give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</p>
          <p style={{marginTop: "6px"}}><strong>[{formData.consent_agree ? " ✓ " : "   "}] I Agree</strong></p>
          <h4>BENEFITS</h4>
          <p>Participation in a regular program of physical activity has been shown to produce positive changes in a number of organ systems. These changes include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance.</p>
          <h4>RISKS</h4>
          <p>Exercise carries some risk to the musculoskeletal system (sprains, strains) and cardiorespiratory system (dizziness, discomfort in breathing, heart attack). I certify that I know of no medical problem that would increase my risk of illness or injury.</p>
          <h4>TESTING AND EVALUATION RESULTS</h4>
          <p>I understand I will undergo initial testing to determine my current physical fitness status including health inventory, body composition, treadmill testing, muscular fitness and flexibility screening.</p>
          <p style={{marginTop: "4px"}}>My individual results will be made available only to me and are not intended to replace any medical test or physician services.</p>
          <p style={{marginTop: "4px"}}>By signing this consent form, I understand I am personally responsible for my actions during my tenure at DAP Unisex Fitness Studio.</p>
        </div>
        <div className="footer-note">* No Refund &bull; No Transfer &bull; No Extension &bull; No Freezing</div>
      </div>

      {/* ===== MODAL (screen only) ===== */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] w-full max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar rounded-2xl shadow-2xl">

          {/* Sticky Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
            <h1 className="text-xl font-bold flex items-center gap-3 text-white">
              <FileText className="text-orange-500" />
              Join Form — {member?.name}
            </h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 transition-all rounded-xl text-white font-bold text-sm"
              >
                <Printer size={18} />
                Print Form
              </button>
              <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* Personal Information */}
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><User size={16} /> Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Date of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [color-scheme:dark] focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Current Age</label><div className="relative"><input type="text" value={formData.age} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/50" /><span className="absolute right-4 top-2 text-white/30 text-sm">Years</span></div></div>
                <div><label className="block text-sm text-white/60 mb-1">Blood Group</label><select name="blood_group" value={formData.blood_group} onChange={handleInputChange} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"><option value="">Select Blood Group</option>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                <div><label className="block text-sm text-white/60 mb-1">Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm text-white/60 mb-1">Permanent Address</label><textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter your full residential address..." rows="2" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>

            {/* Work & Career */}
            <section className="bg-black/20 p-6 rounded-xl border border-white/5">
              <h2 className="text-sm font-semibold mb-4 text-orange-500 uppercase tracking-wider flex items-center gap-2"><Clock size={16} /> Work & Career</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-white/60 mb-1">Company / Employer</label><input type="text" name="employer" value={formData.employer} onChange={handleInputChange} placeholder="Company name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
                <div><label className="block text-sm text-white/60 mb-1">Job Title / Occupation</label><input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="e.g. Software Engineer" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50" /></div>
              </div>
            </section>

            {/* Emergency Contact */}
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

            {/* Fitness Profile */}
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

            {/* Informed Consent */}
            <section className="space-y-3">
              <p className="text-sm text-white/60">
                Please read the{" "}
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))} className="text-orange-500 font-semibold hover:text-orange-400 transition-colors">
                  Terms & Conditions
                </button>
              </p>
              <div className="border border-white/15 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))} className="w-full flex items-center justify-between px-6 py-4 bg-[#1e1e1e] hover:bg-[#252525] transition-colors">
                  <span className="text-white font-bold uppercase tracking-widest text-sm">Informed Consent Form</span>
                  <span className="text-white/60 text-xl font-light leading-none">{formData.termsAccepted ? "−" : "+"}</span>
                </button>
                {formData.termsAccepted && (
                  <div className="border-t border-white/10">
                    <div className="bg-[#222] p-6 space-y-4">
                      <p className="text-orange-500 font-bold uppercase tracking-wider text-xs">Please Fill In All Information Requested Below</p>
                      <div className="flex items-end gap-3">
                        <span className="text-white text-lg">I</span>
                        <div className="flex-1"><input type="text" name="participant_name" value={formData.participant_name} onChange={handleInputChange} placeholder="Full Name" className="w-full bg-transparent border-b border-white/30 px-0 py-1 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors" /></div>
                      </div>
                      <p className="text-white text-sm leading-relaxed">give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.</p>
                      <label className="flex items-center gap-3 cursor-pointer mt-2">
                        <input type="checkbox" name="consent_agree" checked={formData.consent_agree} onChange={handleInputChange} className="w-5 h-5 accent-orange-500 cursor-pointer" />
                        <span className="text-white font-medium">I Agree</span>
                      </label>
                    </div>
                    <div className="bg-[#1e1e1e] border-t border-white/10 p-6"><h3 className="text-orange-500 font-bold uppercase tracking-wider text-sm mb-3">Benefits</h3><p className="text-white/70 text-sm leading-relaxed">Participation in a regular program of physical activity has been shown to produce positive changes in a number of organ systems. These changes include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance.</p></div>
                    <div className="bg-[#222] border-t border-white/10 p-6"><h3 className="text-orange-500 font-bold uppercase tracking-wider text-sm mb-3">Risks</h3><p className="text-white/70 text-sm leading-relaxed">Exercise carries some risk to the musculoskeletal system (sprains, strains) and cardiorespiratory system (dizziness, discomfort in breathing, heart attack). I certify that I know of no medical problem that would increase my risk of illness or injury.</p></div>
                    <div className="bg-[#1e1e1e] border-t border-white/10 p-6"><h3 className="text-orange-500 font-bold uppercase tracking-wider text-sm mb-3">Testing and Evaluation Results</h3><p className="text-white/70 text-sm leading-relaxed">I understand I will undergo initial testing to determine my current physical fitness status including health inventory, body composition, treadmill testing, muscular fitness and flexibility screening.</p><p className="text-white/70 text-sm leading-relaxed mt-2">My individual results will be made available only to me and are not intended to replace any medical test or physician services.</p><p className="text-white/70 text-sm leading-relaxed mt-2">By signing this consent form, I understand I am personally responsible for my actions during my tenure at DAP Unisex Fitness Studio.</p><p className="mt-4 font-bold text-white/40 text-sm text-center">* No Refund • No Transfer • No Extension • No Freezing</p></div>
                  </div>
                )}
              </div>
            </section>

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all font-bold">Cancel</button>
              <button type="button" onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-orange-500 rounded-xl text-white font-bold hover:bg-orange-600 transition-all">
                <Printer size={18} /> Print Form
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AdminJoinForm;

import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X } from "lucide-react";
import api from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import DateRangeFilter from "../Admin/DateRangeFilter";
import { filterByDateRange } from "../Admin/utils/dateUtils";
import dayjs from "dayjs";
import PageContainer from "./PageContainer";

const UserEnquiry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledPlan = location.state?.selectedPlan;
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [showForm, setShowForm] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
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
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (prefilledPlan) {
      setFormData(prev => ({
        ...prev,
        plan_name: prefilledPlan.planName,
        plan_duration: prefilledPlan.duration
      }));
    }
  }, [prefilledPlan]);

  useEffect(() => {
    if (formData.name && !formData.participant_name) {
      setFormData(prev => ({ ...prev, participant_name: formData.name }));
    }
  }, [formData.name, formData.participant_name]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (formData.dob) {
      const age = dayjs().diff(dayjs(formData.dob), 'year');
      setFormData(prev => ({ ...prev, age: age >= 0 ? age.toString() : "" }));
    }
  }, [formData.dob]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setError(null);
      const response = await api.get('/enquiries');
      const data = Array.isArray(response.data) ? response.data : [];
      setEnquiries(data);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError('Failed to load enquiries');
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent_agree) {
      toast.error('Please agree to the informed consent before submitting your enquiry.');
      return;
    }
    try {
      const payload = {
        ...formData,
        consent_data: {
          participant_name: formData.participant_name,
          agree: formData.consent_agree,
          signature: formData.consent_signature,
          date: formData.consent_date,
          guardian_signature: formData.guardian_signature,
          witness: formData.witness,
        },
      };

      if (selectedEnquiry) {
        await api.put(`/enquiries/${selectedEnquiry.id}`, payload);
      } else {
        await api.post('/enquiries', payload);
      }

      toast.success(selectedEnquiry ? 'Enquiry updated!' : 'Thank you! Your enquiry has been submitted.');

      if (!selectedEnquiry) {
        setTimeout(() => navigate("/"), 1500);
      } else {
        fetchEnquiries();
        setShowForm(false);
        setSelectedEnquiry(null);
      }

      setFormData({
        name: "", email: "", phone: "", subject: "", message: "",
        height: "", weight: "", bmi: "", dob: "", age: "", address: "",
        employer: "", occupation: "", emergency_contact_name: "",
        emergency_contact_relationship: "", emergency_contact_address: "",
        emergency_contact_phone_home: "", emergency_contact_phone_work: "",
        fitness_goal: "", blood_group: "", gender: "", termsAccepted: false,
        participant_name: "", consent_agree: false, consent_signature: "", consent_date: "",
        guardian_signature: "", witness: "", plan_name: "", plan_duration: ""
      });
    } catch (error) {
      console.error('Error saving enquiry:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleEdit = (enquiry) => {
    const consentData = enquiry.consent_data
      ? typeof enquiry.consent_data === 'string'
        ? JSON.parse(enquiry.consent_data)
        : enquiry.consent_data
      : {};

    setSelectedEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || "",
      subject: enquiry.subject || "",
      message: enquiry.message || "",
      location: enquiry.location || "",
      height: enquiry.height || "",
      weight: enquiry.weight || "",
      bmi: enquiry.bmi || "",
      dob: enquiry.dob ? dayjs(enquiry.dob).format('YYYY-MM-DD') : "",
      age: enquiry.age || "",
      address: enquiry.address || "",
      employer: enquiry.employer || "",
      occupation: enquiry.occupation || "",
      emergency_contact_name: enquiry.emergency_contact_name || "",
      emergency_contact_relationship: enquiry.emergency_contact_relationship || "",
      emergency_contact_address: enquiry.emergency_contact_address || "",
      emergency_contact_phone_home: enquiry.emergency_contact_phone_home || "",
      emergency_contact_phone_work: enquiry.emergency_contact_phone_work || "",
      fitness_goal: enquiry.fitness_goal || "",
      blood_group: enquiry.blood_group || "",
      gender: enquiry.gender || "",
      status: enquiry.status,
      plan_name: enquiry.plan_name || "",
      plan_duration: enquiry.plan_duration || "",
      participant_name: consentData.participant_name || enquiry.name || "",
      consent_agree: consentData.agree || false,
      consent_signature: consentData.signature || "",
      consent_date: consentData.date || "",
      guardian_signature: consentData.guardian_signature || "",
      witness: consentData.witness || "",
      termsAccepted: enquiry.terms_accepted === 1 || enquiry.termsAccepted || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await api.delete(`/enquiries/${id}`);
        fetchEnquiries();
      } catch (error) {
        console.error('Error deleting enquiry:', error);
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/enquiries/${id}/status`, { status });
      fetchEnquiries();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };





  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto" data-aos="fade-up">

          {/* TITLE SECTION */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase italic">
              Join The <span className="text-orange-500">Elite</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
              Ready to transform? Fill out the enquiry form below and our professional team will get in touch to start your journey.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">

                {(formData.plan_name || formData.plan_duration) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      label="Selected Plan"
                      value={formData.plan_name}
                      readOnly
                    />

                    <InputField
                      label="Plan Duration"
                      value={formData.plan_duration}
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
                    <InputField label="Full Name" value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} required placeholder="e.g. John Doe" />
                    <InputField label="Email Address" type="email" value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} required placeholder="john@example.com" />
                    <InputField label="Phone Number" type="tel" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} placeholder="Enter 10-digit mobile number" />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Date of Birth" type="date" value={formData.dob} onChange={(val) => setFormData({ ...formData, dob: val })} />
                      <InputField label="Current Age" type="number" value={formData.age} onChange={(val) => setFormData({ ...formData, age: val })} placeholder="Years" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
                      <select
                        value={formData.blood_group}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
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
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                        required
                      >
                        <option value="" className="bg-gray-900">Select Gender</option>
                        <option value="Male" className="bg-gray-900">Male</option>
                        <option value="Female" className="bg-gray-900">Female</option>
                        <option value="Other" className="bg-gray-900">Other</option>
                      </select>
                    </div>
                  </div>

                  <InputField label="Permanent Address" value={formData.address} onChange={(val) => setFormData({ ...formData, address: val })} isTextArea placeholder="Enter your full residential address..." />
                </div>

                {/* SECTION: PROFESSIONAL INFO */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Work & Career</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Company / Employer" value={formData.employer} onChange={(val) => setFormData({ ...formData, employer: val })} placeholder="Company name" />
                    <InputField label="Job Title / Occupation" value={formData.occupation} onChange={(val) => setFormData({ ...formData, occupation: val })} placeholder="e.g. Software Engineer" />
                  </div>
                </div>

                {/* SECTION: EMERGENCY CONTACT */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Guardian/Contact Name" value={formData.emergency_contact_name} onChange={(val) => setFormData({ ...formData, emergency_contact_name: val })} placeholder="Full name" />
                    <InputField label="Relationship" value={formData.emergency_contact_relationship} onChange={(val) => setFormData({ ...formData, emergency_contact_relationship: val })} placeholder="e.g. Father, Spouse, Friend" />
                    <InputField label="Home / Primary Phone" type="tel" value={formData.emergency_contact_phone_home} onChange={(val) => setFormData({ ...formData, emergency_contact_phone_home: val })} placeholder="Phone number" />
                    <InputField label="Work / Secondary Phone" type="tel" value={formData.emergency_contact_phone_work} onChange={(val) => setFormData({ ...formData, emergency_contact_phone_work: val })} placeholder="Alternative number" />
                  </div>
                  <InputField label="Emergency Contact Address" value={formData.emergency_contact_address} onChange={(val) => setFormData({ ...formData, emergency_contact_address: val })} isTextArea placeholder="Guardian's address..." />
                </div>

                {/* SECTION: HEALTH & GOALS */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">Fitness Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Height (cm)" type="number" value={formData.height} onChange={(val) => setFormData({ ...formData, height: val })} placeholder="Height in cm" />
                    <InputField label="Weight (kg)" type="number" value={formData.weight} onChange={(val) => setFormData({ ...formData, weight: val })} placeholder="Weight in kg" />
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Current BMI</label>
                      <div className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-orange-500 font-black text-center text-xl">
                        {formData.bmi || "0.0"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="What are your fitness goals?" value={formData.fitness_goal} onChange={(val) => setFormData({ ...formData, fitness_goal: val })} isTextArea placeholder="Describe what you want to achieve (e.g. Lose 5kg, build muscle, marathon prep)..." />
                    <InputField label="Any Medical History or Notes?" value={formData.message} onChange={(val) => setFormData({ ...formData, message: val })} isTextArea placeholder="List any injuries, conditions, or specific requests..." />
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
                      <span className="text-white font-bold tracking-wider">
                        INFORMED CONSENT FORM
                      </span>
                      <span className="text-orange-500 text-2xl">
                        {showConsent ? "−" : "+"}
                      </span>
                    </button>

                    {showConsent && (
                      <div className="mt-5 p-8 rounded-2xl bg-white/5 border border-white/10 space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <p className="uppercase text-sm text-orange-400 font-semibold mb-5">
                            Please Fill In All Information Requested Below
                          </p>

                          <div className="flex flex-wrap items-center gap-3 leading-8 text-white">
                            <span>I</span>
                            <input
                              type="text"
                              name="participant_name"
                              value={formData.participant_name}
                              onChange={(e) =>
                                setFormData({ ...formData, participant_name: e.target.value })
                              }
                              placeholder="Full Name"
                              className="min-w-[180px] bg-transparent border-b border-orange-400 px-2 py-1 text-white outline-none"
                              required
                            />
                            <span>
                              give my consent to participate in the physical fitness evaluation program conducted by DAP Unisex Fitness Studio.
                            </span>
                          </div>

                          <label className="flex items-center gap-3 mt-6">
                            <input
                              type="checkbox"
                              name="consent_agree"
                              checked={formData.consent_agree}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData({
                                  ...formData,
                                  consent_agree: checked,
                                  termsAccepted: checked,
                                });
                              }}
                              className="w-5 h-5"
                              required
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

                        {/* <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block mb-2 text-orange-300">Signature</label>
                            <input
                              name="consent_signature"
                              value={formData.consent_signature}
                              onChange={(e) => setFormData({ ...formData, consent_signature: e.target.value })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                              placeholder="Type signature"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-orange-300">Date</label>
                            <input
                              type="date"
                              name="consent_date"
                              value={formData.consent_date}
                              onChange={(e) => setFormData({ ...formData, consent_date: e.target.value })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-orange-300">Parent/Guardian Signature (if minor)</label>
                          <input
                            name="guardian_signature"
                            value={formData.guardian_signature}
                            onChange={(e) => setFormData({ ...formData, guardian_signature: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                            placeholder="Guardian signature"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-orange-300">Witness</label>
                          <input
                            name="witness"
                            value={formData.witness}
                            onChange={(e) => setFormData({ ...formData, witness: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                            placeholder="Witness name"
                          />
                        </div> */}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
                  >
                    Back to Home
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(234,88,12,0.3)] hover:shadow-[0_15px_40px_rgba(234,88,12,0.4)] active:scale-95 flex items-center justify-center gap-3"
                  >
                    {selectedEnquiry ? 'Update Enquiry' : 'Submit Enquiry'} <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Input Component for clean code
const InputField = ({ label, type = "text", value, onChange, placeholder, required, isTextArea, readOnly = false }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {isTextArea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 rounded-xl text-white transition-all
    ${readOnly
            ? "bg-white/10 border border-orange-500/30 cursor-not-allowed"
            : "bg-white/5 border border-white/10 focus:ring-2 focus:ring-orange-500"
          }`}
      />
    )}
  </div>
);

export default UserEnquiry;
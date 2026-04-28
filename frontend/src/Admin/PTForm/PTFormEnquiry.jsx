import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X } from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";

const Enquiry = ({
  onNext,
  onPrevious,
  onSelectMember,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  isModal = false
}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [localFormData, setLocalFormData] = useState({
    member_id: initialFormData?.member_id || "",
    u_id: initialFormData?.u_id || "",
    name: initialFormData?.name || "",
    email: initialFormData?.email || "",
    phone: initialFormData?.phone || "",
    subject: initialFormData?.subject || "",
    message: initialFormData?.message || "",
    location: initialFormData?.location || "",
    height: initialFormData?.height || "",
    weight: initialFormData?.weight || "",
    bmi: initialFormData?.bmi || "",
    dob: initialFormData?.dob || "",
    age: initialFormData?.age || "",
    address: initialFormData?.address || "",
    employer: initialFormData?.employer || "",
    occupation: initialFormData?.occupation || "",
    emergency_contact_name: initialFormData?.emergency_contact_name || "",
    emergency_contact_relationship: initialFormData?.emergency_contact_relationship || "",
    emergency_contact_address: initialFormData?.emergency_contact_address || "",
    emergency_contact_phone_home: initialFormData?.emergency_contact_phone_home || "",
    emergency_contact_phone_work: initialFormData?.emergency_contact_phone_work || "",
    fitness_goal: initialFormData?.fitness_goal || "",
    blood_group: initialFormData?.blood_group || "",
    gender: initialFormData?.gender || ""
  });

  useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      setLocalFormData(prev => ({
        ...prev,
        ...initialFormData
      }));
    }
  }, [initialFormData]);

  useEffect(() => {
    if (localFormData.height && localFormData.weight) {
      const h = parseFloat(localFormData.height) / 100;
      const w = parseFloat(localFormData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setLocalFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    } else {
      setLocalFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [localFormData.height, localFormData.weight]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setError(null);
      const response = await api.get('/members');
      const data = Array.isArray(response.data) ? response.data : [];
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (member) => {
    setLocalFormData({
      member_id: member.id,
      u_id: member.u_id,
      name: member.name || "",
      email: member.email || member.user_email || "",
      phone: member.phone || "",
      subject: "",
      message: "",
      location: member.location || "",
      height: member.height || "",
      weight: member.weight || "",
      bmi: member.bmi || "",
      dob: member.dob ? dayjs(member.dob).format('YYYY-MM-DD') : "",
      age: member.age || "",
      address: member.address || "",
      employer: member.employer || "",
      occupation: member.occupation || "",
      emergency_contact_name: member.emergency_contact_name || "",
      emergency_contact_relationship: member.emergency_contact_relationship || "",
      emergency_contact_address: member.emergency_contact_address || "",
      emergency_contact_phone_home: member.emergency_contact_phone_home || "",
      emergency_contact_phone_work: member.emergency_contact_phone_work || "",
      fitness_goal: member.fitness_goal || "",
      blood_group: member.blood_group || "",
      gender: member.gender || ""
    });
    if (onSelectMember) {
      onSelectMember(member.id);
    }
    setSearchTerm("");
    setShowMemberList(false);
  };

  const filteredMembers = members.filter(member =>
    !member.pt_form_completed && (
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).slice(0, 20); // Limit to 20 suggestions for better selection

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
    <div className="space-y-6 overflow-visible">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">
        <div className={isModal ? "w-full" : "w-full py-2"}>
          {/* Quick Select Section */}
          {!isModal && (
            <div className="relative mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-sm font-medium text-orange-400 mb-2 font-bold uppercase tracking-widest">
                Import from Existing Member (Optional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowMemberList(true);
                  }}
                  onFocus={() => setShowMemberList(true)}
                  placeholder="Search member by name, phone or email..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-white/20"
                />

                {showMemberList && (
                  <div className="absolute z-50 w-full mt-1 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectMember(member)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-500/10 border-b border-white/5 last:border-0 transition-colors group"
                        >
                          <div className="font-bold text-white group-hover:text-orange-400">{member.name}</div>
                          <div className="text-[10px] text-white/40 flex gap-2 uppercase tracking-tight">
                            <span>{member.phone || 'No Phone'}</span>
                            <span>•</span>
                            <span>{member.email || member.user_email || 'No Email'}</span>
                            {member.plan && (
                              <>
                                <span>•</span>
                                <span className="text-orange-500/60">{member.plan}</span>
                              </>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-white/40 text-sm italic text-center">No matching members found</div>
                    )}
                    <button
                      onClick={() => setShowMemberList(false)}
                      className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Close Suggestions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onNext(localFormData);
            }}
            className="space-y-6"
          >
            {/* SECTION: PERSONAL INFO */}
            <div className="space-y-4">
              <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
                  <input
                    type="text"
                    value={localFormData.name}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={localFormData.email}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={localFormData.phone}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={localFormData.dob}
                      onChange={(e) => setLocalFormData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
                    <input
                      type="number"
                      value={localFormData.age}
                      onChange={(e) => setLocalFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Blood Group</label>
                  <select
                    value={localFormData.blood_group}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, blood_group: e.target.value }))}
                    className="bg-[#1f2937] text-white w-full px-3 py-2  border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+" className="bg-[#1f2937] text-white">A+</option>
                    <option value="A-" className="bg-[#1f2937] text-white">A-</option>
                    <option value="B+" className="bg-[#1f2937] text-white">B+</option>
                    <option value="B-" className="bg-[#1f2937] text-white">B-</option>
                    <option value="O+" className="bg-[#1f2937] text-white">O+</option>
                    <option value="O-" className="bg-[#1f2937] text-white">O-</option>
                    <option value="AB+" className="bg-[#1f2937] text-white">AB+</option>
                    <option value="AB-" className="bg-[#1f2937] text-white">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Gender</label>
                  <select
                    value={localFormData.gender}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="bg-[#1f2937] text-white w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Location / Branch</label>
                <input
                  type="text"
                  value={localFormData.location}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Gym Branch Name"
                />
              </div> */}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
                <textarea
                  value={localFormData.address}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* SECTION: PROFESSIONAL INFO */}
            <div className="space-y-4">
              <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Employer</label>
                  <input
                    type="text"
                    value={localFormData.employer}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, employer: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={localFormData.occupation}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: EMERGENCY CONTACT */}
            <div className="space-y-4">
              <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">In Case of Emergency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={localFormData.emergency_contact_name}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={localFormData.emergency_contact_relationship}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Home Phone</label>
                  <input
                    type="tel"
                    value={localFormData.emergency_contact_phone_home}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, emergency_contact_phone_home: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Work Phone</label>
                  <input
                    type="tel"
                    value={localFormData.emergency_contact_phone_work}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, emergency_contact_phone_work: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Contact Address</label>
                <textarea
                  value={localFormData.emergency_contact_address}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, emergency_contact_address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* SECTION: HEALTH & GOALS */}
            <div className="space-y-4">
              <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Health & Fitness Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={localFormData.height}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={localFormData.weight}
                    onChange={(e) => setLocalFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">BMI</label>
                  <input
                    type="text"
                    value={localFormData.bmi}
                    readOnly
                    className="w-full px-3 py-2 bg-white/20 border border-white/20 rounded-lg text-orange-400 font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Fitness Goals</label>
                <textarea
                  value={localFormData.fitness_goal}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, fitness_goal: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your fitness objectives..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
                <textarea
                  value={localFormData.message}
                  onChange={(e) => setLocalFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstStep}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${isFirstStep
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-all border border-white/10"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-600/20 transition-all"
              >
                {isLastStep ? "Complete Registration" : "Next Step"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      );
};

      export default Enquiry;
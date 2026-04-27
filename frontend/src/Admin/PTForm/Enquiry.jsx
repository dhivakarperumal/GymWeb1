import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X } from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";

const Enquiry = ({
  onNext,
  onPrevious,
  formData: initialFormData,
  isFirstStep,
  isLastStep,
  isModal = false
}) => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(!isModal); // Don't show loading in modal mode
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [showForm, setShowForm] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [localFormData, setLocalFormData] = useState({
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
    blood_group: initialFormData?.blood_group || ""
  });

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
    if (!isModal) {
      fetchEnquiries();
    } else {
      setLoading(false); // Don't show loading in modal mode
    }
  }, [isModal]);

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
    try {
      // Create new enquiry
      await api.post('/enquiries', localFormData);
      onNext(localFormData);
    } catch (error) {
      console.error('Error saving enquiry:', error);
    }
  };

  const handleEdit = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setLocalFormData({
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
      status: enquiry.status
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

  const handleMoveToMembers = async (enquiry) => {
    if (!window.confirm('Convert this enquiry into a member?')) return;
    try {
      const memberData = {
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone || null,
        address: enquiry.address || enquiry.location || null,
        height: enquiry.height || null,
        weight: enquiry.weight || null,
        bmi: enquiry.bmi || null,
        dob: enquiry.dob ? dayjs(enquiry.dob).format('YYYY-MM-DD') : null,
        age: enquiry.age || null,
        employer: enquiry.employer || null,
        occupation: enquiry.occupation || null,
        emergency_contact_name: enquiry.emergency_contact_name || null,
        emergency_contact_relationship: enquiry.emergency_contact_relationship || null,
        emergency_contact_address: enquiry.emergency_contact_address || null,
        emergency_contact_phone_home: enquiry.emergency_contact_phone_home || null,
        emergency_contact_phone_work: enquiry.emergency_contact_phone_work || null,
        fitness_goal: enquiry.fitness_goal || null,
        blood_group: enquiry.blood_group || null,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        // supply password explicitly so frontend knows credentials
        password: enquiry.phone || ''
      };
      // tell admin what the temporary password is
      await api.post('/members', memberData);
      alert(`Member created successfully. Login using phone number as both identifier and password.`);
      await updateStatus(enquiry.id, 'completed');
    } catch (err) {
      console.error('Error moving to members:', err);
      const msg = err.response?.data?.message || 'Failed to create member';
      alert(msg);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
    if (!(matchesSearch && matchesStatus)) return false;

    // 2. Date Range Filter
    return filterByDateRange([enquiry], 'created_at', dateRange.type, dateRange.range).length > 0;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className={isModal ? "w-full" : "max-w-5xl mx-auto py-10"}>

          <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* SECTION: PERSONAL INFO */}
            <div className="space-y-4">
              <h1 className="text-white text-4xl font-bold border-b border-white/10 pb-1">Enquiry Form</h1>
              <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
                  <input
                    type="text"
                    value={localFormData.name}
                    onChange={(e) => setLocalFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={localFormData.email}
                    onChange={(e) => setLocalFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={localFormData.phone}
                    onChange={(e) => setLocalFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={localFormData.dob}
                      onChange={(e) => setLocalFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
                    <input
                      type="number"
                      value={localFormData.age}
                      onChange={(e) => setLocalFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Blood Group</label>
                  <select
                    value={localFormData.blood_group}
                    onChange={(e) => setLocalFormData({ ...formData, blood_group: e.target.value })}
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
                  <label className="block text-sm font-medium text-white/80 mb-1">Location / Branch</label>
                  <input
                    type="text"
                    value={localFormData.location}
                    onChange={(e) => setLocalFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Gym Branch Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
                <textarea
                  value={localFormData.address}
                  onChange={(e) => setLocalFormData({ ...formData, address: e.target.value })}
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
                    onChange={(e) => setLocalFormData({ ...formData, employer: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={localFormData.occupation}
                    onChange={(e) => setLocalFormData({ ...formData, occupation: e.target.value })}
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
                    onChange={(e) => setLocalFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={localFormData.emergency_contact_relationship}
                    onChange={(e) => setLocalFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Home Phone</label>
                  <input
                    type="tel"
                    value={localFormData.emergency_contact_phone_home}
                    onChange={(e) => setLocalFormData({ ...formData, emergency_contact_phone_home: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Work Phone</label>
                  <input
                    type="tel"
                    value={localFormData.emergency_contact_phone_work}
                    onChange={(e) => setLocalFormData({ ...formData, emergency_contact_phone_work: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Contact Address</label>
                <textarea
                  value={localFormData.emergency_contact_address}
                  onChange={(e) => setLocalFormData({ ...formData, emergency_contact_address: e.target.value })}
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
                    onChange={(e) => setLocalFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={localFormData.weight}
                    onChange={(e) => setLocalFormData({ ...formData, weight: e.target.value })}
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
                  onChange={(e) => setLocalFormData({ ...formData, fitness_goal: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your fitness objectives..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
                <textarea
                  value={localFormData.message}
                  onChange={(e) => setLocalFormData({ ...formData, message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {selectedEnquiry && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Status</label>
                <select
                  value={localFormData.status}
                  onChange={(e) => setLocalFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-4">

              <button
                type="button"
                onClick={() => {
                  if (!isFirstStep && onPrevious) {
                    onPrevious();
                  }
                }}
                disabled={isFirstStep}
                className={`flex-1 px-4 py-2 rounded-lg ${isFirstStep
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                  }`}
              >
                Previous
              </button>

              <button
                type="button"
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                {isLastStep ? "Complete Registration" : "Next"}
              </button>

            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Enquiry;
import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";

const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    gender: ""
  });

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
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange]);

  useEffect(() => {
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
    try {
      if (selectedEnquiry) {
        // Update full enquiry
        await api.put(`/enquiries/${selectedEnquiry.id}`, formData);
      } else {
        // Create new enquiry
        await api.post('/enquiries', formData);
      }
      fetchEnquiries();
      setShowForm(false);
      setSelectedEnquiry(null);
      setFormData({
        name: "", email: "", phone: "", subject: "", message: "",
        height: "", weight: "", bmi: "", dob: "", age: "", address: "",
        employer: "", occupation: "", emergency_contact_name: "",
        emergency_contact_relationship: "", emergency_contact_address: "",
        emergency_contact_phone_home: "", emergency_contact_phone_work: "",
        fitness_goal: "", blood_group: "", gender: ""
      });
    } catch (error) {
      console.error('Error saving enquiry:', error);
    }
  };

  const handleEdit = (enquiry) => {
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
        gender: enquiry.gender || null,
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

  // Pagination logic
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, startIndex + itemsPerPage);

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
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all outline-none"
          >
            <Plus className="w-4 h-4" />
            Add Enquiry
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
         
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">S No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Customer</th>

                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedEnquiries && paginatedEnquiries.length > 0 ? (
                paginatedEnquiries.map((enquiry,ind) => (
                <tr key={enquiry.id} className="hover:bg-white/5">
                   <td className="px-6 py-4">
                    <div className="text-sm text-white">{ startIndex + ind + 1 }</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{enquiry.name}</div>
                      <div className="text-sm text-white/60">{enquiry.email}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{enquiry.location || 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enquiry.status)}`}>
                      {getStatusIcon(enquiry.status)}
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {new Date(enquiry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(enquiry)}
                        className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {enquiry.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMoveToMembers(enquiry)}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded"
                            title="Move to members"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(enquiry.id, 'completed')}
                            className="p-1 text-green-400 hover:text-green-300 hover:bg-white/10 rounded"
                            title="Mark as completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(enquiry.id, 'cancelled')}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded"
                            title="Cancel enquiry"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(enquiry.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-white/60">
                    No enquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10 gap-4">
            <div className="text-sm text-white/60 order-2 sm:order-1">
              Showing <span className="text-white font-medium">{startIndex + 1}</span> to <span className="text-white font-medium">{Math.min(startIndex + itemsPerPage, filteredEnquiries.length)}</span> of <span className="text-white font-medium">{filteredEnquiries.length}</span> results
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  // Only show current, first, last, and surrounding pages if many
                  if (
                    totalPages > 7 &&
                    i + 1 !== 1 &&
                    i + 1 !== totalPages &&
                    Math.abs(currentPage - (i + 1)) > 1
                  ) {
                    if (Math.abs(currentPage - (i + 1)) === 2) return <span key={i} className="text-white/30 px-1">...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all border ${
                        currentPage === i + 1
                          ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all border border-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 w-full max-w-5xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {selectedEnquiry ? 'View Enquiry' : 'Add New Enquiry'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedEnquiry(null);
                  setFormData({
                    name: "", email: "", phone: "", subject: "", message: "", location: "",
                    height: "", weight: "", bmi: "", dob: "", age: "", address: "",
                    employer: "", occupation: "", emergency_contact_name: "",
                    emergency_contact_relationship: "", emergency_contact_address: "",
                    emergency_contact_phone_home: "", emergency_contact_phone_work: "",
                    fitness_goal: "", blood_group: ""
                  });
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* SECTION: PERSONAL INFO */}
              <div className="space-y-4">
                <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g., name@email.com"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g., +91 98765 43210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({...formData, dob: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        placeholder="e.g., 25"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Blood Group</label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => setFormData({...formData, blood_group: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                 
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                    placeholder="Door No., Street, City, State, Pincode"
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
                      value={formData.employer}
                      onChange={(e) => setFormData({...formData, employer: e.target.value})}
                      placeholder="e.g., Company / Organisation name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                      placeholder="e.g., Software Engineer"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      placeholder="Contact person full name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({...formData, emergency_contact_relationship: e.target.value})}
                      placeholder="e.g., Spouse, Parent, Friend"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Home Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone_home}
                      onChange={(e) => setFormData({...formData, emergency_contact_phone_home: e.target.value})}
                      placeholder="e.g., +91 98765 43210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Work Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone_work}
                      onChange={(e) => setFormData({...formData, emergency_contact_phone_work: e.target.value})}
                      placeholder="e.g., +91 98765 43210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contact Address</label>
                  <textarea
                    value={formData.emergency_contact_address}
                    onChange={(e) => setFormData({...formData, emergency_contact_address: e.target.value})}
                    rows={2}
                    placeholder="Emergency contact's full address"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      placeholder="e.g., 170"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="e.g., 70"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">BMI</label>
                    <input
                      type="text"
                      value={formData.bmi}
                      readOnly
                      placeholder="Auto-calculated"
                      className="w-full px-3 py-2 bg-white/20 border border-white/20 rounded-lg text-orange-400 font-bold placeholder-white/30 focus:outline-none"
                    />
                  </div>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Fitness Goals</label>
                  <textarea
                    value={formData.fitness_goal}
                    onChange={(e) => setFormData({...formData, fitness_goal: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your fitness objectives..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
               </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={formData.termsAccepted || false}
                  onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                  className="w-4 h-4 text-orange-500 bg-transparent border border-white/40 rounded focus:ring-orange-500 focus:ring-offset-gray-900 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-white/80 cursor-pointer">
                  I agree to the <span className="text-orange-500 hover:underline">Terms and Conditions</span>
                </label>
              </div>

              {selectedEnquiry && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                    setShowForm(false);
                    setSelectedEnquiry(null);
                    setFormData({
                      name: "", email: "", phone: "", subject: "", message: "", location: "",
                      height: "", weight: "", bmi: "", dob: "", age: "", address: "",
                      employer: "", occupation: "", emergency_contact_name: "",
                      emergency_contact_relationship: "", emergency_contact_address: "",
                      emergency_contact_phone_home: "", emergency_contact_phone_work: "",
                      fitness_goal: "", blood_group: ""
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {selectedEnquiry ? 'Update' : 'Create'}
                </button>
               
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiry;
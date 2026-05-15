import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, ChevronDown, Users, X, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [showForm, setShowForm] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [importErrors, setImportErrors] = useState([]);
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
    trainer_id: "",
    trainer_name: "",
    termsAccepted: false
  });
  const [trainers, setTrainers] = useState([]);

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
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const res = await api.get("/staff");
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching trainers:", err);
    }
  };

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
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("A valid 10-digit phone number is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      if (selectedEnquiry) {
        // Update full enquiry
        await api.put(`/enquiries/${selectedEnquiry.id}`, formData);
      } else {
        // Check for duplicates before creating new enquiry
        const isDuplicate = enquiries.some(e =>
          (formData.email && e.email?.toLowerCase() === formData.email.toLowerCase()) ||
          (formData.phone && e.phone === formData.phone)
        );

        if (isDuplicate) {
          toast.error("An enquiry with this email or phone already exists.");
          return;
        }

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
        fitness_goal: "", blood_group: "", gender: "",
        trainer_id: "", trainer_name: "",
        termsAccepted: false
      });
      toast.success(selectedEnquiry ? "Enquiry updated successfully" : "Enquiry created successfully");
    } catch (error) {
      console.error('Error saving enquiry:', error);
      toast.error(error.response?.data?.error || "Failed to save enquiry");
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
      trainer_id: enquiry.trainer_id || "",
      trainer_name: enquiry.trainer_name || "",
      termsAccepted: enquiry.termsAccepted || false,
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

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    if (enquiries.length === 0) {
      toast.error("No enquiries to export");
      return;
    }

    const dataToExport = enquiries.map((e, index) => ({
      "S.No": index + 1,
      Name: e.name || "N/A",
      Phone: e.phone || "N/A",
      Email: e.email || "-",
      Subject: e.subject || "-",
      Message: e.message || "-",
      Status: e.status || "pending",
      "Created At": dayjs(e.created_at).format("YYYY-MM-DD HH:mm"),
      Gender: e.gender || "-",
      "Date of Birth": e.dob ? dayjs(e.dob).format("YYYY-MM-DD") : "-",
      Age: e.age || "-",
      Height: e.height || "-",
      Weight: e.weight || "-",
      BMI: e.bmi || "-",
      "Fitness Goal": e.fitness_goal || "-",
      Address: e.address || "-",
      Employer: e.employer || "-",
      Occupation: e.occupation || "-",
      "Emergency Contact": e.emergency_contact_name || "-",
      "Emergency Phone": e.emergency_contact_phone_home || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
    XLSX.writeFile(workbook, "enquiries_directory.xlsx");
    toast.success("Exported successfully");
  };

  /* ================= IMPORT FROM EXCEL ================= */
  const excelDateToJSDate = (value) => {
    if (!value) return null;

    // If it's a number, it's an Excel serial date
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return dayjs(date).format("YYYY-MM-DD");
    }

    // If it's a string, try to parse it with dayjs
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }

    return null;
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be re-imported
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        console.log("Excel Data rows:", jsonData.length);

        if (jsonData.length === 0) {
          toast.error("The Excel file is empty or has no valid rows.");
          setLoading(false);
          return;
        }

        // Build a case-insensitive, trimmed key lookup for each row
        const normalizeRow = (row) => {
          const normalized = {};
          for (const key of Object.keys(row)) {
            normalized[key.trim().toLowerCase()] = row[key];
          }
          return normalized;
        };

        // Helper: get value from normalized row trying multiple key variants
        const getField = (norm, ...keys) => {
          for (const k of keys) {
            const val = norm[k.toLowerCase()];
            if (val !== undefined && val !== null && val !== "") return val;
          }
          return "";
        };

        // Helper: extract clean 10-digit phone from any format
        const extractPhone = (raw) => {
          if (!raw && raw !== 0) return "";
          // Strip all non-digits, then take last 10 digits (handles +91, 0 prefix, spaces, dashes)
          const digits = raw.toString().replace(/\D/g, '');
          if (digits.length >= 10) return digits.slice(-10);
          return digits; // shorter than 10 — will fail validation below
        };

        // Pre-build a set of existing phones/emails for fast duplicate check
        const existingPhones = new Set(enquiries.map(en => en.phone).filter(Boolean));
        const existingEmails = new Set(enquiries.map(en => en.email?.toLowerCase()).filter(Boolean));

        const errors = [];
        const validPayloads = [];

        // --- Phase 1: validate all rows first ---
        for (const row of jsonData) {
          if (!row || Object.keys(row).length === 0) continue;

          const norm = normalizeRow(row);

          const name = getField(norm,
            "full name", "name", "customer name", "client name",
            "member name", "contact name", "first name"
          ).toString().trim();

          const email = getField(norm,
            "email", "email address", "e-mail", "mail"
          ).toString().trim().toLowerCase();

          const phone = extractPhone(getField(norm,
            "phone", "phone number", "mobile", "mobile number",
            "contact number", "cell", "cell number", "contact", "ph", "mob"
          ));

          if (!name) {
            errors.push({ name: "Row with missing name", reason: "Missing Name" });
            continue;
          }
          if (!phone || phone.length !== 10) {
            errors.push({ name, reason: !phone ? "Missing Phone" : `Invalid Phone: ${phone} (need 10 digits)` });
            continue;
          }
          if (existingPhones.has(phone)) {
            errors.push({ name, reason: `Duplicate phone: ${phone}` });
            continue;
          }
          if (email && existingEmails.has(email)) {
            errors.push({ name, reason: `Duplicate email: ${email}` });
            continue;
          }

          // Track to avoid duplicates within same import batch
          existingPhones.add(phone);
          if (email) existingEmails.add(email);

          validPayloads.push({
            name,
            email,
            phone,
            subject: getField(norm, "subject") || "Inquiry",
            message: getField(norm, "message", "notes", "note", "remarks") || "",
            height: getField(norm, "height") || "",
            weight: getField(norm, "weight") || "",
            bmi: getField(norm, "bmi") || "",
            dob: excelDateToJSDate(getField(norm, "dob", "date of birth", "birth date", "birthdate") || null),
            age: getField(norm, "age") || "",
            address: getField(norm, "address") || "",
            employer: getField(norm, "employer", "company") || "",
            occupation: getField(norm, "occupation", "job", "profession") || "",
            emergency_contact_name: getField(norm, "emergency contact name", "emergency name", "emergency contact") || "",
            emergency_contact_relationship: getField(norm, "emergency relationship", "relationship") || "",
            emergency_contact_address: getField(norm, "emergency address") || "",
            emergency_contact_phone_home: extractPhone(getField(norm, "emergency home phone", "emergency phone", "emergency mobile")),
            emergency_contact_phone_work: extractPhone(getField(norm, "emergency work phone")),
            fitness_goal: getField(norm, "fitness goal", "goal") || "",
            blood_group: getField(norm, "blood group", "blood type", "bloodgroup") || "",
            gender: getField(norm, "gender", "sex") || "",
            status: "pending",
            termsAccepted: true
          });
        }

        // --- Phase 2: batch import valid rows (10 concurrent at a time) ---
        let successCount = 0;
        const BATCH_SIZE = 10;
        for (let i = 0; i < validPayloads.length; i += BATCH_SIZE) {
          const batch = validPayloads.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(batch.map(p => api.post('/enquiries', p)));
          results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
              successCount++;
            } else {
              const err = result.reason;
              const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Server error';
              errors.push({ name: batch[idx].name, reason: errorMsg });
            }
          });
        }

        setImportErrors(errors);
        const failCount = errors.length;
        if (successCount > 0) {
          toast.success(`✅ Imported ${successCount} of ${jsonData.length} rows successfully!`);
        }
        if (failCount > 0) {
          toast.error(`⚠️ ${failCount} row(s) failed — see summary above.`, { duration: 6000 });
        }
        if (successCount === 0 && failCount === 0) {
          toast.error("No valid rows found in the file.");
        }
        fetchEnquiries();
      } catch (err) {
        console.error(err);
        toast.error("Failed to read Excel file. Ensure it is a valid .xlsx or .xls file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadExcelTemplate = () => {
    const template = [
      {
        "Customer Name": "Jane Doe",
        "Phone": "9876543210",
        "Email": "jane@example.com",
        "Gender": "Female",
        "Date of Birth": "1998-10-20",
        "Age": "25",
        "Address": "456 Fitness Ave, Chennai",
        "Height": "165",
        "Weight": "60",
        "BMI": "22.0",
        "Blood Group": "A+",
        "Fitness Goal": "Weight Loss & Toning",
        "Subject": "Gym Membership Enquiry",
        "Message": "Interested in joining the gym",
        "Employer": "Tech Global",
        "Occupation": "Designer",
        "Emergency Contact Name": "John Doe",
        "Emergency Relationship": "Spouse",
        "Emergency Home Phone": "9998887776",
        "Emergency Work Phone": "",
        "Emergency Address": "456 Fitness Ave, Chennai"
      },
      {
        "Customer Name": "Ravi Kumar",
        "Phone": "9123456780",
        "Email": "ravi@example.com",
        "Gender": "Male",
        "Date of Birth": "1995-03-15",
        "Age": "29",
        "Address": "12 Main Street, Coimbatore",
        "Height": "175",
        "Weight": "80",
        "BMI": "26.1",
        "Blood Group": "B+",
        "Fitness Goal": "Muscle Building",
        "Subject": "Personal Training",
        "Message": "Looking for a personal trainer",
        "Employer": "Infosys",
        "Occupation": "Software Engineer",
        "Emergency Contact Name": "Priya Kumar",
        "Emergency Relationship": "Wife",
        "Emergency Home Phone": "9876501234",
        "Emergency Work Phone": "",
        "Emergency Address": "12 Main Street, Coimbatore"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    // Auto-fit column widths
    const colWidths = Object.keys(template[0]).map(key => ({ wch: Math.max(key.length + 4, 20) }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enquiry_Template");
    XLSX.writeFile(wb, "Gym_Enquiry_Import_Template.xlsx");
    toast.success("Template with all fields downloaded!");
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
    try {
      const memberData = {
        name: enquiry.name,
        username: enquiry.name,
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
        plan: enquiry.plan_name || null,
        duration: enquiry.plan_duration ? parseInt(enquiry.plan_duration, 10) || null : null,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        gender: enquiry.gender || null,
        // supply password explicitly so frontend knows credentials
        password: enquiry.phone || ''
      };
      // tell admin what the temporary password is
      await api.post('/members', memberData);
      toast.success(`Member created successfully. Login using phone number as both identifier and password.`);
      await updateStatus(enquiry.id, 'completed');
    } catch (err) {
      console.error('Error moving to members:', err);
      const msg = err.response?.data?.message || 'Failed to create member';
      alert(msg);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = (enquiry.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (enquiry.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
    if (!(matchesSearch && matchesStatus)) return false;

    // 2. Date Range Filter
    return filterByDateRange([enquiry], 'created_at', dateRange.type, dateRange.range).length > 0;
  }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

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

  // Helper function to get paginated page numbers with ellipsis
  const getPaginationPages = () => {
    const pages = [];
    const showPages = 5; // Show 5 pages around current page
    const leftSide = Math.max(1, currentPage - 2);
    const rightSide = Math.min(totalPages, currentPage + 2);

    // Always show first page
    if (leftSide > 1) {
      pages.push(1);
      if (leftSide > 2) {
        pages.push('...');
      }
    }

    // Show pages around current page
    for (let i = leftSide; i <= rightSide; i++) {
      pages.push(i);
    }

    // Always show last page
    if (rightSide < totalPages) {
      if (rightSide < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* IMPORT ERRORS SUMMARY */}
      {importErrors.length > 0 && (
        <div className="mx-4 sm:mx-0 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Trash2 size={16} /> Import Failures ({importErrors.length})
            </h3>
            <button onClick={() => setImportErrors([])} className="text-white/40 hover:text-white text-xs">Clear</button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {importErrors.map((err, i) => (
              <p key={i} className="text-white/60 text-xs flex justify-between gap-4">
                <span className="font-medium">{err.name}</span>
                <span className="text-red-400/80 italic">{err.reason}</span>
              </p>
            ))}
          </div>
        </div>
      )}
      {/* Header Area */}
      <div className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Search Only */}
        <div className="flex items-center w-full lg:w-auto">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-full transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Right Side: Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

          {/* Status Filter */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all backdrop-blur-md"
            >
              <Clock className="text-orange-500 w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setIsStatusOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl z-[100] p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                  {[
                    { id: 'all', label: 'All Status', icon: <Users size={14} /> },
                    { id: 'pending', label: 'Pending', icon: <Clock size={14} /> },
                    { id: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> },
                    { id: 'cancelled', label: 'Cancelled', icon: <XCircle size={14} /> },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setStatusFilter(option.id);
                        setCurrentPage(1);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === option.id 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>


          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
              title="Table View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
              title="Card View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            </button>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <label className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg" title="Import from Excel">
                <FileText size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Import</span>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} />
              </label>
              <button
                onClick={exportToExcel}
                className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all shadow-lg"
                title="Export Excel"
              >
                <Download size={16} />
              </button>
            </div>

            <button
              onClick={() => { setSelectedEnquiry(null); setShowForm(true); }}
              className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-md font-bold text-md shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-2 overflow-hidden">
        {/* MOBILE VIEW (Always Cards one-by-one) */}
        <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar pb-20">
          {paginatedEnquiries.length > 0 ? (
            <div className="flex flex-col gap-4">
              {paginatedEnquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  onClick={() => handleEdit(enquiry)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[0.98] transition-all flex flex-col gap-3 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-sm">
                        {enquiry.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{enquiry.name}</p>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{enquiry.location || 'Direct Lead'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(enquiry.status)}`}>
                      {getStatusIcon(enquiry.status)}
                      {enquiry.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                      <Users size={10} className="text-orange-500" /> {enquiry.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                      <Clock size={10} className="text-orange-500" /> {dayjs(enquiry.created_at).format('DD/MM/YY')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm font-medium">No records found</p>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (Toggleable) */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0">
          {viewMode === 'card' ? (
            <div className="flex-1 mt-8 overflow-y-auto custom-scrollbar">
              {paginatedEnquiries.length > 0 ? (
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {paginatedEnquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col gap-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                          {enquiry.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(enquiry.status)}`}>
                          {getStatusIcon(enquiry.status)}
                          {enquiry.status}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div>
                        <p className="text-white font-black text-sm group-hover:text-orange-400 transition-colors">{enquiry.name}</p>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">
                          {enquiry.email || 'No Email'}
                        </p>
                        <p className="text-white/30 text-[10px] font-bold mt-1">
                          {enquiry.location || 'Direct Lead'}
                        </p>
                        {enquiry.trainer_name && (
                          <p className="text-orange-400 text-[10px] font-black mt-1">
                            Trainer: {enquiry.trainer_name}
                          </p>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(enquiry); }}
                          className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                        >
                          Edit
                        </button>
                        {enquiry.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveToMembers(enquiry); }}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/50 transition-all"
                            title="Move to Members"
                          >
                            <Users size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(enquiry.id); }}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
                  <Users size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">No records found</p>
                </div>
              )}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="backdrop-blur-xl bg-white/5 mt-5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-base text-gray-200">
            <thead className="bg-white/10 text-white">
                  <tr>
                    <th className="px-4 py-4 text-center text-sm font-semibold whitespace-nowrap">S.No</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Mobile</th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedEnquiries.length > 0 ? (
                    paginatedEnquiries.map((enquiry, ind) => (
                      <tr
                        key={enquiry.id}
                        className="group hover:bg-white/5 transition-all cursor-pointer"
                        onClick={() => handleEdit(enquiry)}
                      >
                        <td className="px-4 py-4 text-base text-gray-400 text-center">
                          {startIndex + ind + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-base group-hover:text-orange-400 transition-colors truncate max-w-[150px]">
                              {enquiry.name}
                            </span>
                            <span className="text-gray-400 text-sm font-medium truncate max-w-[150px]">
                              {enquiry.email || 'No Email'}
                            </span>
                            {enquiry.trainer_name && (
                              <span className="text-orange-400 font-medium text-sm truncate max-w-[150px]">
                                Trainer: {enquiry.trainer_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-300 text-base font-medium">
                            {enquiry.phone || 'N/A'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(enquiry.status)}`}>
                            {getStatusIcon(enquiry.status)}
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300 font-medium">
                          {dayjs(enquiry.created_at).format('DD/MM/YY')}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(enquiry); }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/50 transition-all"
                            >
                              <Eye size={14} />
                            </button>
                            {enquiry.status === 'pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveToMembers(enquiry); }}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-green-400 hover:border-green-400/50 transition-all"
                                title="Move to Members"
                              >
                                <Users size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(enquiry.id); }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="py-20 text-center text-white/20 font-bold">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {filteredEnquiries.length > 0 && (
          <div className="p-3 border-t border-white/5 bg-white/5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between mt-auto rounded-b-xl gap-4">
            <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
              Showing {paginatedEnquiries.length} of {filteredEnquiries.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-orange-500 hover:border-orange-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPaginationPages().map((page, i) => (
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-white/40 text-[10px] font-black">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg border transition-all text-[10px] font-black ${currentPage === page
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-orange-500 hover:border-orange-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
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
                    <label className="block text-sm font-medium text-white/80 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g., name@email.com"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10}
                      placeholder="e.g., 9876543210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g., 25"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Blood Group</label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Select Trainer</label>
                    <div className="relative group">
                      <select
                        value={formData.trainer_id}
                        onChange={(e) => {
                          const selectedTrainer = trainers.find(t => t.id.toString() === e.target.value);
                          setFormData({
                            ...formData,
                            trainer_id: e.target.value,
                            trainer_name: selectedTrainer ? (selectedTrainer.name || selectedTrainer.username) : ""
                          });
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Full Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                      placeholder="e.g., Company / Organisation name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Contact person full name"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                      placeholder="e.g., Spouse, Parent, Friend"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Home Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone_home}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone_home: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10}
                      placeholder="e.g., 9876543210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Work Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone_work}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone_work: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10}
                      placeholder="e.g., 9876543210"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contact Address</label>
                  <textarea
                    value={formData.emergency_contact_address}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_address: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="e.g., 170"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, fitness_goal: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your fitness objectives..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Additional Notes / Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
import React, { useEffect, useState } from "react";
import { Send, Mail, Phone, CheckSquare, Square, Search, Loader, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import AOS from "aos";
import "aos/dist/aos.css";

const SendMessage = () => {
  const [activeTab, setActiveTab] = useState("membership");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  
  // Selection
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Message Form
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("phone"); // email or phone
  const [sending, setSending] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    fetchUsers();
    // reset selection on tab change
    setSelectedMembers([]);
    setSelectAll(false);
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (activeTab === "membership") {
        const res = await api.get("/memberships");
        const activeMemberships = (res.data || []).filter(
          (m) => m.status === "active"
        );
        setUsers(activeMemberships);
      } else if (activeTab === "enquiry") {
        const res = await api.get("/enquiries");
        const pendingEnquiries = (res.data || []).filter(
          (e) => e.status === "pending"
        );
        setUsers(pendingEnquiries);
      } else if (activeTab === "noplan") {
        const res = await api.get("/members");
        const members = res.data || [];
        // Filter those who don't have an active plan
        const noPlanMembers = members.filter(m => !m.plan || m.status !== 'active');
        setUsers(noPlanMembers);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Filter Users
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = (activeTab === "membership" ? u.username || u.userName : u.name) || "";
    const phone = (activeTab === "membership" ? u.mobile || u.userPhone || u.phone : u.phone || u.mobile) || "";
    const email = (activeTab === "membership" ? u.email || u.userEmail : u.email) || "";
    return name.toLowerCase().includes(q) || phone.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  // Handle Selection
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filtered.map((u) => u.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectMember = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((mId) => mId !== id));
      setSelectAll(false);
    } else {
      const newSelection = [...selectedMembers, id];
      setSelectedMembers(newSelection);
      if (newSelection.length === filtered.length && filtered.length > 0) {
        setSelectAll(true);
      }
    }
  };

  // Handle Send
  const handleSendMessage = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    const selectedUsersData = users.filter((u) => selectedMembers.includes(u.id));
    
    // Filter out users missing the required contact info
    const validUsers = selectedUsersData.filter(u => {
      if (messageType === "email") {
        return activeTab === "membership" ? (u.email || u.userEmail) : u.email;
      } else {
        return activeTab === "membership" ? (u.mobile || u.userPhone || u.phone) : u.phone;
      }
    });

    if (validUsers.length === 0) {
      toast.error(`Selected users do not have a valid ${messageType}.`);
      return;
    }

    try {
      setSending(true);
      
      const payload = {
        type: messageType,
        message: message,
        recipients: validUsers.map(u => ({
          name: (activeTab === "membership" ? (u.username || u.userName) : u.name) || "User",
          email: activeTab === "membership" ? (u.email || u.userEmail) : u.email,
          phone: activeTab === "membership" ? (u.mobile || u.userPhone || u.phone) : (u.phone || u.mobile)
        }))
      };

      await api.post("/send-message", payload);

      toast.success(`Message sent successfully to ${validUsers.length} users!`);
      setMessage("");
      setSelectedMembers([]);
      setSelectAll(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send bulk message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Send an email or SMS to selected members or enquiries.
          </p>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap bg-white/5 rounded-xl p-1 border border-white/10 w-fit mb-4 gap-1" data-aos="fade-right">
          <button
            onClick={() => setActiveTab("membership")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "membership"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Active Members
          </button>
          <button
            onClick={() => setActiveTab("noplan")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "noplan"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            No Plan / New
          </button>
          <button
            onClick={() => setActiveTab("enquiry")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "enquiry"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Enquiries
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: USER SELECTION */}
          <div className="lg:col-span-2 space-y-4" data-aos="fade-up">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col h-[600px]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition whitespace-nowrap bg-white/5 rounded-lg border border-white/10"
                  >
                    {selectAll ? (
                      <CheckSquare className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select All
                  </button>
                  <span className="text-xs text-orange-400 whitespace-nowrap bg-orange-500/10 px-2 py-1.5 rounded-lg font-medium border border-orange-500/20">
                    {selectedMembers.length} Selected
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-400">Loading {activeTab}s...</div>
                ) : filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">No users found for {activeTab}.</div>
                ) : (
                  filtered.map((u) => {
                    const id = u.id || u._id;
                    const isSelected = selectedMembers.includes(id);
                    const name = (activeTab === "membership" || activeTab === "noplan") ? u.username || u.userName || u.name : u.name;
                    const phone = (activeTab === "membership" || activeTab === "noplan") ? u.mobile || u.userPhone || u.phone : u.phone || u.mobile;
                    const email = (activeTab === "membership" || activeTab === "noplan") ? u.email || u.userEmail : u.email;
                    
                    return (
                      <div 
                        key={id}
                        onClick={() => toggleSelectMember(id)}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition cursor-pointer
                        ${isSelected ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.1)]" : "bg-black/20 border-white/5 hover:bg-white/5"}
                        `}
                      >
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{name || "N/A"}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1 shrink-0"><Phone className="w-3 h-3 text-orange-500/70" /> {phone || "-"}</span>
                            <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-blue-500/70" /> {email || "-"}</span>
                          </div>
                        </div>
                        {(activeTab === "membership" || activeTab === "noplan") && (u.planName || u.plan) && (
                          <div className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 hidden sm:block">
                            {u.planName || u.plan}
                          </div>
                        )}
                        {activeTab === "noplan" && (!u.planName && !u.plan) && (
                          <div className="text-xs text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 hidden sm:block">
                            No Plan
                          </div>
                        )}
                        {activeTab === "enquiry" && (
                          <div className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 hidden sm:block max-w-[120px] truncate">
                            {u.status || "Pending"}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: MESSAGE COMPOSER */}
          <div className="lg:col-span-1 space-y-4" data-aos="fade-left">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Compose Message
              </h2>

              <div className="space-y-4">
                
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Message Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-white/20">
                    <button
                      onClick={() => setMessageType("email")}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition
                      ${messageType === "email" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                      onClick={() => setMessageType("phone")}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition
                      ${messageType === "phone" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      <Phone className="w-4 h-4" /> SMS / WhatsApp
                    </button>
                  </div>
                </div>

                {/* Message Box */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Message Content</label>
                  <textarea
                    rows="8"
                    placeholder="Type your bulk message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm resize-none"
                  ></textarea>
                </div>

                {/* Info Text */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-400 leading-relaxed">
                    This message will be sent to the selected <strong className="text-white">{selectedMembers.length}</strong> {activeTab}(s) via {messageType === "email" ? "Email" : "SMS/WhatsApp"}.
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={sending || selectedMembers.length === 0}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send Message</>
                  )}
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SendMessage;

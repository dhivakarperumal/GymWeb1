import React, { useEffect, useState } from "react";
import DietChart from "../WorkoutsDiet/DietChart";
import Workouts from "../WorkoutsDiet/Workouts";
import UserOrders from "./UserOrders";
import UserAddresses from "./UserAddresses";
import UserNotifications from "./UserNotifications"; // Added
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import MemberSBuyPlans from "../WorkoutsDiet/MemberBuyPlans";
import cache from "../cache";
import PTFormUser from "./PTFormUser";
import { toast } from "react-hot-toast";
import { Shield, Key, Eye, EyeOff, CalendarCheck, User, Mail, Phone, Menu, X, Home, ChevronLeft } from "lucide-react";


const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "personal"
  );

  const [userInfo, setUserInfo] = useState({});
  const [plans, setPlans] = useState([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ================= FETCH USER INFO ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      if (cache.userInfo) {
        setUserInfo(cache.userInfo);
      }
      try {
        const res = await api.get(`/users/${userId}`);
        const data = res.data || {};
        setUserInfo(data);
        cache.userInfo = data;
      } catch (err) {
        console.error("failed to fetch user info", err);
      }
    };

    fetchUser();
  }, [userId]);

  /* ================= FETCH USER PLANS ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      if (cache.userPlans) {
        setPlans(cache.userPlans);
        const active = cache.userPlans.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      }
      try {
        const res = await api.get(`/memberships/user/${userId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlans(list);
        cache.userPlans = list;
        const active = list.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      } catch (err) {
        console.error("failed to fetch user plans", err);
      }
    };

    fetchPlans();
  }, [userId]);

  /* ================= SIDEBAR ================= */

  const tabs = [
    { key: "personal", label: "Personal Details", icon: User },
    { key: "plans", label: "My Plans", icon: CalendarCheck },
    ...(hasActivePlan
      ? [
        { key: "diet", label: "Diet Chart", icon: Shield },
        { key: "workouts", label: "Workouts", icon: Key },
        { key: "ptform", label: "PT Form", icon: CalendarCheck },
      ]
      : []),
    { key: "orders", label: "My Orders", icon: CalendarCheck },
    { key: "address", label: "Address", icon: Home },
    { key: "notifications", label: "Notifications", icon: CalendarCheck },
    { key: "security", label: "Set Password", icon: Key },
  ];

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 bg-linear-to-r from-gray-900 to-black border border-red-500/10 rounded-2xl sm:rounded-3xl">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  <span className="text-2xl sm:text-3xl font-black text-white uppercase">
                    {userInfo.username?.[0] || userInfo.email?.[0] || "?"}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                    {userInfo.full_name || userInfo.username || "User Profile"}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Member since {new Date(userInfo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { label: "Username", value: userInfo.username, icon: User },
                  { label: "Email Address", value: userInfo.email, icon: Mail },
                  { label: "Phone Number", value: userInfo.mobile, icon: Phone },
                  { label: "Account Role", value: userInfo.role, icon: Shield },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-red-500/20 transition-all group">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-black/40 rounded-lg sm:rounded-xl group-hover:text-red-500 transition-colors shrink-0">
                        <item.icon size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-white font-medium wrap-break-word text-sm sm:text-base">{item.value || "Not Provided"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Badge */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl gap-4">
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Account Status</h4>
                  <p className="text-gray-500 text-xs">Your account is currently {userInfo.status || "active"}</p>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  userInfo.status === "inactive" ? "bg-gray-500/20 text-gray-500" : "bg-green-500/20 text-green-500"
                }`}>
                  {userInfo.status || "Active"}
                </div>
              </div>
            </div>
          </div>
        );

      case "address":
        return <UserAddresses />;

      case "orders":
        return <UserOrders />;

      case "plans":
        return <MemberSBuyPlans preFetchedPlans={plans} />

      case "diet":
        return hasActivePlan ? (
          <DietChart planId={plans[0]?.planId} />
        ) : (
          <p className="text-gray-400">
            No active plan for diet chart.
          </p>
        );

      case "ptform":
        return <PTFormUser />;

      case "workouts":
        return <Workouts />;

      case "notifications":
        return <UserNotifications userEmail={userInfo.email} />;

      case "security":
        return (
          <div className="flex justify-center w-full py-4 px-2 sm:px-4">
            <div className="max-w-md w-full space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl sm:rounded-2xl">
                  <Shield className="text-red-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Security Settings</h2>
                  <p className="text-xs sm:text-sm text-gray-400">Manage your account security and password</p>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-red-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Old Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!newPassword || !confirmPassword) {
                      toast.error("Please fill all fields");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast.error("Passwords do not match");
                      return;
                    }
                    if (newPassword.length < 6) {
                      toast.error("Password must be at least 6 characters");
                      return;
                    }

                    setLoading(true);
                    try {
                      await api.post("/auth/set-password", {
                        userId: user.id,
                        oldPassword,
                        newPassword
                      });
                      toast.success("Password updated successfully!");
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to update password");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-linear-to-r from-red-600 to-orange-600 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ================= LAYOUT ================= */

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pt-[90px] lg:pt-[80px]">
      {/* HEADER */}
      <header className="relative z-20 bg-black/95 backdrop-blur-xl border-b border-red-500/20 px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            {sidebarOpen ? <X size={20} className="text-red-500" /> : <Menu size={20} className="text-red-500" />}
          </button>

          {/* Back Button for Mobile */}
          {/* <button
            onClick={() => navigate(-1)}
            className="lg:hidden p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button> */}

          <h1 className="text-lg sm:text-xl font-bold text-white">My Account</h1>
        </div>

        {/* <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span>Welcome back,</span>
            <span className="text-red-500 font-medium">{userInfo.username || userInfo.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            Logout
          </button>
        </div> */}
      </header>

      {/* BODY */}
      <div className="flex flex-1 relative">
        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 top-24 lg:top-0 z-50 lg:z-20
          w-64 bg-gray-900/95 backdrop-blur-xl border-r border-red-500/20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:block
          pt-20 lg:pt-0
        `}>
          <div className="p-4 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6 text-white">Account Menu</h2>

            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all duration-200
                    ${activeTab === tab.key
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "hover:bg-red-500/10 text-gray-300 hover:text-white"
                    }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile User Info */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-xl lg:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white uppercase">
                    {userInfo.username?.[0] || userInfo.email?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{userInfo.username || "User"}</p>
                  <p className="text-xs text-gray-400">{userInfo.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;
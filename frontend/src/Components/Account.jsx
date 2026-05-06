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
import { Shield, Key, Eye, EyeOff, CalendarCheck } from "lucide-react";


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
    { key: "personal", label: "Personal Details" },
    { key: "plans", label: "My Plans" },

    ...(hasActivePlan
      ? [
        { key: "diet", label: "Diet Chart" },
        { key: "workouts", label: "Workouts" },
        { key: "ptform", label: "PT Form" },
      ]
      : []),
    { key: "orders", label: "My Orders" },
    { key: "address", label: "Address" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Set Password" },
  ];

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="flex justify-center w-full py-4">
            <div className="max-w-md w-full space-y-4">
              <h2 className="text-xl font-bold text-red-500">
                Personal Details
              </h2>

              {["username", "email", "mobile"].map((field) => (
                <div key={field}>
                  <label className="text-sm text-gray-400 capitalize">
                    {field}
                  </label>

                  <input
                    value={userInfo[field] || ""}
                    readOnly
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded mt-1"
                  />
                </div>
              ))}
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
          <div className="flex justify-center w-full py-4">
            <div className="max-w-md w-full space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <Shield className="text-red-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Security Settings</h2>
                  <p className="text-sm text-gray-400">Manage your account security and password</p>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-red-500/10 rounded-3xl p-8 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Old Password</label>
                    <div className="relative mt-2">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:border-red-500/50 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
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
    <div className="flex flex-col min-h-screen bg-black  text-white">

      {/* HEADER */}
      <header className=" border-b mt-10 border-red-500/20 px-6 py-4 flex justify-between items-center">



      </header>

      {/* BODY */}
      <div className="flex flex-1">

        {/* SIDEBAR */}
        <aside className="w-64 bg-gray-900 border-r border-red-500/20 p-4">

          <h2 className="text-lg font-semibold mb-4">
            Account Menu
          </h2>

          <div className="flex flex-col gap-2">

            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-left px-4 py-3 rounded-lg transition
                ${activeTab === tab.key
                    ? "bg-red-600"
                    : "hover:bg-red-700 text-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}

          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>

      </div>

      {/* FOOTER */}
      {/* <footer className="bg-gray-900 border-t border-red-500/20 text-center py-4 text-sm text-gray-400">
        © 2026 Fitness Club. All rights reserved.
      </footer> */}

    </div>
  );
};

export default Account;
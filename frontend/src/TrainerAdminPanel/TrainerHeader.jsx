import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  MapPin,
  CheckCircle,
  RefreshCcw,
  Clock
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api";
import toast from "react-hot-toast";
import { getDistance, GYM_LOCATION } from "../utils/locationUtils";

const CHECKIN_KEY = "trainer_checkin_data"; // localStorage key

const pageTitles = {
  "/trainer": "Dashboard",
  "/trainer/addworkouts": "Add Workouts",
  "/trainer/alladdworkouts": "All Workouts",
  "/trainer/adddietplans": "Add Diet Plans",
  "/trainer/alladddietplans": "All Diet Plans",
  "/trainer/update-weight": "Update Member Weight",
  "/trainer/overall-attendance": "Attendance",
  "/trainer/send-message": "Send Message",
  "/trainer/reports": "Reports",
  "/trainer/settings/profile": "Profile",
  "/trainer/pt-form": "Personal Training Form",
  "/trainer/session-tracking": "Session Tracking",
  "/trainer/pricing": "Pricing",
  "/trainer/followupenquriy": "Follow-up Enquiry",
  "/trainer/buyplanadmin": "Assign Plans",
};

/* ------------------------------------------------------------------ */
/* Helper: read check-in data from localStorage for a specific userId  */
/* ------------------------------------------------------------------ */
const getStoredCheckin = (userId) => {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.userId !== String(userId)) return null; // different trainer
    return data; // { userId, checkinTime, locationName }
  } catch {
    return null;
  }
};

const saveCheckin = (userId, locationName) => {
  const data = {
    userId: String(userId),
    checkinTime: Date.now(),
    locationName,
  };
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(data));
};

const clearCheckin = () => localStorage.removeItem(CHECKIN_KEY);

/* ------------------------------------------------------------------ */

const Header = ({ onMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'notifications', 'expiry', 'profile'
  const [alerts, setAlerts] = useState({
    expiring: [],
    assignments: []
  });
  const [fetchingAlerts, setFetchingAlerts] = useState(false);

  // Check-in state
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);          // button disabled
  const [checkinLocation, setCheckinLocation] = useState(""); // shown on button
  const [timeLeft, setTimeLeft] = useState("");               // countdown HH:MM

  const dropdownRef = useRef(null);
  const countdownRef = useRef(null);

  const { user, role, profileName, email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  /* ---- On mount: restore check-in state from localStorage ---------- */
  useEffect(() => {
    if (!user?.id) return;
    const stored = getStoredCheckin(user.id);
    if (!stored) return;

    const elapsedMs = Date.now() - stored.checkinTime;
    if (elapsedMs < 24 * 60 * 60 * 1000) {
      // Within same day/24h period, we show check-out option if they haven't checked out yet
      // For now, if stored in localStorage, it means they are currently "in"
      setCheckedIn(true);
      setCheckinLocation(stored.locationName || GYM_LOCATION.name);
    } else {
      // Cooldown expired -- clear and allow next check-in
      clearCheckin();
    }
  }, [user?.id]);


  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  /* ---- Alerts ------------------------------------------------------- */
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.id) return;
      try {
        setFetchingAlerts(true);
        const expiringData = [];
        const assignmentsData = [];

        // 1. Fetch expiring soon
        try {
          const expRes = await api.get(`/memberships/alerts/expiring-soon?trainerUserId=${user.id}`);
          const expData = expRes.data || [];
          expiringData.push(...expData);
        } catch (e) {
          console.error("Failed to fetch expiring alerts", e);
        }

        // 2. Fetch new assignments
        try {
          const assignRes = await api.get(`/assignments?trainerUserId=${user.id}`);
          const assigns = assignRes.data || [];
          
          // Filter assignments created/updated today
          const todayStr = new Date().toDateString();
          const recentAssigns = assigns.filter(a => {
            if (!a.updatedAt) return false;
            const assignDate = new Date(a.updatedAt).toDateString();
            return assignDate === todayStr;
          });

          assignmentsData.push(...recentAssigns);
        } catch (e) {
          console.error("Failed to fetch new assignments alerts", e);
        }

        setAlerts({ expiring: expiringData, assignments: assignmentsData });
      } catch (err) {
        console.error("Failed to fetch membership alerts:", err);
      } finally {
        setFetchingAlerts(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  /* ---- Page title --------------------------------------------------- */
  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }
    return "Dashboard";
  };

  /* ---- Logout ------------------------------------------------------- */
  const handleLogout = async () => {
    try {
      logout();
      if (auth) {
        await signOut(auth);
      }
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      navigate("/login", { replace: true });
    }
  };

  /* ---- Check-in ----------------------------------------------------- */
  const handleCheckIn = async () => {
    if (!user?.id || checkedIn) return;

    setMarkingAttendance(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setMarkingAttendance(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const distance = getDistance(latitude, longitude, GYM_LOCATION.lat, GYM_LOCATION.lng);
        const isAtGym = distance <= GYM_LOCATION.radius;

        if (!isAtGym) {
          toast.error(`You are not at the gym! Distance: ${Math.round(distance)}m`);
          setMarkingAttendance(false);
          return;
        }

        try {
          // Fetch location name
          let locationName = GYM_LOCATION.name;
          try {
            const geoRes = await api.get(`/attendance/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            if (geoRes.data?.display_name) {
              locationName = geoRes.data.display_name;
            }
          } catch (e) {
            console.error("Geocoding failed, using default name", e);
          }

          // Mark attendance
          const payload = {
            memberId: user.id,
            trainerId: user.id,
            status: "Present",
            date: new Date().toISOString().split("T")[0],
            lat: latitude,
            lng: longitude,
            locationName,
          };

          await api.post("/attendance", payload);

          // ✅ Persist to localStorage and lock button
          saveCheckin(user.id, locationName);
          setCheckinLocation(locationName);
          setCheckedIn(true);

          toast.success("✅ Attendance marked! Have a great session.");
        } catch (err) {
          console.error("Failed to mark attendance:", err);
          toast.error(err.response?.data?.message || "Failed to mark attendance");
        } finally {
          setMarkingAttendance(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Failed to get your location. Please check your permissions.");
        setMarkingAttendance(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckOut = async () => {
    if (!user?.id || !checkedIn) return;

    setMarkingAttendance(true);
    try {
      await api.post("/attendance/checkout", {
        memberId: user.id,
        date: new Date().toISOString().split("T")[0],
      });

      clearCheckin();
      setCheckedIn(false);
      setCheckinLocation("");
      toast.success("✅ Checked out successfully!");
    } catch (err) {
      console.error("Failed to check out:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to check out";
      
      if (err.response?.status === 404) {
        // If backend says no active check-in found, our local state is out of sync
        toast.error(`Sync Error: ${errorMsg}`);
        clearCheckin();
        setCheckedIn(false);
        setCheckinLocation("");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setMarkingAttendance(false);
    }
  };

  // ✅ Safe values with fallbacks
  const userName = profileName || user?.username || user?.name || "User";
  const userEmail = email || user?.email || "";
  const userRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  /* ---- Render ------------------------------------------------------- */
  return (
    <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white tracking-wide truncate leading-tight">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3" ref={dropdownRef}>

          {/* ===== QUICK CHECK-IN BUTTON ===== */}
          {checkedIn ? (
            /* ---- DISABLED: Already checked in -- show location + countdown ---- */
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-start gap-0.5 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 max-w-[180px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">In Session</span>
                </div>
                <p className="text-[9px] text-white/50 truncate w-full" title={checkinLocation}>
                  <MapPin className="w-2.5 h-2.5 inline mr-0.5 text-orange-400" />
                  {checkinLocation || GYM_LOCATION.name}
                </p>
              </div>
              <button
                onClick={handleCheckOut}
                disabled={markingAttendance}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-lg active:scale-95 ${
                  markingAttendance
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-400 text-white hover:shadow-red-500/30 hover:scale-105"
                }`}
              >
                {markingAttendance ? (
                  <RefreshCcw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogOut className="w-4 h-4 text-white" />
                )}
                {markingAttendance ? "Processing..." : "Check-out"}
              </button>
            </div>
          ) : (
            /* ---- ACTIVE: Ready to check in ---- */
            <button
              onClick={handleCheckIn}
              disabled={markingAttendance}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-lg active:scale-95 ${
                markingAttendance
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-600 to-orange-400 text-white hover:shadow-orange-500/30 hover:scale-105"
              }`}
            >
              {markingAttendance ? (
                <RefreshCcw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <MapPin className="w-4 h-4 text-white" />
              )}
              {markingAttendance ? "Verifying..." : "Check-in"}
            </button>
          )}

          {/* EXPIRING PLANS (CLOCK) ICON */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('expiry')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'expiry' ? 'bg-[#FF3131] text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="Expiring Memberships"
            >
              <Clock className="w-5 h-5" />
              {alerts.expiring.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                  {alerts.expiring.length}
                </span>
              )}
            </button>
            {activeDropdown === 'expiry' && (
              <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" /> Expirations
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                    {alerts.expiring.length} Active
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {fetchingAlerts ? (
                    <div className="p-10 text-center">
                      <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : alerts.expiring.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {alerts.expiring.map((item, idx) => {
                        const daysLeft = Math.ceil((new Date(item.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <Link key={idx} to="/trainer/expiry-members" onClick={() => setActiveDropdown(null)} className="p-4 block hover:bg-white/5 transition group">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase truncate">{item.username}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.planName}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">
                                    Expiring {daysLeft <= 0 ? 'Today' : `in ${daysLeft}d`}
                                  </span>
                                  <span className="text-[9px] text-gray-600">{new Date(item.endDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-500 text-xs">No expiring memberships today.</div>
                  )}
                </div>
                <Link to="/trainer/expiry-members" onClick={() => setActiveDropdown(null)} className="p-3 bg-white/5 border-t border-white/10 text-center text-[10px] font-bold text-[#FF3131] hover:text-red-400 transition uppercase tracking-widest block">
                  View All Records
                </Link>
              </div>
            )}
          </div>

          {/* MEMBER ALERTS (BELL) ICON */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('notifications')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'notifications' ? "bg-orange-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              title="Member Alerts"
            >
              <Bell className="w-5 h-5" />
              {alerts.assignments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {alerts.assignments.length}
                </span>
              )}
            </button>

            {activeDropdown === 'notifications' && (
              <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" /> Member Alerts
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">
                    {alerts.assignments.length} Records
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {fetchingAlerts ? (
                    <div className="p-10 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : alerts.assignments.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {alerts.assignments.map((alert, idx) => {
                        const daysAgo = Math.floor((new Date() - new Date(alert.updatedAt)) / (1000 * 60 * 60 * 24));
                        return (
                          <Link
                            key={idx}
                            to="/trainer"
                            onClick={() => setActiveDropdown(null)}
                            className="p-4 block hover:bg-white/5 transition group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase truncate">
                                  {alert.username || 'New Member'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Plan: <span className="text-gray-300">{alert.planName || '-'}</span>
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400">
                                    New Assignment
                                  </span>
                                  <span className="text-[9px] text-gray-600">
                                    {daysAgo <= 0 ? "Today" : `${daysAgo}d ago`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <Bell className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-xs text-gray-500">No new member assignments today.</p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                  <Link to="/trainer" onClick={() => setActiveDropdown(null)} className="text-[10px] font-bold text-orange-500 hover:text-orange-400 transition uppercase tracking-widest block">
                    View My Assignments
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* USER PROFILE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
              className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-white/60">{userRole}</p>
              </div>

              <ChevronDown className={`hidden sm:block w-4 h-4 text-white/70 transition ${activeDropdown === 'profile' ? "rotate-180" : ""}`} />
            </button>

            {activeDropdown === 'profile' && (
              <div className="absolute right-0 mt-4 w-56 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">{userName}</p>
                    <p className="text-xs text-white/60">{userEmail}</p>
                  </div>

                  <Link
                    to="/trainer/settings/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-white transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/20 text-sm text-red-400 w-full transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

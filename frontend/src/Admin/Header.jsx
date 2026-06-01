import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Package,
  Clock,
  AlertCircle,
  X,
  LayoutDashboard,
  MessageSquare,
  Users,
  CreditCard,
  UserCheck,
  ClipboardList,
  Activity,
  UserRound,
  CalendarCheck,
  Receipt,
  ShoppingCart,
  BarChart3,
  Dumbbell,
  HeartPulse,
  Send,
  Boxes,
  Plus,
  PhoneCall
} from "lucide-react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const pageInfo = {
  "/admin": { title: "Dashboard", icon: LayoutDashboard },
  "/admin/followupenquriy": { title: "Follow Up Enquiry", icon: PhoneCall },
  "/admin/enquiry": { title: "Client Enquiry", icon: MessageSquare },
  "/admin/products": { title: "Products", icon: Dumbbell },
  "/admin/addproducts": { title: "Add Products", icon: Plus },
  "/admin/orders": { title: "Orders", icon: ShoppingCart },
  "/admin/trainer-referred-plans": { title: "Trainer Referred Plans", icon: ClipboardList },
  "/admin/members": { title: "Members", icon: Users },
  "/admin/addmembers": { title: "Add Members", icon: Plus },
  "/admin/plansall": { title: "Normal Plans", icon: ClipboardList },
  "/admin/buyplanadmin": { title: "Buy Plans", icon: CreditCard },
  "/admin/assignedtrainers": { title: "Assigned Trainers", icon: UserCheck },
  "/admin/addplan": { title: "Add Plan", icon: Plus },
  "/admin/fecilities": { title: "Facilities", icon: Activity },
  "/admin/addfecilities": { title: "Add Facilities", icon: Plus },
  "/admin/staff": { title: "Trainers & Staffs", icon: UserRound },
  "/admin/addstaff": { title: "Add Staffs", icon: Plus },
  "/admin/appointments": { title: "Appointments", icon: CalendarCheck },
  "/admin/billing": { title: "Billing", icon: Receipt },
  "/admin/stockdetails": { title: "Inventory", icon: Boxes },
  "/admin/equipment": { title: "Gym Equipments", icon: Activity },
  "/admin/overall-attendance": { title: "Attendance", icon: CalendarCheck },
  "/admin/reports": { title: "Reports", icon: BarChart3 },
  "/admin/settings": { title: "Settings", icon: Settings },
  "/admin/settings/profile": { title: "Profile", icon: User },
  "/admin/settings/usermanagement": { title: "Usermanagement", icon: UserRound },
  "/admin/settings/reviews": { title: "Review", icon: MessageSquare },
  "/admin/settings/servicelist": { title: "Services Lists", icon: ClipboardList },
  "/admin/settings/offers": { title: "Marketing Offers", icon: ShoppingBag },
  "/admin/addservice": { title: "Add Services", icon: Plus },
  "/admin/send-message": { title: "Bulk Messaging", icon: Send },
  "/admin/payments": { title: "Payments", icon: CreditCard },
  "/admin/emi": { title: "EMI Payments", icon: CreditCard },
  "/admin/member-attendance": { title: "Member Attendance", icon: Users },
  "/admin/commenworkoutdiet": { title: "Workout & Diet", icon: HeartPulse },
  "/admin/users": { title: "Users", icon: Users },
  "/admin/pt-form": { title: "Personal Training Form", icon: HeartPulse },
  "/admin/pt-plans": { title: "PT Plans", icon: CalendarCheck },
  "/admin/add-pt-plan": { title: "Add PT Plan", icon: Plus },
  "/admin/buy-pt-plan": { title: "Buy PT Plans", icon: CreditCard },
  "/admin/member_details": { title: "Member Details", icon: User },
  "/admin/plan-history": { title: "Plan History", icon: Clock },
  "/admin/expiry-members": { title: "Plan Expiry Details", icon: Clock },
};

const Header = ({ onMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'profile', 'notifications', 'orders', 'stock', 'expiry'
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [alerts, setAlerts] = useState({
    orders: [],
    lowStock: [],
    expiring: [],
    registrations: []
  });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Refs
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const fetchAllAlerts = async () => {
      try {
        setLoadingAlerts(true);

        const [ordersRes, lowStockRes, expiringRes, regsRes] = await Promise.all([
          api.get('/orders/today').catch(() => ({ data: [] })),
          api.get('/products/alerts/low-stock').catch(() => ({ data: [] })),
          api.get('/memberships/alerts/expiring-soon').catch(() => ({ data: [] })),
          api.get('/memberships/today').catch(() => ({ data: [] }))
        ]);

        const todayStr = new Date().toDateString();
        const strictTodayRegs = (regsRes.data || []).filter(r => {
          const d = r.createdAt || r.created_at;
          if (!d) return false;
          return new Date(d).toDateString() === todayStr;
        });

        setAlerts({
          orders: ordersRes.data || [],
          lowStock: lowStockRes.data || [],
          expiring: expiringRes.data || [],
          registrations: strictTodayRegs,
        });
      } catch (err) {
        console.error("Dashboard alerts error:", err);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAllAlerts();

    const interval = setInterval(fetchAllAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For all dropdowns (handled by one parent ref in Admin Header)
      if (activeDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      // For Search Overlay
      if (showSearch && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, showSearch]);

  const totalAlerts =
    alerts.orders.length +
    alerts.lowStock.length +
    alerts.expiring.length +
    alerts.registrations.length;

  const getPageInfo = () => {
    // Sort paths by length descending to match more specific routes first
    const sortedPaths = Object.entries(pageInfo).sort((a, b) => b[0].length - a[0].length);

    for (const [path, info] of sortedPaths) {
      if (location.pathname === path || location.pathname.startsWith(path + "/")) {
        return info;
      }
    }

    return { title: "Dashboard", icon: LayoutDashboard };
  };

  const { title: currentPageTitle, icon: PageIcon } = getPageInfo();

  const handleLogout = async () => {
    try {
      // Clear AuthContext first
      logout();
      // Then sign out from Firebase
      if (auth) {
        await signOut(auth);
      }
      // Navigate to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if Firebase signout fails
      logout();
      navigate("/login", { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let target = "/admin/members"; // Default to members if on dashboard
    if (location.pathname.includes("products")) target = "/admin/products";
    else if (location.pathname.includes("orders")) target = "/admin/orders";
    else if (location.pathname.includes("members")) target = "/admin/members";
    else if (location.pathname.includes("staff") || location.pathname.includes("trainer")) target = "/admin/staff";

    navigate(`${target}?search=${encodeURIComponent(searchQuery)}`);
    setShowSearch(false);
    setSearchQuery("");
  };

  const { profileName, role, email, logout } = useAuth();

  // ✅ Safe values
  const userName = profileName || "Admin";
  const userRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Administrator";

  return (
    <header className="sticky top-0 z-30 
      bg-white/10 backdrop-blur-xl 
      border-b border-white/20
      shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl 
            bg-white/10 hover:bg-white/20 
            text-white transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-sm sm:text-lg lg:text-2xl font-bold 
            text-white tracking-tight flex items-center gap-2 truncate">
            <PageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF3131] shrink-0" />
            <span className="truncate">{currentPageTitle}</span>
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 shrink-0" ref={dropdownRef}>

          {/* TODAY ORDERS ICON */}
          <div className="relative">
            <button

              onClick={() => toggleDropdown('orders')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'orders' ? 'bg-[#FF3131] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="Today's Orders"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {alerts.orders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white ring-2 ring-[#0b0c10]">
                  {alerts.orders.length}
                </span>
              )}
            </button>
            {activeDropdown === 'orders' && (
              <AlertDropdown
                title="Today's Orders"
                items={alerts.orders}
                icon={<ShoppingBag className="w-4 h-4 text-green-500" />}
                type="orders"
                onClose={() => setActiveDropdown(null)}
                badgeColor="bg-green-500/20 text-green-400"
              />
            )}
          </div>

          {/* LOW STOCK ICON */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('stock')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'stock' ? 'bg-[#FF3131] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="Low Stock Alerts"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              {alerts.lowStock.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-[#0b0c10]">
                  {alerts.lowStock.length}
                </span>
              )}
            </button>
            {activeDropdown === 'stock' && (
              <AlertDropdown
                title="Stock Alerts"
                items={alerts.lowStock}
                icon={<Package className="w-4 h-4 text-orange-500" />}
                type="stock"
                onClose={() => setActiveDropdown(null)}
                badgeColor="bg-orange-500/20 text-orange-400"
              />
            )}
          </div>

          {/* EXPIRING PLANS ICON */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('expiry')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'expiry' ? 'bg-[#FF3131] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="Expiring Memberships"
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {alerts.expiring.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0b0c10]">
                  {alerts.expiring.length}
                </span>
              )}
            </button>
            {activeDropdown === 'expiry' && (
              <AlertDropdown
                title="Expirations"
                items={alerts.expiring}
                icon={<Clock className="w-4 h-4 text-red-500" />}
                type="expiry"
                onClose={() => setActiveDropdown(null)}
                badgeColor="bg-red-500/20 text-red-400"
              />
            )}
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

          {/* ADD TODAY MEMBERS ICON */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('members')}
              className={`p-2 rounded-xl transition relative ${activeDropdown === 'members' ? 'bg-[#FF3131] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="New Members Today"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              {alerts.registrations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white ring-2 ring-[#0b0c10]">
                  {alerts.registrations.length}
                </span>
              )}
            </button>
            {activeDropdown === 'members' && (
              <AlertDropdown
                title="New Members"
                items={alerts.registrations}
                icon={<User className="w-4 h-4 text-blue-500" />}
                type="members"
                onClose={() => setActiveDropdown(null)}
                badgeColor="bg-blue-500/20 text-blue-400"
              />
            )}
          </div>

          {/* SEARCH TRIGGER */}
          <button
            onClick={() => setShowSearch(p => !p)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
              className="flex items-center gap-3 px-2 md:px-3 py-1 md:py-1.5 
              rounded-2xl bg-white/10 hover:bg-white/20 
              transition"
            >
              <div className="w-7 h-7 sm:w-9 sm:w-9 rounded-full 
                bg-gradient-to-br from-cyan-500 to-sky-600
                flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">
                  {userName}
                </p>
                <p className="text-xs text-white/60">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-white/70 transition 
                ${activeDropdown === 'profile' ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === 'profile' && (
              <>
                {/* <div
                  onClick={() => setActiveDropdown(null)}
                  className="fixed inset-0 z-40"
                /> */}

                <div className="absolute right-0 mt-4 w-52
                  bg-gray-900 backdrop-blur-xl
                  border border-white/20
                  rounded-2xl shadow-2xl z-50 p-1">

                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="text-xs text-white/60">
                      {email}
                    </p>
                  </div>

                  <Link
                    to="/admin/settings/profile"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-white/20 
                    text-sm text-white transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-white/20 
                    text-sm text-white transition"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-red-500/20 
                    text-sm text-red-400 w-full transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* SEARCH OVERLAY */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-gray-950 flex items-center px-4 sm:px-6 animate-in slide-in-from-top duration-300" ref={searchContainerRef}>
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-4 max-w-4xl mx-auto">
            <Search className="w-6 h-6 text-[#FF3131]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, orders, members..."
              className="flex-1 bg-transparent border-none text-white focus:ring-0 text-xl font-medium outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

const AlertDropdown = ({ title, items, icon, type, onClose, badgeColor }) => (
  <>
    {/* <div onClick={onClose} className="fixed inset-0 z-40" /> */}
    <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeColor}`}>
          {items.length} Active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {items.map((item, idx) => {
              let link = "/admin";
              let content = null;

              if (type === 'orders') {
                link = "/admin/orders";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">{item.order_id}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">₹{item.total} • {new Date(item.created_at).toLocaleTimeString()}</p>
                  </>
                );
              } else if (type === 'stock') {
                link = "/admin/products";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors uppercase">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Category: {item.category}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black uppercase">Low Stock</span>
                  </>
                );
              } else if (type === 'members') {
                link = "/admin/members";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{item.name || item.username || "New Member"}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Joined at: {new Date(item.createdAt || item.created_at).toLocaleTimeString()}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase">New Registration</span>
                  </>
                );
              } else if (type === 'expiry') {
                link = "/admin/expiry-members";
                const daysLeft = Math.ceil((new Date(item.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase">{item.username}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.planName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">
                        Expiring {daysLeft <= 0 ? 'Today' : `in ${daysLeft}d`}
                      </span>
                      <span className="text-[9px] text-gray-600">{new Date(item.endDate).toLocaleDateString()}</span>
                    </div>
                  </>
                );
              }

              return (
                <Link key={idx} to={link} onClick={onClose} className="p-4 block hover:bg-white/5 transition group">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      {content}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500 text-xs">No active alerts for this category</div>
        )}
      </div>
      <Link to={type === 'orders' ? "/admin/orders" : type === 'stock' ? "/admin/products" : "/admin/expiry-members"} onClick={onClose} className="p-3 bg-white/5 border-t border-white/10 text-center text-[10px] font-bold text-[#FF3131] hover:text-red-400 transition uppercase tracking-widest">
        View All Records
      </Link>
    </div>
  </>
);

export default Header;

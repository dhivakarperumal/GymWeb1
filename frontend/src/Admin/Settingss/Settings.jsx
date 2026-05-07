import React from "react";
import {
  FaUserCog,
  FaUsers,
  FaStar,
  FaClipboardList,
  FaDumbbell,
  FaChartBar,
  FaHeartbeat,
  FaHistory,
  FaClock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* =======================
   SETTING CARD (GLASS)
======================= */
const SettingCard = ({ icon, title, desc, path }) => {
  const navigate = useNavigate();

  return (
    <div
      className="
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl p-5
        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4
        hover:bg-white/10 transition
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div
          className="
            p-4 rounded-xl
            bg-orange-500/20
            text-orange-400 text-xl
          "
        >
          {icon}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>
          <p className="text-sm text-white/60">
            {desc}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <button
        onClick={() => navigate(path)}
        className="
          px-6 py-2 rounded-lg text-sm font-semibold
          bg-gradient-to-r from-orange-500 to-orange-600
          text-white
          shadow-lg
          hover:scale-105 transition
          self-start sm:self-auto
        "
      >
        Manage
      </button>
    </div>
  );
};

const Settings = () => {
  return (
    <div
      className="
        p-6 space-y-6 min-h-screen
        
      "
    >

  

      {/* SETTINGS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* <SettingCard
          icon={<FaUserCog />}
          title="Profile Settings"
          desc="Update personal information and change password."
          path="/admin/settings/profile"
        /> */}

        <SettingCard
          icon={<FaUsers />}
          title="User Management"
          desc="Manage user roles, permissions, and accounts."
          path="/admin/settings/usermanagement"
        />

        <SettingCard
          icon={<FaHeartbeat />}
          title="Staff & Trainers"
          desc="Manage gym staff, trainers, and their details."
          path="/admin/staff"
        />

           <SettingCard
          icon={<FaClipboardList />}
          title="Staff Attendance"
          desc="Track and manage daily attendance for all gym staff and trainers."
          path="/admin/overall-attendance"
        />

        <SettingCard
          icon={<FaUsers />}
          title="Member Attendance"
          desc="View and manage individual member attendance records."
          path="/admin/member-attendance"
        />

        <SettingCard
          icon={<FaStar />}
          title="Gym Reviews & Ratings"
          desc="View and manage patient feedback, ratings, and complaints."
          path="/admin/settings/reviews"
        />

        <SettingCard
          icon={<FaClipboardList />}
          title="Services Lists"
          desc="View and manage patient feedback, ratings, and complaints."
          path="/admin/settings/servicelist"
        />

        <SettingCard
          icon={<FaDumbbell />}
          title="Gym Equipment"
          desc="Manage gym equipment inventory, maintenance status and details."
          path="/admin/equipment"
        />

        <SettingCard
          icon={<FaChartBar />}
          title="Reports & Analytics"
          desc="View gym performance, revenue, attendance and membership reports."
          path="/admin/reports"
        />

        <SettingCard
          icon={<FaHeartbeat />}
          title="Workout & Diet Plans"
          desc="Manage common workout routines and diet plans for members."
          path="/admin/commenworkoutdiet"
        />

        <SettingCard
          icon={<FaHistory />}
          title="Plan History"
          desc="View full membership plan purchase history — all plans, payments, and balances across all members."
          path="/admin/plan-history"
        />

        <SettingCard
          icon={<FaClock />}
          title="Plan Expiry Details"
          desc="Track members with upcoming plan expirations and follow up for renewals."
          path="/admin/expiry-members"
        />

        <SettingCard
          icon={<FaStar />}
          title="Marketing Offers"
          desc="Manage promotional offers and discounts for plans and products."
          path="/admin/settings/offers"
        />

     

      </div>
    </div>
  );
};

export default Settings;



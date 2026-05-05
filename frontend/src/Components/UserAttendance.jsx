import React, { useEffect, useState } from "react";
import api from "../api";
import dayjs from "dayjs";
import { Calendar, Clock, MapPin, CheckCircle2, XCircle } from "lucide-react";

const UserAttendance = ({ userId }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAttendance = async () => {
      try {
        const res = await api.get(`/attendance?memberId=${userId}`);
        setAttendance(res.data || []);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-red-500" size={24} />
          My Attendance
        </h2>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-full border border-white/5">
          Total Sessions: {attendance.length}
        </div>
      </div>

      {attendance.length === 0 ? (
        <div className="bg-gray-900/50 border border-white/5 rounded-3xl p-20 text-center">
          <Calendar size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No attendance records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attendance.map((record) => (
            <div 
              key={record.id} 
              className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:border-red-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {dayjs(record.date || record.check_in).format("DD MMM, YYYY")}
                  </span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                    {dayjs(record.date || record.check_in).format("dddd")}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  record.status === 'present' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {record.status === 'present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {record.status}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Clock size={16} className="text-red-500/60" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Check-in</span>
                    <span className="text-white/80">{dayjs(record.check_in).format("hh:mm A")}</span>
                  </div>
                  {record.check_out && (
                    <>
                      <div className="h-6 w-[1px] bg-white/10 mx-2" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Check-out</span>
                        <span className="text-white/80">{dayjs(record.check_out).format("hh:mm A")}</span>
                      </div>
                    </>
                  )}
                </div>

                {record.location_name && (
                  <div className="flex items-start gap-3 text-sm text-gray-400 pt-3 border-t border-white/5">
                    <MapPin size={16} className="text-red-500/60 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Location</span>
                      <span className="text-white/60 text-xs line-clamp-1">{record.location_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAttendance;

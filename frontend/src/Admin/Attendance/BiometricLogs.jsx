import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Search, 
  Calendar, 
  Cpu, 
  Database, 
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Settings
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const BiometricLogs = () => {
  const [deviceIp, setDeviceIp] = useState('192.168.1.1');
  const [serialNumber, setSerialNumber] = useState('DESKTOP-KM8GPUV\SQLEXPRESS');
  const [username, setUsername] = useState('essl');
  const [password, setPassword] = useState('essl');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState('unknown'); // 'online' | 'offline' | 'unknown'
  const [cooldown, setCooldown] = useState(0); // seconds left in retry cooldown
  const cooldownRef = React.useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 16),
    to: new Date().toISOString().slice(0, 16)
  });

  const fetchExistingLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      const biometricLogs = res.data.filter(log => log.location_name === 'Biometric Device');
      setLogs(biometricLogs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load logs from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingLogs();
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = (seconds = 10) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSync = async () => {
    if (syncing || cooldown > 0) return;
    try {
      setSyncing(true);
      setDeviceStatus('unknown');
      const res = await api.post('/attendance/sync-device', {
        deviceIp,
        serialNumber,
        username,
        password,
        fromDate: dateRange.from,
        toDate: dateRange.to
      });

      if (res.data.success) {
        setDeviceStatus('online');
        toast.success(res.data.message);
        fetchExistingLogs();
      } else {
        setDeviceStatus('offline');
        toast.error(res.data.error || 'Sync failed');
      }
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const errData = err.response?.data;

      if (status === 502) {
        // Device is unreachable — give a clear actionable message
        setDeviceStatus('offline');
        toast.error(
          `Device Unreachable at ${deviceIp}\n${errData?.details || 'Check that the device is powered on and connected to the same network.'}`,
          { duration: 8000 }
        );
        startCooldown(10); // prevent retry spam
      } else {
        setDeviceStatus('offline');
        toast.error(errData?.error || errData?.details || 'Sync failed. Check device IP and network.');
        startCooldown(5);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Filter and Paginate logs
  const filteredLogs = logs.filter(log => 
    log.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cpu className="text-orange-500 w-8 h-8" />
            Biometric Device Integration
          </h1>
          <p className="text-white/60 mt-1">Manage and sync attendance logs from your physical biometric device.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {syncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {syncing ? 'Syncing...' : 'Sync Device Logs'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Device Configuration
              </h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                deviceStatus === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                deviceStatus === 'offline' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-white/5 text-white/40 border-white/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  deviceStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                  deviceStatus === 'offline' ? 'bg-red-500' :
                  'bg-white/20'
                }`} />
                {deviceStatus}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Device IP Address</label>
                <div className="mt-1.5 relative group">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    placeholder="192.168.1.140"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Serial Number</label>
                <div className="mt-1.5 relative group">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    placeholder="BRM9202760325"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              </div>

              <hr className="border-white/10 my-4" />

              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Sync Date Range</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                  <input
                    type="datetime-local"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all [color-scheme:dark]"
                  />
                  <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">FROM</span>
                </div>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                  <input
                    type="datetime-local"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all [color-scheme:dark]"
                  />
                  <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">TO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6">
            <div className="flex gap-4">
              <AlertCircle className="text-orange-500 w-6 h-6 shrink-0" />
              <div>
                <h4 className="text-orange-500 font-bold text-sm">Device Connection Tip</h4>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">
                  The biometric device must be on the same local network as your gym's server. 
                  If you are using a cloud-hosted server, you may need a VPN or port forwarding configured on your local router.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[600px]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-500" />
                Synced Attendance Logs
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search member..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white outline-none focus:ring-1 focus:ring-orange-500/50 w-48 transition-all"
                  />
                </div>
                <div className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  {filteredLogs.length} Records Found
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                  <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-white font-medium">Fetching records...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Database className="w-10 h-10 text-white/20" />
                  </div>
                  <h3 className="text-xl font-bold text-white/80">No Synced Logs Yet</h3>
                  <p className="text-white/40 mt-2 max-w-xs mx-auto">
                    Connect your device and click "Sync Device Logs" to fetch attendance data into your database.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/10 text-white/50 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 text-center w-16">S.No</th>
                      <th className="px-6 py-4">Member</th>
                      <th className="px-6 py-4">Check In</th>
                      <th className="px-6 py-4">Check Out</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5 text-center text-white/30 text-xs font-bold">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
                              <User className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                              <div className="text-white font-bold">{log.name}</div>
                              <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{log.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-white/80 font-medium">
                            <Clock className="w-4 h-4 text-emerald-500/50" />
                            {log.check_in ? new Date(log.check_in).toLocaleString() : '---'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-white/80 font-medium">
                            <Clock className="w-4 h-4 text-red-500/50" />
                            {log.check_out ? new Date(log.check_out).toLocaleString() : '---'}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Present
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-xs text-white/60 font-medium italic">Device Log</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <div className="text-xs text-white/40">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 rotate-180" />
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === i + 1 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricLogs;

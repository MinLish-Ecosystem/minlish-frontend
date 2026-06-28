import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  Play, 
  Database, 
  Mail, 
  HardDrive, 
  BrainCircuit
} from "lucide-react";
import { getAdminStats, getAuditLogs, getPendingSets, runAutoModeration, getSystemConfig } from "../../api/admin.api";
import { toast } from "react-hot-toast";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalSets: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, logsRes, configRes] = await Promise.all([
        getAdminStats(),
        getPendingSets(),
        getAuditLogs(1, 5),
        getSystemConfig()
      ]);

      setStats(statsRes.data.data);
      setPendingCount(pendingRes.data.data.length);
      setAuditLogs(logsRes.data.data.data || []);
      setSystemConfig(configRes.data.data);
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
      toast.error("Failed to load system statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunModeration = async () => {
    if (moderating) return;
    try {
      setModerating(true);
      const res = await runAutoModeration();
      const stats = res.data.data;
      toast.success(
        `Moderation completed! Processed ${stats.processed} sets: Approved ${stats.approved}, Rejected ${stats.rejected}.`,
        { duration: 5000 }
      );
      loadData();
    } catch (error) {
      console.error("Manual moderation trigger failed:", error);
      toast.error("Failed to run auto-moderation");
    } finally {
      setModerating(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-full w-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">System Overview</h2>
          <p className="text-slate-500 text-sm mt-1">
            Monitor system users, service health, and review content queues.
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Data
        </button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm flex items-center gap-5 relative overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1000a3]/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="w-12 h-12 rounded-xl bg-[#e1e0ff] text-[#1000a3] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Users</p>
            <h3 className="text-2xl font-extrabold text-[#0b1c30] mt-1">{stats?.totalUsers}</h3>
            <p className="text-[11px] text-[#6900b3] font-semibold mt-1">Active: {stats?.activeUsers}</p>
          </div>
        </div>

        {/* Card 2: Banned */}
        <div 
          onClick={() => navigate('/admin/users', { state: { status: 'banned' } })}
          className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm flex items-center gap-5 relative overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ba1a1a]/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Banned Accounts</p>
            <h3 className="text-2xl font-extrabold text-[#0b1c30] mt-1">{stats?.bannedUsers}</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Pending review / appeal</p>
          </div>
        </div>

        {/* Card 3: Sets */}
        <div 
          onClick={() => navigate('/admin/vocabulary')}
          className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm flex items-center gap-5 relative overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8127cf]/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="w-12 h-12 rounded-xl bg-[#f0dbff] text-[#8127cf] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Vocabulary Sets</p>
            <h3 className="text-2xl font-extrabold text-[#0b1c30] mt-1">{stats?.totalSets}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Total published sets</p>
          </div>
        </div>

        {/* Card 4: Pending Moderation */}
        <div 
          onClick={() => navigate('/admin/moderation')}
          className={`p-6 rounded-2xl border shadow-sm flex items-center gap-5 relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
            pendingCount > 0 
              ? 'bg-amber-50/50 border-amber-200 animate-pulse-subtle' 
              : 'bg-white border-[#c7c4d7]/40'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            pendingCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-extrabold text-[#0b1c30] mt-1">{pendingCount}</h3>
            <p className={`text-[11px] font-semibold mt-1 ${
              pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {pendingCount > 0 ? 'Requires AI/Manual scan review' : 'All sets clean'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Services Health & Fast Run */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status Dashboard */}
        <div className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#0b1c30]">System Services Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MongoDB */}
            <div className="p-4 bg-[#f8f9ff] border border-slate-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#1000a3]" />
                <div>
                  <h4 className="text-sm font-semibold">MongoDB Database</h4>
                  <p className="text-[10px] text-slate-400">Primary data storage connection</p>
                </div>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Redis Cache */}
            <div className="p-4 bg-[#f8f9ff] border border-slate-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-[#8127cf]" />
                <div>
                  <h4 className="text-sm font-semibold">Redis Cache & Queue</h4>
                  <p className="text-[10px] text-slate-400">Leaderboards, sessions & queues</p>
                </div>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* SendGrid Mailer */}
            <div className="p-4 bg-[#f8f9ff] border border-slate-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#1000a3]" />
                <div>
                  <h4 className="text-sm font-semibold">SendGrid Mailer</h4>
                  <p className="text-[10px] text-slate-400">
                    {systemConfig?.mailerActive ? "Connected and active" : "Disabled"}
                  </p>
                </div>
              </div>
              <span className={`flex h-2.5 w-2.5 rounded-full ${
                systemConfig?.mailerActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`} />
            </div>

            {/* Gemini AI API */}
            <div className="p-4 bg-[#f8f9ff] border border-slate-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-[#8127cf]" />
                <div>
                  <h4 className="text-sm font-semibold">Google Gemini API</h4>
                  <p className="text-[10px] text-slate-400">Content moderation & generation support</p>
                </div>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Auto Moderation Quick Trigger */}
        <div className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0b1c30] mb-2">Run Moderation Scan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              You can trigger a manual Google Gemini AI moderation scan for the {pendingCount} vocabulary sets currently in the queue, without waiting for the next {systemConfig?.moderationInterval}h cycle.
            </p>
          </div>
          
          <button
            onClick={handleRunModeration}
            disabled={moderating || pendingCount === 0}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-[#1000a3] to-[#8127cf] hover:from-[#1000a3]/90 hover:to-[#8127cf]/90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {moderating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Moderating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Moderate {pendingCount} sets
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Row: Recent Audit Logs */}
      <div className="bg-white p-6 rounded-2xl border border-[#c7c4d7]/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-[#0b1c30]">Recent Admin Actions (Audit Logs)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">Target Entity</th>
                <th className="pb-3 pr-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No recent admin actions recorded.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: any) => (
                  <tr key={log._id} className="border-b border-slate-5 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString("en-US")}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action.includes("ban") ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#e5eeff] text-[#2f2dbe]"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-xs text-[#0b1c30]">
                      {log.targetType} ({log.targetId})
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {log.reason || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

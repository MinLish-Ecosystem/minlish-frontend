import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Search, 
  Download, 
  Ban, 
  Unlock, 
  Trash2, 
  Eye, 
  X,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { listUsers, getUserDetail, banUser, unbanUser, deleteUser, getReportsCSV, resetUserAuthApi } from "../../api/admin.api";
import { toast } from "react-hot-toast";

export default function AdminUserManagement() {
  const location = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(location.state?.status || "");
  const [loading, setLoading] = useState(true);

  // Sync state from dashboard redirect
  useEffect(() => {
    if (location.state && location.state.status !== undefined) {
      setStatusFilter(location.state.status);
    }
  }, [location.state]);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Reset Auth states
  const [showResetAuth, setShowResetAuth] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const fetchUsersList = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await listUsers(page, pagination.limit);
      const rawUsers = res.data.data;
      const meta = (res.data as any).meta;
      
      // Local filtering if backend does not fully support it
      let filtered = Array.isArray(rawUsers) ? rawUsers : [];
      if (searchTerm) {
        filtered = filtered.filter((u: any) => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (roleFilter) {
        filtered = filtered.filter((u: any) => u.role === roleFilter);
      }
      if (statusFilter) {
        const isActive = statusFilter === "active";
        filtered = filtered.filter((u: any) => u.isActive === isActive);
      }

      setUsers(filtered);
      setPagination({
        ...pagination,
        page,
        total: meta?.total || filtered.length,
        totalPages: meta?.totalPages || Math.ceil(filtered.length / pagination.limit),
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList(1);
  }, [roleFilter, statusFilter]); // Auto reload on filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersList(1);
  };

  // View detail
  const handleViewDetail = async (userId: string) => {
    try {
      setDetailLoading(true);
      const res = await getUserDetail(userId);
      const u = res.data.data;
      setSelectedUser(u);
      setResetEmail(u?.email || "");
      setShowResetAuth(false);
    } catch (error) {
      console.error("Failed to load user detail:", error);
      toast.error("Failed to load user details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResetAuthSubmit = async () => {
    if (!selectedUser) return;
    if (!resetEmail.trim()) {
      toast.error("Please enter email");
      return;
    }
    setResetLoading(true);
    try {
      await resetUserAuthApi(selectedUser._id || selectedUser.id, resetEmail.trim());
      toast.success("Auth reset successfully! Temporary password sent to email.");
      setShowResetAuth(false);
      // Reload details to update email
      handleViewDetail(selectedUser._id || selectedUser.id);
      fetchUsersList(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to perform Reset Auth. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Ban user
  const handleBanUser = async () => {
    if (!banUserId || !banReason.trim()) return;
    try {
      await banUser(banUserId, banReason);
      toast.success("User account banned successfully");
      setBanUserId(null);
      setBanReason("");
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error("Failed to ban user account");
    }
  };

  // Unban user
  const handleUnbanUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to unban this user account?")) return;
    try {
      await unbanUser(userId);
      toast.success("User account unbanned successfully");
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to unban user:", error);
      toast.error("Failed to unban user account");
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      toast.success("User permanently deleted successfully");
      setDeleteUserId(null);
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user account");
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      toast.loading("Preparing CSV report...", { id: "csv" });
      const response = await getReportsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "minlish_users_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully", { id: "csv" });
    } catch (error) {
      console.error("CSV Export failed:", error);
      toast.error("Failed to export report", { id: "csv" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">
            Search users, manage ban statuses, or export users report as CSV.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1000a3] hover:bg-[#1000a3]/90 text-white font-bold rounded-xl shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c7c4d7]/40 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1000a3] focus:border-transparent transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-sm transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8f9ff]/50 text-slate-400 font-semibold">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="inline-block w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-xs text-slate-500 mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No users found matching parameters.
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user._id} className="border-b border-slate-50 hover:bg-[#f8f9ff]/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                        <img 
                          src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{user.name}</span>
                    </td>
                    <td className="p-4 text-slate-500">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'admin' ? 'bg-[#f0dbff] text-[#6900b3]' : 'bg-[#e5eeff] text-[#2f2dbe]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        user.isActive ? "text-emerald-600" : "text-[#ba1a1a]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-[#ba1a1a]"}`} />
                        {user.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleViewDetail(user._id)}
                        title="View Details"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {user.isActive ? (
                        <button 
                          onClick={() => setBanUserId(user._id)}
                          title="Ban User"
                          disabled={user.role === 'admin'}
                          className="p-1.5 hover:bg-[#ffdad6] rounded-lg text-[#ba1a1a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnbanUser(user._id)}
                          title="Unban User"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setDeleteUserId(user._id)}
                        title="Delete Permanently"
                        disabled={user.role === 'admin'}
                        className="p-1.5 hover:bg-[#ffdad6] rounded-lg text-[#ba1a1a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-[#f8f9ff]/30 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages} (Total {pagination.total} users)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchUsersList(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => fetchUsersList(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal: View User Details */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-[#c7c4d7]/40 shadow-xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0b1c30]">User Details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1000a3]/20 bg-slate-50">
                <img 
                  src={selectedUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                  alt={selectedUser.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0b1c30]">{selectedUser.name}</h4>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedUser.role === 'admin' ? 'bg-[#f0dbff] text-[#6900b3]' : 'bg-[#e5eeff] text-[#2f2dbe]'
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedUser.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Status</p>
                <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedUser.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {selectedUser.isActive ? "Active" : "Banned"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Since</p>
                <p className="text-sm font-semibold mt-1">
                  {new Date(selectedUser.createdAt).toLocaleDateString("en-US")}
                </p>
              </div>
            </div>

            {selectedUser.banReason && (
              <div className="p-4 bg-[#ffdad6] border border-[#ffb59f] rounded-xl text-[#842402] text-xs">
                <p className="font-bold">Ban Reason:</p>
                <p className="mt-1 italic">"{selectedUser.banReason}"</p>
              </div>
            )}

            {/* Reset Auth Section */}
            {selectedUser.role !== 'admin' && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {!showResetAuth ? (
                  <button
                    onClick={() => setShowResetAuth(true)}
                    className="w-full py-2.5 px-4 bg-[#1000a3] text-white rounded-xl text-xs font-bold hover:scale-[1.02] hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Recover Auth (Reset Auth & Email)</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-700">Reset Auth Credentials</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Set a new login email and automatically send a temporary password.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Login Email</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowResetAuth(false)}
                        disabled={resetLoading}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAuthSubmit}
                        disabled={resetLoading}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {resetLoading ? "Sending..." : "Send Password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Ban User */}
      {banUserId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-[#c7c4d7]/40 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#0b1c30]">Ban User Account</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to ban this user? The user will be immediately logged out and unable to log back in.
            </p>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reason for Ban</label>
              <textarea 
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason (e.g. Violating community policies)..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba1a1a] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => { setBanUserId(null); setBanReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBanUser}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Delete User */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-[#c7c4d7]/40 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#ba1a1a]">Warning: Permanently Delete User</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              This action <strong className="text-slate-800">CANNOT BE UNDONE</strong>. It will delete the user account, all progress, learning history, and personal details permanently.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeleteUserId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

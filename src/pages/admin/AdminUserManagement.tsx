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
import { listUsers, getUserDetail, banUser, unbanUser, deleteUser, getReportsCSV } from "../../api/admin.api";
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

  // States cho các modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const fetchUsersList = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await listUsers(page, pagination.limit);
      const rawUsers = res.data.data;
      const meta = (res.data as any).meta;
      
      // Lọc danh sách cục bộ theo từ khóa và bộ lọc (nếu backend chưa hỗ trợ đầy đủ bộ lọc)
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
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList(1);
  }, [roleFilter, statusFilter]); // Tự động reload khi đổi filter

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersList(1);
  };

  // Xem chi tiết
  const handleViewDetail = async (userId: string) => {
    try {
      setDetailLoading(true);
      const res = await getUserDetail(userId);
      setSelectedUser(res.data.data);
    } catch (error) {
      console.error("Failed to load user detail:", error);
      toast.error("Không thể tải chi tiết người dùng");
    } finally {
      setDetailLoading(false);
    }
  };

  // Khóa tài khoản
  const handleBanUser = async () => {
    if (!banUserId || !banReason.trim()) return;
    try {
      await banUser(banUserId, banReason);
      toast.success("Đã khóa tài khoản người dùng thành công");
      setBanUserId(null);
      setBanReason("");
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error("Không thể khóa tài khoản");
    }
  };

  // Mở khóa tài khoản
  const handleUnbanUser = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn mở khóa cho tài khoản này không?")) return;
    try {
      await unbanUser(userId);
      toast.success("Đã mở khóa tài khoản thành công");
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to unban user:", error);
      toast.error("Không thể mở khóa tài khoản");
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      toast.success("Đã xóa vĩnh viễn người dùng thành công");
      setDeleteUserId(null);
      fetchUsersList(pagination.page);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Không thể xóa tài khoản");
    }
  };

  // Xuất file CSV
  const handleExportCSV = async () => {
    try {
      toast.loading("Đang chuẩn bị báo cáo CSV...", { id: "csv" });
      const response = await getReportsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "minlish_users_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Tải xuống báo cáo thành công", { id: "csv" });
    } catch (error) {
      console.error("CSV Export failed:", error);
      toast.error("Xuất báo cáo thất bại", { id: "csv" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Quản lý Người dùng</h2>
          <p className="text-slate-500 text-sm mt-1">
            Tra cứu thông tin, cấm tài khoản, hoặc xuất báo cáo CSV người dùng.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1000a3] hover:bg-[#1000a3]/90 text-white font-bold rounded-xl shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo CSV
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
              placeholder="Tìm kiếm theo tên, email..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1000a3] focus:border-transparent transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-sm transition-colors">
            Tìm
          </button>
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#1000a3]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#c7c4d7]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8f9ff]/50 text-slate-400 font-semibold">
                <th className="p-4">Người dùng</th>
                <th className="p-4">Email</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày đăng ký</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="inline-block w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-xs text-slate-500 mt-2">Đang tải danh sách người dùng...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user._id} className="border-b border-slate-50 hover:bg-[#f8f9ff]/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                        <img 
                          src={user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"} 
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
                        {user.isActive ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleViewDetail(user._id)}
                        title="Xem chi tiết"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {user.isActive ? (
                        <button 
                          onClick={() => setBanUserId(user._id)}
                          title="Khóa tài khoản"
                          disabled={user.role === 'admin'}
                          className="p-1.5 hover:bg-[#ffdad6] rounded-lg text-[#ba1a1a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnbanUser(user._id)}
                          title="Mở khóa tài khoản"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setDeleteUserId(user._id)}
                        title="Xóa vĩnh viễn"
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
              Trang {pagination.page} trên {pagination.totalPages} (Tổng số {pagination.total} người dùng)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchUsersList(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Trước
              </button>
              <button 
                onClick={() => fetchUsersList(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal: Xem chi tiết User */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-[#c7c4d7]/40 shadow-xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0b1c30]">Thông tin chi tiết</h3>
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
                  src={selectedUser.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"} 
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
                    {selectedUser.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái hoạt động</p>
                <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedUser.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {selectedUser.isActive ? "Đang hoạt động" : "Bị khóa"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đăng ký vào lúc</p>
                <p className="text-sm font-semibold mt-1">
                  {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            {selectedUser.banReason && (
              <div className="p-4 bg-[#ffdad6] border border-[#ffb59f] rounded-xl text-[#842402] text-xs">
                <p className="font-bold">Lý do khóa tài khoản:</p>
                <p className="mt-1 italic">"{selectedUser.banReason}"</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Khóa tài khoản (Ban User) */}
      {banUserId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-[#c7c4d7]/40 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#0b1c30]">Khóa tài khoản người dùng</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào trong ứng dụng.
            </p>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Lý do khóa tài khoản</label>
              <textarea 
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Nhập lý do cấm tài khoản (ví dụ: Vi phạm quy định cộng đồng)..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba1a1a] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => { setBanUserId(null); setBanReason(""); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleBanUser}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                Xác nhận Khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Xóa vĩnh viễn (Delete User) */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-[#c7c4d7]/40 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#ba1a1a]">Cảnh báo: Xóa vĩnh viễn người dùng</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Hành động này <strong className="text-slate-800">KHÔNG THỂ HOÀN TÁC</strong>. Hệ thống sẽ xóa vĩnh viễn tài khoản người dùng, toàn bộ tiến trình học tập, lịch sử ôn luyện và thông tin cá nhân liên quan.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeleteUserId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

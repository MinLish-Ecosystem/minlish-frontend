import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  EyeOff, 
  Clock, 
  Globe, 
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Lock as LockIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { listAllPosts, getPendingPosts, overridePostModeration } from "../../api/admin.api";
import { deletePost, updatePost } from "../../api/post.api";
import { cn } from "../../lib/utils";

export default function AdminCommunityPosts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  
  // Lists & States
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (activeTab === "all") {
        const res = await listAllPosts(currentPage, 10);
        if (res.data?.success) {
          setAllPosts(res.data.data || []);
          const dataWithPagination = res.data as any;
          if (dataWithPagination.pagination) {
            setTotalPages(dataWithPagination.pagination.totalPages);
          }
        }
      } else {
        const res = await getPendingPosts();
        if (res.data?.success) {
          setPendingPosts(res.data.data || []);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, currentPage]);

  const handleApprove = async (postId: string) => {
    try {
      const res = await overridePostModeration({
        postId,
        status: "approved",
        reason: "Phê duyệt bởi Quản trị viên"
      });
      if (res.data?.success) {
        toast.success("Đã phê duyệt bài viết công khai!");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Duyệt thất bại");
    }
  };

  const handleOpenRejectModal = (postId: string) => {
    setSelectedPostId(postId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error("Vui lòng điền lý do từ chối");
      return;
    }
    setSubmittingReject(true);
    try {
      const res = await overridePostModeration({
        postId: selectedPostId!,
        status: "rejected",
        reason: rejectReason.trim()
      });
      if (res.data?.success) {
        toast.success("Đã từ chối bài viết");
        setShowRejectModal(false);
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleHidePost = async (postId: string) => {
    if (!window.confirm("Bạn có muốn ẩn bài viết này khỏi bảng tin cộng đồng (chuyển sang Private)?")) {
      return;
    }
    try {
      const res = await updatePost(postId, { isPublic: false });
      if (res.data?.success) {
        toast.success("Bài viết đã được ẩn (Private)");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể ẩn bài viết");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ xóa vĩnh viễn.")) {
      return;
    }
    try {
      const res = await deletePost(postId);
      if (res.data?.success) {
        toast.success("Đã xóa bài viết thành công!");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa bài viết");
    }
  };

  // Render Status Badge helper
  const renderStatusBadge = (item: any) => {
    if (!item.isPublic) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
          <LockIcon className="w-3 h-3" />
          <span>Riêng tư</span>
        </span>
      );
    }

    switch (item.moderationStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>Chờ duyệt</span>
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
            <Globe className="w-3 h-3" />
            <span>Công khai</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>Từ chối</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Filter posts by search query (local filtering on the page)
  const getFilteredPosts = () => {
    const list = activeTab === "all" ? allPosts : pendingPosts;
    if (!searchQuery.trim()) return list;
    return list.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.author?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý Bài viết Cộng đồng</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Duyệt bài viết của người dùng hoặc tự soạn bài viết mới.</p>
        </div>
        <button
          onClick={() => navigate("/community/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1000a3] text-white rounded-full font-bold text-xs hover:scale-105 hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bài viết mới</span>
        </button>
      </div>

      {/* Tabs Control Row */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white border border-[#c7c4d7]/40 rounded-3xl p-4 shadow-sm">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "all"
                ? "bg-white text-[#1000a3] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Tất cả bài viết
          </button>
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "pending"
                ? "bg-white text-[#1000a3] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <span>Đang chờ duyệt</span>
            {pendingPosts.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black leading-none">
                {pendingPosts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1000a3] transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-[#c7c4d7]/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-4" />
            <p className="text-slate-500 text-xs font-bold">Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-600 text-sm">Không tìm thấy bài viết nào</h3>
            <p className="text-slate-400 text-xs mt-1">Chưa có dữ liệu bài viết phù hợp hiển thị.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Bài viết</th>
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4">Chủ đề</th>
                  <th className="px-6 py-4">Độ khó</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPosts.map((post) => (
                  <tr key={post._id || post.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-col gap-1">
                        <span 
                          className="font-bold text-slate-800 line-clamp-1 hover:text-[#1000a3] cursor-pointer flex items-center gap-1"
                          onClick={() => {
                            if (post.isPublic && post.moderationStatus === "approved") {
                              window.open(`/community/post/${post._id || post.id}`, "_blank");
                            } else {
                              toast.error("Bài viết đang ẩn hoặc chưa phê duyệt, không thể xem công khai.");
                            }
                          }}
                        >
                          {post.title}
                          {post.isPublic && post.moderationStatus === "approved" && (
                            <ExternalLink className="w-3 h-3 text-slate-400 inline" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")} • {post.readingTime || 1} phút đọc
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {post.author?.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover border border-[#1000a3]/10"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{post.author?.name || "Ẩn danh"}</span>
                          <span className="text-[9px] text-slate-400">{post.author?.email || ""}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1000a3] rounded-md font-bold text-[10px]">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {post.difficulty}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(post)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approval buttons (only for pending tab or pending status) */}
                        {post.isPublic && post.moderationStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(post._id || post.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Phê duyệt bài viết"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(post._id || post.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Từ chối phê duyệt"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {/* Edit, Set Private, Delete */}
                        {post.isPublic && post.moderationStatus === "approved" && (
                          <button
                            onClick={() => handleHidePost(post._id || post.id)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                            title="Ẩn bài viết (Set Private)"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/community/post/${post._id || post.id}/edit`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Sửa bài viết"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(post._id || post.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa bài viết"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination (only for All tab) */}
        {activeTab === "all" && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400 font-semibold">
              Trang {currentPage} trên {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <h3 className="text-lg font-black text-slate-800 mb-2">Từ chối bài viết</h3>
            <p className="text-slate-400 text-xs mb-4">Vui lòng điền lý do chi tiết từ chối bài viết này. Người đăng bài sẽ nhận được lý do này qua thông báo.</p>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                placeholder="Nhập lý do từ chối (ví dụ: chứa nội dung spam, không đúng chủ đề tiếng Anh...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                required
              />

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2.5 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-5 py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  BookOpen, 
  FileText, 
  Globe, 
  Lock, 
  AlertCircle, 
  Clock,
  Search,
  Eye,
  XCircle,
  Plus,
  ExternalLink,
  ArrowLeft,
  Edit2,
  Send
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

export default function MyContentManager() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "posts" ? "posts" : "sets";

  const [sets, setSets] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "public" | "pending" | "rejected" | "private">("all");

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === "sets") {
        const res = await api.get("/api/v1/vocab/sets");
        if (res.data?.success) {
          setSets(res.data.data || []);
        }
      } else {
        const res = await api.get("/api/v1/posts", { params: { manage: true } });
        if (res.data?.success) {
          setPosts(res.data.data || []);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load your content list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const handleSetTab = (tab: "sets" | "posts") => {
    setSearchParams({ tab });
    setSearchQuery("");
    setStatusFilter("all");
  };

  /** Atomically cancel pending review — pulls set back to private */
  const handleCancelPending = async (setId: string) => {
    try {
      const res = await api.post(`/api/v1/vocab/sets/${setId}/cancel-pending`);
      if (res.data?.success) {
        const returned = res.data.data;
        if (returned?.isPublic === false) {
          toast.success("Đã kéo bộ từ về Riêng tư. Bạn có thể chỉnh sửa và gửi lại.");
        } else {
          // Admin already processed it — moderation already done
          toast("Bộ từ đã được admin xử lý. Vui lòng kiểm tra trạng thái mới.", { icon: "ℹ️" });
        }
        fetchContent();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  /** Make post private */
  const handleSetPostPrivate = async (postId: string) => {
    try {
      const res = await api.put(`/api/v1/posts/${postId}`, { isPublic: false });
      if (res.data?.success) {
        toast.success("Bài viết đã về trạng thái bản nháp.");
        fetchContent();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to make post private");
    }
  };

  /** Quickly make a private set public (sends for moderation) */
  const handleMakePublic = async (setId: string) => {
    try {
      const res = await api.put(`/api/v1/vocab/sets/${setId}`, { isPublic: true });
      if (res.data?.success) {
        toast.success("Đã gửi bộ từ để kiểm duyệt. Vui lòng đợi phê duyệt.");
        fetchContent();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gửi duyệt thất bại");
    }
  };

  /** Quickly make an approved public set private */
  const handleMakePrivate = async (setId: string) => {
    try {
      const res = await api.put(`/api/v1/vocab/sets/${setId}`, { isPublic: false });
      if (res.data?.success) {
        toast.success("Bộ từ đã trở về Riêng tư.");
        fetchContent();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  // ─── Status helpers ───────────────────────────────────────────────────────

  const getStatusMeta = (item: any) => {
    if (!item.isPublic) {
      return { label: "Riêng tư", color: "slate", icon: Lock };
    }
    switch (item.moderationStatus) {
      case "pending":   return { label: "Chờ duyệt", color: "amber",   icon: Clock };
      case "approved":  return { label: "Công khai",  color: "emerald", icon: Globe };
      case "rejected":  return { label: "Từ chối",    color: "rose",    icon: AlertCircle };
      default:          return { label: "Riêng tư",   color: "slate",   icon: Lock };
    }
  };

  const STATUS_BADGE_STYLES: Record<string, string> = {
    slate:   "bg-slate-100 text-slate-600 border-slate-200",
    amber:   "bg-amber-50 text-amber-600 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rose:    "bg-rose-50 text-rose-600 border-rose-200",
  };

  const renderStatusBadge = (item: any, animate = false) => {
    const { label, color, icon: Icon } = getStatusMeta(item);
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
        STATUS_BADGE_STYLES[color],
        animate && color === "amber" ? "animate-pulse" : ""
      )}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
    );
  };

  // ─── Sort & Filter ────────────────────────────────────────────────────────

  const SORT_ORDER: Record<string, number> = { pending: 0, rejected: 1, approved: 2, private: 3 };

  const getStatusKey = (item: any) => {
    if (!item.isPublic) return "private";
    return item.moderationStatus || "approved";
  };

  const applyFilters = (list: any[]) => {
    return list
      .filter((item) => {
        const name = (item.name || item.title || "").toLowerCase();
        const desc = (item.description || item.excerpt || item.content || "").toLowerCase();
        if (!name.includes(searchQuery.toLowerCase()) && !desc.includes(searchQuery.toLowerCase())) return false;

        const sk = getStatusKey(item);
        if (statusFilter === "private")  return sk === "private";
        if (statusFilter === "public")   return sk === "approved";
        if (statusFilter === "pending")  return sk === "pending";
        if (statusFilter === "rejected") return sk === "rejected";
        return true;
      })
      .sort((a, b) => (SORT_ORDER[getStatusKey(a)] ?? 4) - (SORT_ORDER[getStatusKey(b)] ?? 4));
  };

  const filteredSets  = applyFilters(sets);
  const filteredPosts = applyFilters(posts);

  // ─── Render Rows ──────────────────────────────────────────────────────────

  const renderSetRow = (set: any) => {
    const setId = set._id || set.id;
    const statusKey = getStatusKey(set);
    const isPending  = statusKey === "pending";
    const isRejected = statusKey === "rejected";
    const isApproved = statusKey === "approved" && set.isPublic;
    const isPrivate  = statusKey === "private";

    return (
      <div
        key={setId}
        className={cn(
          "bg-white rounded-2xl border transition-all hover:shadow-md overflow-hidden",
          isPending  ? "border-amber-200 bg-amber-50/20" :
          isRejected ? "border-rose-200 bg-rose-50/10" :
          "border-slate-100"
        )}
      >
        {/* Main row */}
        <div className="px-5 py-4 flex items-center gap-4">
          {/* Status badge */}
          <div className="shrink-0 w-32">
            {renderStatusBadge(set, isPending)}
          </div>

          {/* Title + meta */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/vocabulary/${setId}`)}
          >
            <p className="font-bold text-slate-800 text-sm truncate hover:text-[#4648d4] transition-colors">
              {set.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {set.category} • {set.level} • {set.totalWords || 0} từ
            </p>
            {isRejected && set.moderationReason && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {set.moderationReason}
              </p>
            )}
            {isPending && (
              <p className="text-xs text-amber-600 mt-1">
                Đang trong hàng chờ duyệt. Bạn không thể sửa/xóa lúc này.
              </p>
            )}
          </div>

          {/* View button */}
          <button
            onClick={() => navigate(isApproved ? `/explore/${setId}` : `/vocabulary/${setId}`)}
            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shrink-0"
            title="Xem chi tiết bộ từ"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action bar (bottom strip) */}
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
          {/* Private → Submit for review */}
          {isPrivate && (
            <button
              onClick={() => handleMakePublic(setId)}
              title="Gửi kiểm duyệt để đăng công khai"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi kiểm duyệt
            </button>
          )}

          {/* Approved → Make Private */}
          {isApproved && (
            <button
              onClick={() => handleMakePrivate(setId)}
              title="Kéo về Riêng tư — bộ từ sẽ không còn hiển thị công khai"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Về Riêng tư
            </button>
          )}

          {/* Pending → Cancel / Retract */}
          {isPending && (
            <button
              onClick={() => handleCancelPending(setId)}
              title="Kéo về Riêng tư để chỉnh sửa nội dung — thao tác an toàn với cơ chế chống xung đột"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              Rút duyệt
            </button>
          )}

          {/* Rejected → Edit & Resubmit */}
          {isRejected && (
            <button
              onClick={() => navigate(`/vocabulary/${setId}/edit`)}
              title="Mở trang chỉnh sửa — sau khi sửa xong nhấn Lưu & Gửi duyệt lại"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Sửa & Gửi lại
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPostRow = (post: any) => {
    const postId = post._id || post.id;
    const statusKey = getStatusKey(post);
    const isPending  = statusKey === "pending";
    const isRejected = statusKey === "rejected";
    const isApproved = statusKey === "approved" && post.isPublic;

    return (
      <div
        key={postId}
        className={cn(
          "bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 hover:shadow-md transition-all",
          isPending  ? "border-amber-200 bg-amber-50/20" :
          isRejected ? "border-rose-200 bg-rose-50/10" :
          "border-slate-100"
        )}
      >
        {/* Status badge */}
        <div className="shrink-0 w-32">
          {renderStatusBadge(post, isPending)}
        </div>

        {/* Title + meta */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (isApproved) navigate(`/community/post/${postId}`);
          }}
        >
          <p className={cn(
            "font-bold text-sm truncate transition-colors",
            isApproved ? "text-slate-800 hover:text-[#4648d4] cursor-pointer" : "text-slate-700"
          )}>
            {post.title}
            {isApproved && <ExternalLink className="w-3 h-3 inline ml-1 text-slate-400" />}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {post.category} • {post.readingTime || 1} min read
          </p>
          {isRejected && post.moderationReason && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {post.moderationReason}
            </p>
          )}
          {isPending && (
            <p className="text-xs text-amber-600 mt-1">
              Đang trong hàng chờ duyệt.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isApproved && (
            <button
              onClick={() => handleSetPostPrivate(postId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              title="Kéo về bản nháp"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Về Nháp
            </button>
          )}
          {isRejected && (
            <button
              onClick={() => navigate(`/community/post/${postId}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
            >
              Sửa & Gửi lại
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4648d4] to-[#6900b3] rounded-3xl p-8 md:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Content Manager</h1>
            <p className="text-purple-100 mt-1 text-sm">Theo dõi trạng thái duyệt bộ từ vựng và bài viết của bạn.</p>
          </div>
          <button
            onClick={() => navigate(activeTab === "sets" ? "/vocabulary/new" : "/community/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#4648d4] rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "sets" ? "Tạo Bộ Từ Mới" : "Tạo Bài Viết Mới"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => handleSetTab("sets")}
          className={cn(
            "flex items-center gap-2 pb-4 px-1 font-bold text-sm transition-all border-b-2 cursor-pointer",
            activeTab === "sets"
              ? "border-[#4648d4] text-[#4648d4]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Bộ Từ Vựng ({sets.length})
        </button>
        <button
          onClick={() => handleSetTab("posts")}
          className={cn(
            "flex items-center gap-2 pb-4 px-1 font-bold text-sm transition-all border-b-2 cursor-pointer",
            activeTab === "posts"
              ? "border-[#4648d4] text-[#4648d4]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <FileText className="w-4 h-4" />
          Bài Viết ({posts.length})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên, tiêu đề..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-4 focus:ring-purple-100 transition-all text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold focus:border-[#4648d4] focus:ring-4 focus:ring-purple-100 outline-none bg-white cursor-pointer"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="public">Công khai</option>
          <option value="rejected">Bị từ chối</option>
          <option value="private">Riêng tư</option>
        </select>
      </div>

      {/* Note for pending */}
      {statusFilter === "all" && (activeTab === "sets" ? sets : posts).some(i => i.isPublic && i.moderationStatus === "pending") && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold">Bạn có nội dung đang chờ duyệt.</span>{" "}
            Trong lúc chờ, bạn không thể sửa hoặc xóa. Nếu muốn chỉnh sửa, hãy kéo về <strong>Riêng tư</strong> trước.
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Đang tải...</p>
        </div>
      ) : activeTab === "sets" ? (
        filteredSets.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy bộ từ nào</h3>
            <p className="text-slate-400 text-sm mt-1 mb-5">Thử thay đổi bộ lọc hoặc tạo bộ từ mới.</p>
            <button
              onClick={() => navigate("/vocabulary/new")}
              className="px-5 py-2 bg-purple-50 text-[#4648d4] hover:bg-purple-100 font-bold text-xs rounded-full transition-colors"
            >
              Tạo bộ từ vựng mới
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSets.map(renderSetRow)}
          </div>
        )
      ) : (
        filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy bài viết nào</h3>
            <p className="text-slate-400 text-sm mt-1 mb-5">Thử thay đổi bộ lọc hoặc tạo bài viết mới.</p>
            <button
              onClick={() => navigate("/community/new")}
              className="px-5 py-2 bg-purple-50 text-[#4648d4] hover:bg-purple-100 font-bold text-xs rounded-full transition-colors"
            >
              Tạo bài viết mới
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredPosts.map(renderPostRow)}
          </div>
        )
      )}
    </div>
  );
}

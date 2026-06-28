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
      const tabParam = activeTab === "all" ? "published" : "drafts";
      const res = await listAllPosts(currentPage, 10, tabParam, searchQuery.trim() || undefined);
      if (res.data?.success) {
        const list = res.data.data || [];
        if (activeTab === "all") {
          setAllPosts(list);
        } else {
          setPendingPosts(list);
        }
        const dataWithPagination = res.data as any;
        if (dataWithPagination.pagination) {
          setTotalPages(dataWithPagination.pagination.totalPages);
        } else {
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load community posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchPosts();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [activeTab, currentPage, searchQuery]);

  const handleApprove = async (postId: string) => {
    try {
      const res = await overridePostModeration({
        postId,
        status: "approved",
        reason: "Approved by Administrator"
      });
      if (res.data?.success) {
        toast.success("Community post approved!");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve post");
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
      toast.error("Please enter a rejection reason");
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
        toast.success("Post rejected successfully");
        setShowRejectModal(false);
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleHidePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to hide this post from the community feed (set to Private)?")) {
      return;
    }
    try {
      const res = await updatePost(postId, { isPublic: false });
      if (res.data?.success) {
        toast.success("Post set to private");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to hide post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await deletePost(postId);
      if (res.data?.success) {
        toast.success("Post deleted successfully!");
        fetchPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  // Render Status Badge helper
  const renderStatusBadge = (item: any) => {
    if (!item.isPublic) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
          <LockIcon className="w-3 h-3" />
          <span>Private</span>
        </span>
      );
    }

    switch (item.moderationStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
            <Globe className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filteredPosts = activeTab === "all" ? allPosts : pendingPosts;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Community Posts Management</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Moderate user posts or draft your own articles.</p>
        </div>
        <button
          onClick={() => navigate("/admin/posts/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1000a3] text-white rounded-full font-bold text-xs hover:scale-105 hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Post</span>
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
            All Posts
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
            <span>My Drafts</span>
            {pendingPosts.length > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-black leading-none">
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
            placeholder="Search by title, author..."
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
            <p className="text-slate-500 text-xs font-bold">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-600 text-sm">No posts found</h3>
            <p className="text-slate-400 text-xs mt-1">No posts match your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Post</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                              toast.error("This post is hidden or not approved and cannot be viewed publicly.");
                            }
                          }}
                        >
                          {post.title}
                          {post.isPublic && post.moderationStatus === "approved" && (
                            <ExternalLink className="w-3 h-3 text-slate-400 inline" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString("en-US")} • {post.readingTime || 1} min read
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
                          <span className="font-semibold text-slate-700">{post.author?.name || "Anonymous"}</span>
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
                              title="Approve Post"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(post._id || post.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Reject Post"
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
                            title="Hide Post (Set Private)"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/admin/posts/${post._id || post.id}/edit`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Edit Post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(post._id || post.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Post"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-400 font-semibold">
              Page {currentPage} of {totalPages}
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
            <h3 className="text-lg font-black text-slate-800 mb-2">Reject Post</h3>
            <p className="text-slate-400 text-xs mb-4">Please provide a reason for rejecting this post. The author will be notified.</p>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                placeholder="Enter rejection reason (e.g. spam, inappropriate content, etc.)"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-5 py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

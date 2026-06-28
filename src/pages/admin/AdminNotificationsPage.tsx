import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Flag,
  Bot,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowRight,
  ExternalLink,
  Mail,
  Tag,
  MessageSquare,
  User,
} from "lucide-react";
import { RootState, AppDispatch } from "../../store";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationThunk,
} from "../../store/slices/notificationSlice";
import { cn } from "../../lib/utils";

const formatFullTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US");
};

type AdminNotifFilter = "all" | "report" | "ai_moderation";

interface ExpandedReportData {
  category?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  message?: string;
}

export default function AdminNotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, loading, pagination, unreadCount } = useSelector(
    (state: RootState) => state.notification
  );

  const [activeTab, setActiveTab] = useState<AdminNotifFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page: currentPage,
        limit: itemsPerPage,
        type: activeTab === "all" ? undefined : activeTab,
      })
    );
  }, [dispatch, currentPage, activeTab]);

  // Filter to admin-relevant types only
  const adminNotifications = notifications.filter(
    (n) => n.type === "report" || n.type === "ai_moderation"
  );

  const handleTabChange = (tab: AdminNotifFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif._id));
    }

    if (notif.type === "ai_moderation") {
      navigate("/admin/moderation");
      return;
    }

    // For reports: expand inline
    if (notif.type === "report") {
      setExpandedId(expandedId === notif._id ? null : notif._id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteNotificationThunk(id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const tabs: { label: string; value: AdminNotifFilter; icon: React.ReactNode; color: string }[] = [
    {
      label: "All Alerts",
      value: "all",
      icon: <Shield className="w-4 h-4" />,
      color: "text-slate-600",
    },
    {
      label: "User Reports",
      value: "report",
      icon: <Flag className="w-4 h-4" />,
      color: "text-rose-500",
    },
    {
      label: "AI Moderation",
      value: "ai_moderation",
      icon: <Bot className="w-4 h-4" />,
      color: "text-violet-500",
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bug": return "bg-orange-50 text-orange-600 border-orange-100";
      case "content": return "bg-rose-50 text-rose-600 border-rose-100";
      case "abuse": return "bg-red-50 text-red-600 border-red-100";
      case "suggestion": return "bg-blue-50 text-blue-600 border-blue-100";
      case "other": return "bg-slate-50 text-slate-600 border-slate-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const renderNotificationCard = (notif: any) => {
    const isExpanded = expandedId === notif._id;
    const data: ExpandedReportData = notif.data || {};
    const isAiModeration = notif.type === "ai_moderation";
    const isReport = notif.type === "report";

    return (
      <div
        key={notif._id}
        className={cn(
          "bg-white border rounded-2xl overflow-hidden transition-all duration-300 group",
          !notif.isRead ? "border-l-4 shadow-sm" : "border-slate-100",
          !notif.isRead && isReport ? "border-l-rose-500 border-rose-100 bg-rose-50/5" : "",
          !notif.isRead && isAiModeration ? "border-l-violet-500 border-violet-100 bg-violet-50/5" : "",
          notif.isRead ? "opacity-90" : ""
        )}
      >
        {/* Main row */}
        <div
          onClick={() => handleNotificationClick(notif)}
          className={cn(
            "p-5 flex gap-4 transition-colors relative",
            isAiModeration ? "cursor-pointer hover:bg-violet-50/30" : "cursor-pointer hover:bg-rose-50/20"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
            isReport ? "bg-rose-50 border-rose-100" : "bg-violet-50 border-violet-100"
          )}>
            {isReport
              ? <Flag className="w-5 h-5 text-rose-500" />
              : <Bot className="w-5 h-5 text-violet-500" />
            }
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={cn(
                    "text-sm text-slate-800 leading-snug",
                    !notif.isRead ? "font-bold" : "font-semibold"
                  )}>
                    {notif.title}
                  </h4>
                  {isReport && data.category && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      getCategoryColor(data.category)
                    )}>
                      {data.category}
                    </span>
                  )}
                  {isAiModeration && data.moderationType && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-600">
                      {data.moderationType === "vocab" ? "Vocabulary" : "Posts"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>

                {/* AI stats */}
                {isAiModeration && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✅ {data.approved || 0} approved
                    </span>
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      ❌ {data.rejected || 0} rejected
                    </span>
                    <span className="text-xs text-slate-400">
                      {data.runType === "manual" ? "Manual run" : "Auto run"}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 mt-0.5" />
                )}
                <button
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-slate-400 font-medium" title={formatFullTime(notif.createdAt)}>
                {formatRelativeTime(notif.createdAt)}
              </span>
              {isReport && (
                <span className={cn(
                  "text-[11px] font-semibold flex items-center gap-1 transition-all",
                  isExpanded ? "text-rose-500" : "text-slate-400 group-hover:text-rose-500"
                )}>
                  {isExpanded ? "Collapse ↑" : "View details ↓"}
                </span>
              )}
              {isAiModeration && (
                <span className="text-[11px] text-violet-500 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Moderation Log
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded report detail */}
        {isReport && isExpanded && (
          <div className="border-t border-rose-100 bg-rose-50/30 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
              <Flag className="w-3.5 h-3.5" />
              Report Detail
            </div>

            {/* Sender info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.senderName && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-rose-100 px-3 py-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Name</span>
                    <p className="text-sm font-semibold text-slate-800">{data.senderName}</p>
                  </div>
                </div>
              )}
              {data.senderEmail && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-rose-100 px-3 py-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Email</span>
                    <p className="text-sm font-semibold text-slate-800 break-all">{data.senderEmail}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            {data.category && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500">Category:</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border",
                  getCategoryColor(data.category)
                )}>
                  {data.category}
                </span>
              </div>
            )}

            {/* Subject */}
            {data.subject && (
              <div className="bg-white rounded-xl border border-rose-100 p-3">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Subject</span>
                <p className="text-sm font-semibold text-slate-800">{data.subject}</p>
              </div>
            )}

            {/* Message */}
            {data.message && (
              <div className="bg-white rounded-xl border border-rose-100 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Message</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.message}</p>
              </div>
            )}

            <div className="text-[11px] text-slate-400 italic text-center pt-1">
              This is a read-only view. To respond, contact the user via email.
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
      {/* Banner Header */}
      <section className="relative w-full h-40 rounded-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-rose-600/20" />
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl" />

        <div className="relative h-full flex flex-col justify-center px-8 z-10 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Admin Notification Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Alerts & Reports</h1>
          <p className="text-slate-300/90 text-sm mt-0.5 max-w-lg">
            Monitor user reports and AI content moderation results.
          </p>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Unread</span>
          <p className="text-2xl font-extrabold text-purple-600 mt-0.5">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-50 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">User Reports</span>
          <p className="text-2xl font-extrabold text-rose-500 mt-0.5">
            {notifications.filter((n) => n.type === "report").length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-violet-50 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">AI Events</span>
          <p className="text-2xl font-extrabold text-violet-500 mt-0.5">
            {notifications.filter((n) => n.type === "ai_moderation").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Filter tabs */}
          <nav className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">
              Filter
            </span>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                  activeTab === tab.value
                    ? tab.value === "report"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-100"
                      : tab.value === "ai_moderation"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-100"
                      : "bg-slate-800 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  activeTab === tab.value ? "text-white" : tab.color
                )}>
                  {tab.icon}
                </span>
                <span className="font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Quick Actions
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
            <button
              onClick={() => navigate("/admin/moderation")}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Go to Moderation
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              {activeTab === "report" && <Flag className="w-4 h-4 text-rose-500" />}
              {activeTab === "ai_moderation" && <Bot className="w-4 h-4 text-violet-500" />}
              {activeTab === "all" && <Shield className="w-4 h-4 text-slate-500" />}
              <h3 className="font-bold text-slate-800 text-sm">
                {tabs.find((t) => t.value === activeTab)?.label}
              </h3>
            </div>
            {activeTab === "report" && (
              <span className="text-xs text-slate-400 italic">
                Click a report to expand details
              </span>
            )}
            {activeTab === "ai_moderation" && (
              <span className="text-xs text-slate-400 italic">
                Click any item to view moderation log
              </span>
            )}
          </div>

          {/* Cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : adminNotifications.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No notifications</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                {activeTab === "report"
                  ? "No user reports yet. Reports will appear here when users submit feedback."
                  : activeTab === "ai_moderation"
                  ? "No AI moderation events yet. Run moderation from the Content Moderation page."
                  : "No admin notifications yet. User reports and AI moderation results will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminNotifications.map((notif) => renderNotificationCard(notif))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-slate-500 font-semibold">
                Page {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

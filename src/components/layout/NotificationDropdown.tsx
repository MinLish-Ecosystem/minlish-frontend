import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bell, Flame, Trophy, Clock, Info, CheckCheck,
  Flag, Bot, ExternalLink
} from "lucide-react";
import { RootState, AppDispatch } from "../../store";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../store/slices/notificationSlice";
import { cn } from "../../lib/utils";

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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { notifications, unreadCount, loading } = useSelector(
    (state: RootState) => state.notification
  );

  // For admin: only show report and ai_moderation; for users: show all
  const filteredNotifications = isAdmin
    ? notifications.filter((n) => n.type === "report" || n.type === "ai_moderation")
    : notifications;

  const latestNotifications = filteredNotifications.slice(0, 5);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // ─── Open dropdown → fetch full list ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [isOpen, dispatch]);

  // ─── Smart polling: every 30s, only when tab is active ────────────────────
  useEffect(() => {
    const POLL_INTERVAL = 30_000; // 30 seconds

    const poll = async () => {
      // Only poll if the browser tab is visible
      if (document.visibilityState !== "visible") return;

      const prevCount = unreadCount;
      const result = await dispatch(fetchUnreadCount());

      // If new unread count is higher → new notification arrived
      if (result.payload && (result.payload as any).unreadCount > prevCount) {
        // If dropdown is open, also refresh full list immediately
        if (isOpen) {
          dispatch(fetchNotifications({ page: 1, limit: 20 }));
        }
      }
    };

    const intervalId = setInterval(poll, POLL_INTERVAL);

    // Also re-poll immediately when tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dispatch, unreadCount, isOpen]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif._id));
    }
    setIsOpen(false);

    const type = notif.type;
    const data = notif.data || {};

    if (isAdmin) {
      if (type === "ai_moderation") {
        // Navigate to content moderation scan log tab, highlight the specific log
        const outerType = data.moderationType === "post" ? "posts" : "sets";
        const logId = data.logId || "";
        const params = new URLSearchParams({ tab: "ai_logs", type: outerType });
        if (logId) params.set("highlightId", logId);
        navigate(`/admin/moderation?${params.toString()}`);
      } else if (type === "report") {
        // Navigate to admin notifications page, highlight the specific report
        navigate(`/admin/notifications?highlightId=${notif._id}`);
      }
      return;
    }

    // User navigation logic
    if (data.postId || type === "posts_interaction" || type === "post_moderation") {
      const postId = data.postId || (data.post && (data.post._id || data.post));
      if (postId) {
        navigate(`/community/post/${postId}`);
      } else {
        navigate("/community");
      }
    } else if (data.setId || type === "vocab_moderation") {
      const setId = data.setId || (data.set && (data.set._id || data.set));
      if (setId) {
        navigate(`/vocabulary/${setId}`);
      } else {
        navigate("/vocabulary");
      }
    } else if (type === "daily_reminder" || type === "review_due") {
      navigate("/dashboard");
    } else if (type === "streak_milestone" || type === "achievement") {
      navigate("/statistics");
    } else {
      navigate("/dashboard");
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(isAdmin ? "/admin/notifications" : "/notifications");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "report":
        return <Flag className="w-4 h-4 text-rose-500" />;
      case "ai_moderation":
        return <Bot className="w-4 h-4 text-violet-500" />;
      case "streak_milestone":
        return <Flame className="w-4 h-4 text-orange-500 fill-orange-100" />;
      case "achievement":
        return <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-100" />;
      case "daily_reminder":
      case "review_due":
        return <Clock className="w-4 h-4 text-purple-500 fill-purple-100" />;
      case "system":
      default:
        return <Info className="w-4 h-4 text-blue-500 fill-blue-100" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "report": return "bg-rose-50 border-rose-100";
      case "ai_moderation": return "bg-violet-50 border-violet-100";
      case "streak_milestone": return "bg-orange-50 border-orange-100";
      case "achievement": return "bg-yellow-50 border-yellow-100";
      case "daily_reminder":
      case "review_due": return "bg-purple-50 border-purple-100";
      default: return "bg-blue-50 border-blue-100";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative",
          isOpen && "bg-slate-100 text-purple-600"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[380px] bg-white/98 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <div className="p-1.5 bg-violet-100 rounded-lg">
                  <Bell className="w-3.5 h-3.5 text-violet-600" />
                </div>
              ) : (
                <Bell className="w-4 h-4 text-slate-500" />
              )}
              <h3 className="font-bold text-slate-800 text-sm">
                {isAdmin ? "Admin Notifications" : "Notifications"}
              </h3>
              {isAdmin && (
                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                  Reports & AI
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Loading notifications…</p>
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                  {isAdmin ? <Bot className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {isAdmin ? "No alerts yet" : "Inbox is empty"}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                  {isAdmin
                    ? "User reports and AI moderation results will appear here."
                    : "You'll receive notifications when there are learning reminders or new achievements."}
                </p>
              </div>
            ) : (
              latestNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-4 flex gap-3 transition-colors text-left relative group",
                    !notif.isRead && "bg-purple-50/20",
                    notif.type === "ai_moderation"
                      ? "cursor-pointer hover:bg-violet-50/50"
                      : notif.type === "report"
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-purple-50/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    getIconBg(notif.type)
                  )}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn(
                        "text-sm text-slate-800 leading-snug line-clamp-1",
                        !notif.isRead ? "font-bold" : "font-medium"
                      )}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 mt-0.5" />
                        )}
                        {notif.type === "ai_moderation" && (
                          <ExternalLink className="w-3 h-3 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      {notif.type === "report" && (
                        <span className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full font-semibold">
                          Read-only
                        </span>
                      )}
                      {notif.type === "ai_moderation" && (
                        <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          View logs →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              onClick={handleViewAll}
              className="text-xs text-slate-600 hover:text-purple-600 font-bold transition-colors w-full block py-1"
            >
              {isAdmin ? "View all admin notifications" : "View all notifications"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Bell, Flame, Trophy, Clock, Info, CheckCheck } from "lucide-react";
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

  if (diffSec < 10) return "Vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useAuth();
  const { notifications, unreadCount, loading } = useSelector(
    (state: RootState) => state.notification
  );

  // Lấy 5 thông báo mới nhất cho dropdown
  const latestNotifications = notifications.slice(0, 5);

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Fetch thông báo khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  }, [isOpen, dispatch]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif._id));
    }
    setIsOpen(false);

    // Xử lý điều hướng thông minh dựa trên type & data
    const type = notif.type;
    const data = notif.data || {};

    if (data.setId) {
      navigate(`/vocabulary/${data.setId}`);
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
    if (user?.role === "admin") {
      navigate("/admin/notifications");
    } else {
      navigate("/notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
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
        <div className="absolute right-0 mt-3 w-[360px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Đang tải thông báo...</p>
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Hộp thư trống</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Bạn sẽ nhận được thông báo khi có lịch ôn tập hoặc thành tích mới.
                </p>
              </div>
            ) : (
              latestNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-4 flex gap-3 cursor-pointer hover:bg-purple-50/50 transition-colors text-left relative",
                    !notif.isRead && "bg-purple-50/20"
                  )}
                >
                  {/* Icon Wrapper */}
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    {getIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p
                        className={cn(
                          "text-sm text-slate-800 leading-snug line-clamp-1",
                          !notif.isRead ? "font-bold" : "font-medium"
                        )}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
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
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

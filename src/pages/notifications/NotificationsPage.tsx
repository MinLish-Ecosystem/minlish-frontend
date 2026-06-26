import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Flame,
  Trophy,
  Clock,
  Info,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Inbox,
  Sparkles,
  BookOpen
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
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
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

  if (diffSec < 10) return "Vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

type NotifTypeFilter = "all" | "daily_reminder" | "review_due" | "streak_milestone" | "achievement" | "system";

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, loading, pagination, unreadCount } = useSelector(
    (state: RootState) => state.notification
  );

  const [activeTab, setActiveTab] = useState<NotifTypeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
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

  const handleTabChange = (tab: NotifTypeFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      dispatch(markNotificationRead(notif._id));
    }

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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteNotificationThunk(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "streak_milestone":
        return <Flame className="w-5 h-5 text-orange-500 fill-orange-100" />;
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-100" />;
      case "daily_reminder":
      case "review_due":
        return <Clock className="w-5 h-5 text-purple-500 fill-purple-100" />;
      case "system":
      default:
        return <Info className="w-5 h-5 text-blue-500 fill-blue-100" />;
    }
  };

  const tabs: { label: string; value: NotifTypeFilter; desc: string }[] = [
    { label: "Tất cả thông báo", value: "all", desc: "Xem mọi hoạt động trong hệ thống" },
    { label: "Nhắc nhở học tập", value: "daily_reminder", desc: "Giờ học và nhắc nhở hàng ngày" },
    { label: "Bài học đến hạn", value: "review_due", desc: "Từ vựng tới hạn cần ôn tập" },
    { label: "Cột mốc chuỗi học", value: "streak_milestone", desc: "Thành tích streak học tập" },
    { label: "Thành tựu đạt được", value: "achievement", desc: "Phần thưởng và bảng vàng danh dự" },
    { label: "Hệ thống thông tin", value: "system", desc: "Cập nhật, nâng cấp và chào mừng" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* Welcome & Banner Header Section */}
      <section className="relative w-full h-44 rounded-3xl overflow-hidden shadow-xl shadow-purple-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-[#883cd8] to-[#6a2cbd]" />
        {/* Blob Decor */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

        <div className="relative h-full flex flex-col justify-center px-8 md:px-12 z-10 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Inbox className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">HỘP THƯ TRỰC TUYẾN</span>
          </div>
          <h2 className="text-3xl font-extrabold mt-2 tracking-tight">Hộp thư Thông báo</h2>
          <p className="text-purple-100/90 text-sm mt-1 max-w-xl">
            Nơi tổng hợp toàn bộ lịch nhắc nhở học tập, thành tựu streak cá nhân và thông điệp từ hệ thống MinLish.
          </p>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Sidebar Filter & Widgets (col-span-4) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Statistical Widget */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-base">Tổng quan hoạt động</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#fcf8ff] p-4 rounded-2xl border border-purple-50/50 text-left">
                <span className="text-xs font-semibold text-slate-400">Chưa đọc</span>
                <p className="text-2xl font-extrabold text-purple-600 mt-1">{unreadCount}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                <span className="text-xs font-semibold text-slate-400">Trang hiện tại</span>
                <p className="text-2xl font-extrabold text-slate-700 mt-1">{currentPage}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-700 leading-snug">Duy trì học mỗi ngày</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Đừng quên kiểm tra lịch ôn tập để duy trì chuỗi ngày liên tiếp trên MinLish nhé!
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Filter Sidebar Menu */}
          <nav className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">Bộ lọc thư mục</span>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "w-full flex flex-col items-start px-4 py-3 rounded-2xl text-left transition-all duration-200 group",
                  activeTab === tab.value
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className="font-bold text-sm">{tab.label}</span>
                <span className={cn(
                  "text-[10px] mt-0.5 leading-none",
                  activeTab === tab.value ? "text-purple-200" : "text-slate-400 group-hover:text-slate-500"
                )}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Side: Main content area (col-span-8) */}
        <main className="lg:col-span-8 space-y-4">
          
          {/* Action Header */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm">
              Bộ lọc: <span className="text-purple-600">{tabs.find(t => t.value === activeTab)?.label}</span>
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100/80 text-purple-600 font-bold rounded-xl text-xs transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả thông báo
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="space-y-3">
            {loading ? (
              // Beautiful Skeletal loader
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/4" />
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty State
              <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-4 border border-purple-100">
                  <Bell className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy thông báo</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  Bạn không có thông báo nào trong thư mục này. Hãy tiếp tục học tập và các cột mốc sẽ tự động ghi nhận!
                </p>
              </div>
            ) : (
              // Notifications cards
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "bg-white border border-slate-100 rounded-2xl p-5 flex gap-4 cursor-pointer hover:-translate-y-[2px] hover:shadow-md transition-all duration-200 relative group text-left",
                      !notif.isRead ? "border-l-4 border-l-purple-600 bg-purple-50/10" : ""
                    )}
                  >
                    {/* Left Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      {getIcon(notif.type)}
                    </div>

                    {/* Middle Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            "text-base text-slate-800 leading-snug",
                            !notif.isRead ? "font-bold" : "font-semibold"
                          )}
                        >
                          {notif.title}
                        </h4>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-purple-600" />
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notif._id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-slate-400 font-medium" title={formatFullTime(notif.createdAt)}>
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        
                        <span className="text-purple-600 font-bold text-xs flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem chi tiết
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                Trước
              </button>

              <span className="text-xs text-slate-500 font-semibold">
                Trang {currentPage} / {pagination.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

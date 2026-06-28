import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  BookOpen,
  KeyRound,
  FileText
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { changePassword as changePasswordApi, verifyChangePassword as verifyChangePasswordApi } from "../../api/user.api";
import { toast } from "react-hot-toast";
import TextField from "../common/TextField";
import PasswordField from "../common/PasswordField";
import SubmitButton from "../common/SubmitButton";
import { ConfirmLogoutModal, ReportModal } from "../common";
import NotificationDropdown from "./NotificationDropdown";

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200",
      isActive 
        ? "bg-[#f0dbff] text-[#6900b3] shadow-sm" 
        : "text-slate-500 hover:bg-slate-100 hover:scale-[1.02]"
    )}
  >
    <Icon className={cn("w-5 h-5")} />
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown & Modal States
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [changePasswordStep, setChangePasswordStep] = useState<"form" | "otp">("form");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordOtp, setChangePasswordOtp] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTimer, setModalTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showChangePasswordModal && changePasswordStep === "otp" && modalTimer > 0) {
      interval = setInterval(() => {
        setModalTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showChangePasswordModal, changePasswordStep, modalTimer]);

  const handleResendChangePasswordMfa = async () => {
    if (modalTimer > 0) return;
    setModalLoading(true);
    try {
      const res = await changePasswordApi({ oldPassword, newPassword });
      if (res.data.success && res.data.data?.mfaRequired) {
        setModalTimer(60);
        toast.success("Mã OTP mới đã được gửi về email của bạn!");
      }
    } catch (err: any) {
      toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleBackToChangePasswordForm = () => {
    setChangePasswordStep("form");
    setChangePasswordOtp("");
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setChangePasswordStep("form");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordOtp("");
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordStep === "form") {
      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu mới nhập lại không khớp");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      setModalLoading(true);
      try {
        const res = await changePasswordApi({ oldPassword, newPassword });
        if (res.data.success) {
          if (res.data.data?.mfaRequired) {
            setChangePasswordStep("otp");
            setModalTimer(60);
            toast.success("Mã xác thực OTP đã được gửi về email của bạn");
          } else {
            toast.success("Đổi mật khẩu thành công!");
            closeChangePasswordModal();
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Đổi mật khẩu không thành công");
      } finally {
        setModalLoading(false);
      }
    } else {
      setModalLoading(true);
      try {
        const res = await verifyChangePasswordApi({ oldPassword, newPassword, otp: changePasswordOtp });
        if (res.data.success) {
          toast.success("Đổi mật khẩu thành công!");
          closeChangePasswordModal();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Mã OTP không chính xác");
      } finally {
        setModalLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#fcf8ff] font-sans antialiased text-[#0b1c30]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#c7c4d7]/40 flex flex-col p-4 z-40">
        {/* Header Logo */}
        <div className="flex items-center gap-3 px-4 py-6 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#2c2abc] flex items-center justify-center text-white shadow-lg shadow-blue-100 font-bold text-xl">
            M
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#1000a3] leading-none tracking-tight">MinLish Admin</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Aurora Learning</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/admin/users" icon={Users} label="User Management" />
          <SidebarItem to="/admin/vocabulary" icon={BookOpen} label="Public Sets" />
          <SidebarItem to="/admin/posts" icon={FileText} label="Public Posts" />
          <SidebarItem to="/admin/moderation" icon={ShieldCheck} label="Content Moderation" />
          <SidebarItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] hover:text-[#93000a] transition-all font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[64px] bg-white/80 backdrop-blur-md border-b border-[#c7c4d7]/40 flex items-center justify-between px-8 relative z-30">
          <div className="flex items-center gap-4 flex-1">
            <span className="font-bold text-[#1000a3] text-lg tracking-tight">Admin Suite</span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="relative">
              <button 
                onClick={() => setShowDropdown(prev => !prev)}
                className="flex items-center gap-3 pl-2 pr-4 py-1 rounded-full hover:bg-slate-100 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#1000a3]/20">
                  <img 
                    src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-[#1000a3] transition-colors hidden sm:block">
                  {user?.name || "Admin"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#1000a3] hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{user?.name || "Admin"}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{user?.email || "admin@minlish.com"}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-purple-50 text-[9px] font-bold text-purple-600 rounded-full">
                      Administrator
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowChangePasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-all cursor-pointer text-left"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer text-left border-t border-slate-50 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative overflow-x-hidden">
          {/* Glowing background decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1000a3]/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <Outlet />
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {changePasswordStep === "form" ? "Đổi mật khẩu Admin" : "Nhập mã OTP xác thực (MFA)"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {changePasswordStep === "form" 
                ? "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn." 
                : "Hệ thống đã gửi một mã OTP qua email của bạn để xác thực hành động này."}
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {changePasswordStep === "form" ? (
                <>
                  <PasswordField
                    id="admin-old-password"
                    label="Mật khẩu hiện tại"
                    value={oldPassword}
                    onChange={setOldPassword}
                    placeholder="••••••••"
                    required
                  />
                  <PasswordField
                    id="admin-new-password"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="••••••••"
                    required
                  />
                  <PasswordField
                    id="admin-confirm-password"
                    label="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <TextField
                    id="admin-mfa-otp"
                    label="Mã xác thực OTP"
                    type="text"
                    value={changePasswordOtp}
                    onChange={setChangePasswordOtp}
                    placeholder="Nhập mã OTP"
                    required
                  />
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <span>
                      {modalTimer > 0 ? (
                        <>Gửi lại mã sau <span className="text-purple-600 font-bold">{modalTimer}s</span></>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendChangePasswordMfa}
                          className="text-purple-600 hover:text-purple-700 hover:underline transition-all cursor-pointer font-bold bg-transparent border-0 p-0"
                        >
                          Gửi lại mã OTP
                        </button>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleBackToChangePasswordForm}
                      className="text-slate-500 hover:text-slate-800 hover:underline transition-all cursor-pointer bg-transparent border-0 p-0"
                    >
                      Quay lại nhập thông tin
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  className="px-5 py-2.5 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <SubmitButton
                  label={modalLoading ? "Đang xử lý..." : (changePasswordStep === "form" ? "Tiếp tục" : "Xác nhận OTP")}
                  loading={modalLoading}
                />
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Logout Modal */}
      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      {/* Support Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

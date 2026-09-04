import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import ScrollToTop from "../common/ScrollToTop";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BrainCircuit, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  Search,
  HelpCircle,
  Zap,
  FolderHeart,
  Mic
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import NotificationDropdown from "./NotificationDropdown";
import { ConfirmLogoutModal, ReportModal, AuraFloatingWidget, AuraLiveVoiceModal } from "../common";
import { useState } from "react";

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
      isActive 
        ? "bg-[#9c48ea] text-white shadow-lg shadow-purple-200" 
        : "text-slate-500 hover:bg-slate-100 hover:scale-[1.02]"
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Trang voice-chat đã có gấu bự giữa màn hình — ẩn widget Aura góc phải cho khỏi trùng
  const hideAuraWidget =
    location.pathname.startsWith('/voice-chat') || location.pathname.startsWith('/voice-ai');
  const { sets } = useSelector((state: RootState) => state.vocab);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartSession = () => {
    if (sets.length > 0) {
      navigate("/learn/session");
    } else {
      navigate("/vocabulary");
    }
  };

  return (
    <div className="flex h-screen bg-[#fcf8ff]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col p-4">
        <div className="flex items-center gap-3 px-4 py-6 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-6 h-6 fill-white/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">MinLish</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Aurora Learning</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/vocabulary" icon={BookOpen} label="Vocabulary" />
          <SidebarItem to="/community" icon={Users} label="Community" />
          <SidebarItem to="/my-content" icon={FolderHeart} label="My Content" />
          <SidebarItem to="/practice" icon={BrainCircuit} label="Practice" />
          <SidebarItem to="/voice-chat" icon={Mic} label="Voice AI" />
          <SidebarItem to="/statistics" icon={BarChart3} label="Statistics" />
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 relative z-30">
          <div className="hidden lg:flex items-center gap-8">
            <NavLink to="/dashboard" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Home</NavLink>
            <NavLink to="/vocabulary" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>My Library</NavLink>
            <NavLink to="/explore" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Explore</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <NotificationDropdown />
              <button 
                onClick={() => setShowReportModal(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                title="Gửi báo cáo / Góp ý"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleStartSession}
              className="bg-[#4648d4] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white/70" />
              Start Session
            </button>
            
            <div 
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-100 cursor-pointer hover:scale-105 transition-transform"
            >
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>


        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 overflow-x-hidden">
          <Outlet />
          <ScrollToTop />
        </main>
      </div>

      {/* Aura Robot Floating Assistant Widget & Voice Modal */}
      {!hideAuraWidget && <AuraFloatingWidget onOpenModal={() => setShowVoiceModal(true)} />}
      <AuraLiveVoiceModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />

      {/* Confirm Logout Modal */}
      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      {/* Quick Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

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
    HelpCircle,
    Zap,
    FolderHeart,
    Menu,
    X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import NotificationDropdown from "./NotificationDropdown";
import { ConfirmLogoutModal, ReportModal } from "../common";
import { useState, useEffect, useRef } from "react";

// Sidebar Item hỗ trợ shrink-0 và truncate chống vỡ chữ
const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 shrink-0",
            isActive
                ? "bg-[#9c48ea] text-white shadow-lg shadow-purple-200"
                : "text-slate-500 hover:bg-slate-100 hover:scale-[1.02]"
        )}
    >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="truncate">{label}</span>
    </NavLink>
);

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { sets } = useSelector((state: RootState) => state.vocab);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State quản lý Auto-Hiding Header khi cuộn trên Mobile
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const mainRef = useRef<HTMLElement>(null);
    const lastScrollY = useRef(0);

    // Tự động đóng Mobile Menu khi người dùng chuyển trang
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Logic lắng nghe cuộn trang của <main> để Ẩn/Hiện Header trên Mobile
    useEffect(() => {
        const mainElem = mainRef.current;
        if (!mainElem) return;

        const handleScroll = () => {
            const currentScrollY = mainElem.scrollTop;

            if (currentScrollY < 20) {
                setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY.current + 10) {
                setIsHeaderVisible(false); // Cuộn xuống -> Ẩn Header
            } else if (currentScrollY < lastScrollY.current - 10) {
                setIsHeaderVisible(true);  // Cuộn lên -> Hiện Header
            }

            lastScrollY.current = currentScrollY;
        };

        mainElem.addEventListener("scroll", handleScroll, { passive: true });
        return () => mainElem.removeEventListener("scroll", handleScroll);
    }, []);

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

    // Danh sách 4 Tab chính hiển thị dưới Bottom Navigation (Mobile)
    const navItems = [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/vocabulary", icon: BookOpen, label: "Vocabulary" },
        { to: "/practice", icon: BrainCircuit, label: "Practice" },
        { to: "/statistics", icon: BarChart3, label: "Stats" },
    ];

    return (
        <div className="flex h-screen bg-[#fcf8ff] overflow-hidden w-full relative">

            {/* 1. Backdrop Overlay (Nền mờ đen khi mở Drawer Sidebar trên Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* 2. Sidebar Responsive (Cố định 260px trên PC, Trượt Drawer trên Mobile/Tablet) */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col p-4 transition-transform duration-300 ease-in-out shrink-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex items-center justify-between px-2 py-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white shadow-lg shrink-0">
                            <Sparkles className="w-6 h-6 fill-white/20" />
                        </div>
                        <div className="truncate">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent truncate">MinLish</h1>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold truncate">Aurora Learning</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/vocabulary" icon={BookOpen} label="Vocabulary" />
                    <SidebarItem to="/community" icon={Users} label="Community" />
                    <SidebarItem to="/my-content" icon={FolderHeart} label="My Content" />
                    <SidebarItem to="/practice" icon={BrainCircuit} label="Practice" />
                    <SidebarItem to="/statistics" icon={BarChart3} label="Statistics" />
                </nav>

                <div className="pt-4 border-t border-slate-100 space-y-1.5 shrink-0">
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="truncate">Logout</span>
                    </button>
                </div>
            </aside>

            {/* 3. Main Content Container (Dùng flex-1 để tự nở lấp đầy màn hình còn lại) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Header Auto-Hiding trên Mobile, Cố định trên PC */}
                <header className={cn(
                    "h-[64px] sm:h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-30 shrink-0 transition-transform duration-300 ease-in-out w-full",
                    isHeaderVisible ? "translate-y-0" : "-translate-y-full lg:translate-y-0"
                )}>

                    <div className="flex items-center gap-3 min-w-0">
                        {/* Nút Hamburger ☰ mở menu (Chỉ hiện trên Mobile/Tablet < lg) */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Top links điều hướng (Chỉ hiện trên Laptop/Desktop >= lg) */}
                        <div className="hidden lg:flex items-center gap-8">
                            <NavLink to="/dashboard" className={({ isActive }) => cn("text-sm font-semibold transition-colors whitespace-nowrap", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Home</NavLink>
                            <NavLink to="/vocabulary" className={({ isActive }) => cn("text-sm font-semibold transition-colors whitespace-nowrap", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>My Library</NavLink>
                            <NavLink to="/explore" className={({ isActive }) => cn("text-sm font-semibold transition-colors whitespace-nowrap", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Explore</NavLink>
                        </div>
                    </div>

                    {/* Right Action Icons (Thông báo, Start Session, Avatar) */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-slate-200">
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
                            className="bg-[#4648d4] text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all flex items-center gap-1.5 sm:gap-2 shrink-0"
                        >
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white/70" />
                            <span className="hidden sm:inline">Start Session</span>
                            <span className="sm:hidden">Start</span>
                        </button>

                        <div
                            onClick={() => navigate("/settings")}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-purple-100 cursor-pointer hover:scale-105 transition-transform shrink-0"
                        >
                            <img
                                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                {/* 4. Vùng hiển thị nội dung trang chính (<main> gắn flex-1 và ref) */}
                <main
                    ref={mainRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-x-hidden min-w-0"
                >
                    <Outlet />
                    <ScrollToTop />
                </main>

                {/* 5. Bottom Navigation Bar dưới đáy màn hình (Chỉ hiện trên Mobile < md) */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center h-16 z-30 px-2 shadow-lg">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => cn(
                                    "flex flex-col items-center justify-center w-full h-full text-[10px] font-medium gap-1 transition-colors",
                                    isActive ? "text-[#9c48ea] font-bold" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Modals xác nhận Logout & Báo lỗi */}
            <ConfirmLogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </div>
    );
}
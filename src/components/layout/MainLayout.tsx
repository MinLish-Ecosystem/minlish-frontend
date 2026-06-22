import { Outlet, NavLink, useNavigate } from "react-router-dom";
import ScrollToTop from "../common/ScrollToTop";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  BrainCircuit, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  Search,
  Bell,
  Moon,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <SidebarItem to="/learning" icon={GraduationCap} label="Learning" />
          <SidebarItem to="/practice" icon={BrainCircuit} label="Practice" />
          <SidebarItem to="/statistics" icon={BarChart3} label="Statistics" />
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform mb-4">
            Upgrade to Pro
          </button>
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
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center w-full max-w-md bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-purple-300 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search vocabulary..." 
              className="bg-transparent border-none focus:ring-0 w-full text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="hidden lg:flex items-center gap-8 mx-8">
            <NavLink to="/dashboard" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Home</NavLink>
            <NavLink to="/vocabulary" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>My Library</NavLink>
            <NavLink to="/explore" className={({ isActive }) => cn("text-sm font-semibold transition-colors", isActive ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-slate-500 hover:text-slate-800")}>Explore</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Moon className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            
            <button className="bg-[#4648d4] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow">
              Start Session
            </button>
            
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-100 cursor-pointer hover:scale-105 transition-transform">
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"} 
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
    </div>
  );
}

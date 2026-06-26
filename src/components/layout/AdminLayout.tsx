import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  HelpCircle,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  BookOpen
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
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

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1">
          <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/admin/users" icon={Users} label="User Management" />
          <SidebarItem to="/admin/vocabulary" icon={BookOpen} label="Public Sets (Editor)" />
          <SidebarItem to="/admin/moderation" icon={ShieldCheck} label="Content Moderation" />
          <SidebarItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-1">
          <a
            href="mailto:support@minlish.com"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-all"
          >
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span>Support</span>
          </a>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] hover:text-[#93000a] transition-all font-semibold mt-1"
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
            
            {/* Search Box */}
            <div className="relative w-64 max-w-sm hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1000a3] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-[#1000a3] hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <button className="flex items-center gap-3 pl-2 pr-4 py-1 rounded-full hover:bg-slate-100 transition-all group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#1000a3]/20">
                <img 
                  src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8EiSHoShAVUl-oFFCQAIn-L22uLfG6lveyk76uAbGEQORx6ZIOr9g-2Z040hpiatVYvGDIMXhA-8BeRu3ps8FSWkfUSUrcvX02l_44upt_vwzaaVm-AxRXppKeNAVYgknC0bIc1s6weZlxjPNXx7QTKYXd6zpOAUZiszVHbypMZ_GIVniWZkE-5rrvnnV8Lu64-YeSL1Igl44zHn0k04dGmgBaacbP42n9Ga4gvA9ctzhnSKSpVYiJuUwpsa3AfD8dBy3v7y6Tck"} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-[#1000a3] transition-colors hidden sm:block">
                {user?.name || "Admin"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#1000a3] hidden sm:block" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative overflow-x-hidden">
          {/* Glowing background decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1000a3]/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

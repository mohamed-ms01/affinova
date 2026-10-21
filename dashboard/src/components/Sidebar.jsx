import React from 'react';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Wallet,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'links', label: 'My Links', icon: Link2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Icon-Only Sidebar (~72px wide, rounded-pill 28px, margin from edge) */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 flex flex-col justify-between items-center w-[72px] py-6 rounded-pill border shadow-glass transition-all duration-300
          bg-[#0e131a] border-white/[0.08] text-slate-400
          dark:bg-[#0e131a] dark:border-white/[0.08] dark:text-slate-400
          light:bg-white light:border-slate-200 light:text-slate-600
          ${mobileOpen ? 'translate-x-0' : '-translate-x-28 md:translate-x-0'}
        `}
      >
        {/* Brand Icon Top */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-11 h-11 rounded-xl bg-[#0e131a] border border-[#2ee6a6]/30 p-1.5 flex items-center justify-center shadow-glow-teal hover:scale-105 transition-transform overflow-hidden"
            title="Affinova Dashboard"
          >
            <img src="/logo.png" alt="Affinova" className="w-full h-full object-contain" />
          </button>

          {/* Navigation Items (Icons only with Tooltips) */}
          <nav className="flex flex-col items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="sidebar-icon-wrap relative flex items-center justify-center">
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-[#2ee6a6]/15 text-[#2ee6a6] border border-[#2ee6a6]/30 shadow-glow-teal'
                        : 'hover:bg-white/[0.06] hover:text-white dark:hover:bg-white/[0.06] dark:hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900'
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>

                  {/* Tooltip on Hover */}
                  <span className="sidebar-tooltip bg-[#141b24] text-white border border-white/10 dark:bg-[#141b24] dark:text-white light:bg-slate-900 light:text-white">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Pinned Controls (Help & User Avatar) */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
          {/* Help Action */}
          <div className="sidebar-icon-wrap relative flex items-center justify-center">
            <a
              href="/help.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.06] hover:text-white transition-colors"
              aria-label="Documentation & Help"
            >
              <HelpCircle className="w-5 h-5" />
            </a>
            <span className="sidebar-tooltip bg-[#141b24] text-white border border-white/10">
              Help Center
            </span>
          </div>

          {/* User Avatar Circle */}
          <div className="sidebar-icon-wrap relative flex items-center justify-center">
            <button
              onClick={() => setActiveTab('settings')}
              className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c8cff] to-[#2ee6a6] p-[2px] transition-transform hover:scale-105"
              aria-label="Account Settings"
            >
              <div className="w-full h-full rounded-full bg-[#0e131a] flex items-center justify-center font-bold text-xs text-white uppercase overflow-hidden">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#2ee6a6] ring-2 ring-[#0e131a]" />
            </button>
            <span className="sidebar-tooltip bg-[#141b24] text-white border border-white/10">
              {user?.full_name || 'My Account'}
            </span>
          </div>

          {/* Logout Action */}
          <div className="sidebar-icon-wrap relative flex items-center justify-center">
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-colors"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <span className="sidebar-tooltip bg-rose-950 text-rose-200 border border-rose-800">
              Log Out
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

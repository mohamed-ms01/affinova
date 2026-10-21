import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  BellOff
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Topbar({ activeTab, setMobileOpen, onOpenCreateLink }) {
  const { theme, toggleTheme } = useTheme();
  const { user, token } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchNotifs() {
      if (!token) return;
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data || []);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    fetchNotifs();
  }, [token]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n =>
          fetch(`/api/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const tabTitles = {
    dashboard: 'Dashboard Overview',
    links: 'Smart Link Management',
    analytics: 'Performance Analytics',
    payments: 'Payouts & Balance',
    reports: 'Financial & Conversion Reports',
    settings: 'Account Settings & Preferences'
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 backdrop-blur-xl border-b transition-colors
      bg-[#0b0f14]/80 border-white/[0.08] text-white
      dark:bg-[#0b0f14]/80 dark:border-white/[0.08] dark:text-white
      light:bg-white/80 light:border-slate-200 light:text-slate-900
    ">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl border border-white/10 md:hidden hover:bg-white/5"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Affinova</span>
            <span>/</span>
            <span className="text-[#2ee6a6] capitalize">{activeTab}</span>
          </div>
          <h1 className="text-xl font-bold font-heading">
            {tabTitles[activeTab] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Action: New Link */}
        <button
          onClick={onOpenCreateLink}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Link</span>
        </button>

        {/* Plan Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2ee6a6]/10 border border-[#2ee6a6]/30 text-[#2ee6a6]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{user?.plan || 'Starter'} Plan</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 flex items-center justify-center hover:bg-white/5 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-300 dark:text-slate-300 light:text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2ee6a6]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border shadow-xl p-4 z-50 glass-panel animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
                <span className="text-sm font-bold font-heading">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#2ee6a6] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                  <BellOff className="w-5 h-5 text-slate-600" />
                  <span>No notifications yet</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        n.is_read
                          ? 'bg-white/[0.02] border-transparent opacity-75'
                          : 'bg-white/[0.05] border-[#2ee6a6]/20'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#2ee6a6] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                        <div className="text-[11px] text-slate-400 break-words">{n.body}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Animated Sun / Moon Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 flex items-center justify-center hover:bg-white/5 transition-transform hover:scale-105"
          aria-label="Toggle dark/light mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#ffb020] transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Back to Public Site link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 hover:bg-white/5 text-slate-400 hover:text-white"
          title="View Public Site"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CreateLinkModal from './components/CreateLinkModal';
import RequestPayoutModal from './components/RequestPayoutModal';
import ChangePlanModal from './components/ChangePlanModal';
import DashboardHome from './pages/DashboardHome';
import MyLinks from './pages/MyLinks';
import Analytics from './pages/Analytics';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import ProfileSettings from './pages/ProfileSettings';

// ─── Payment Gate Overlay ────────────────────────────────────────────────────
function PaymentGate({ onOpenPlan }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f14]/95 backdrop-blur-md">
      <div className="relative max-w-md w-full mx-4 rounded-2xl border border-[#2ee6a6]/30 bg-[#111827] shadow-2xl p-8 flex flex-col items-center gap-6 text-center">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-[#2ee6a6]/10 blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#2ee6a6]/10 flex items-center justify-center border border-[#2ee6a6]/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2ee6a6" strokeWidth="1.8" className="w-8 h-8">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-4 0v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <circle cx="12" cy="12" r="1" fill="#2ee6a6" />
          </svg>
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Activate Your Subscription</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your account is on the <span className="text-[#2ee6a6] font-semibold">Starter (Free)</span> plan.
            Choose a paid plan to unlock your affiliate dashboard, smart links, and earnings tracking.
          </p>
        </div>

        {/* Plan highlights */}
        <div className="w-full grid grid-cols-2 gap-3 text-left">
          {[
            { icon: '🔗', text: 'Unlimited Smart Links', plan: 'Pro' },
            { icon: '📊', text: 'Live Analytics', plan: 'Pro' },
            { icon: '💸', text: 'UPI / Bank Payouts', plan: 'Pro' },
            { icon: '🤖', text: 'Affiliate Auto-Tagging', plan: 'Pro' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2 bg-[#0b0f14] rounded-lg p-3 border border-white/5">
              <span className="text-lg">{f.icon}</span>
              <div>
                <div className="text-xs text-slate-300 font-medium">{f.text}</div>
                <div className="text-[10px] text-[#2ee6a6]">{f.plan}+</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onOpenPlan}
          className="w-full py-3 rounded-xl bg-[#2ee6a6] text-[#0b0f14] font-bold text-sm tracking-wide hover:bg-[#25c98f] transition-colors"
        >
          Upgrade Now — Starting ₹249/month
        </button>
        <p className="text-xs text-slate-500">
          Cancel anytime · No hidden charges · Instant activation
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard App ───────────────────────────────────────────────────────
function DashboardApp() {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [links, setLinks] = useState([]);

  // Payment gate state
  const [hasPaid, setHasPaid] = useState(null); // null = checking, true/false = resolved

  // Modals
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const fetchLinks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/links', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  // Check payment status when user is loaded
  const checkPaymentStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/payments/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasPaid(data.has_paid);
      } else {
        // If the endpoint fails, allow access (don't block unnecessarily)
        setHasPaid(true);
      }
    } catch {
      setHasPaid(true); // Network error — allow access gracefully
    }
  };

  useEffect(() => {
    fetchLinks();
    checkPaymentStatus();
  }, [token]);

  // Re-check payment status when plan modal closes (user might have just paid)
  const handlePlanModalClose = () => {
    setIsPlanOpen(false);
    checkPaymentStatus();
    fetchLinks();
  };

  if (loading || hasPaid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#2ee6a6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Authenticating Publisher Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f8fafc] dark:bg-[#0b0f14] dark:text-[#f8fafc] light:bg-[#f8fafc] light:text-[#0f172a] transition-colors duration-300">
      {/* Payment Gate — blocks dashboard if user hasn't paid */}
      {!hasPaid && (
        <PaymentGate onOpenPlan={() => setIsPlanOpen(true)} />
      )}

      {/* PART 4: Compact Floating Icon-Only Sidebar (~72px wide, 28px rounded pill) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area (Offset by 88px on md+ screens for floating sidebar) */}
      <div className="md:pl-[104px] flex flex-col min-h-screen transition-all">
        {/* Topbar */}
        <Topbar
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          onOpenCreateLink={() => setIsCreateLinkOpen(true)}
        />

        {/* Dynamic Section Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardHome
              links={links}
              onOpenCreateLink={() => setIsCreateLinkOpen(true)}
              onOpenPayout={() => setIsPayoutOpen(true)}
              onOpenPlan={() => setIsPlanOpen(true)}
            />
          )}

          {activeTab === 'links' && (
            <MyLinks
              links={links}
              onOpenCreateLink={() => setIsCreateLinkOpen(true)}
              onRefreshLinks={fetchLinks}
            />
          )}

          {activeTab === 'analytics' && <Analytics />}

          {activeTab === 'payments' && (
            <Payments
              onOpenPayout={() => setIsPayoutOpen(true)}
              onOpenPlan={() => setIsPlanOpen(true)}
            />
          )}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'settings' && (
            <ProfileSettings onOpenPlan={() => setIsPlanOpen(true)} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateLinkModal
        isOpen={isCreateLinkOpen}
        onClose={() => setIsCreateLinkOpen(false)}
        onLinkCreated={(newLink) => {
          setLinks(prev => [newLink, ...prev]);
        }}
      />

      <RequestPayoutModal
        isOpen={isPayoutOpen}
        onClose={() => setIsPayoutOpen(false)}
        availableBalance={user?.available_balance || 0}
        onPayoutRequested={() => {
          fetchLinks();
        }}
      />

      <ChangePlanModal
        isOpen={isPlanOpen}
        onClose={handlePlanModalClose}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

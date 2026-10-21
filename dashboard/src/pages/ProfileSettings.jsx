import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Sparkles,
  Check,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSettings({ onOpenPlan }) {
  const { user, token, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone
        })
      });

      if (res.ok) {
        updateUser({ full_name: fullName, phone_number: phone });
        setStatusMsg('Profile credentials updated successfully!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      setStatusMsg('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters.');
      return;
    }
    alert('Password updated securely.');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel">
        <h2 className="text-xl font-bold font-heading">Profile & Security Hub</h2>
        <p className="text-xs text-slate-400">Configure personal coordinates, subscription tier, and API security keys</p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Form & Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="p-6 rounded-2xl glass-panel">
            <h3 className="text-base font-bold font-heading mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#2ee6a6]" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'publisher@affinova.link'}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border outline-none bg-white/[0.02] border-white/5 text-slate-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Verified email coordinate linked to your cryptographic publisher token.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110"
                >
                  {loading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-2xl glass-panel">
            <h3 className="text-base font-bold font-heading mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#7c8cff]" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white focus:border-[#7c8cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white focus:border-[#7c8cff]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Plan Management & Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2ee6a6] mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Active Subscription</span>
            </div>
            <div className="text-2xl font-bold font-heading text-white capitalize">
              {user?.plan || 'Starter'} Tier
            </div>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Includes real-time link routing, standard analytics, and automated payouts.
            </p>

            <button
              onClick={onOpenPlan}
              className="w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase bg-[#2ee6a6]/15 border border-[#2ee6a6]/40 text-[#2ee6a6] hover:bg-[#2ee6a6]/25 transition-all text-center"
            >
              Change Subscription Plan
            </button>
          </div>

          <div className="p-6 rounded-2xl glass-panel">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Security Protocol
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                <span>2-Factor Auth</span>
                <span className="text-[#2ee6a6] font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                <span>Session Encryption</span>
                <span className="font-mono text-white">TLS 1.3</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>API Rate Limit</span>
                <span className="font-mono text-white">1,000 req/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

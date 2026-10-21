import React, { useState, useEffect } from 'react';
import {
  MousePointerClick,
  ShoppingBag,
  IndianRupee,
  Wallet,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Link as LinkIcon,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardHome({ onOpenCreateLink, onOpenPayout, onOpenPlan, links = [] }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    total_clicks: 0,
    total_orders: 0,
    gross_earnings: 0.0,
    available_balance: 0.0,
  });
  const [copiedId, setCopiedId] = useState(null);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickCampaign, setQuickCampaign] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!token) return;
      try {
        const res = await fetch('/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch summary stats:', err);
      }
    }
    fetchStats();
  }, [token, links]);

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyGeneratedLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(`https://affinova.link/${generatedLink.slug}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  const handleQuickGenerate = async (e) => {
    e.preventDefault();
    if (!quickUrl) return;
    setQuickLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quickCampaign || 'Quick Generated Smart Link',
          destination_url: quickUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data);
        setQuickUrl('');
        setQuickCampaign('');
        // Refresh page stats after 500ms
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickLoading(false);
    }
  };

  // Format member since date dynamically
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Jan 2026';

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar Photo */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2ee6a6] to-[#7c8cff] p-[2px] shadow-glow-teal flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#0e131a] flex items-center justify-center font-heading font-extrabold text-2xl text-white uppercase overflow-hidden">
              {user?.full_name ? user.full_name.charAt(0) : 'A'}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#2ee6a6] ring-2 ring-[#0e131a]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading">{user?.full_name || 'Publisher'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#2ee6a6]/15 text-[#2ee6a6] border border-[#2ee6a6]/30">
                {user?.plan || 'Starter'} Tier
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'publisher@affinova.link'}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since {memberSince}
              </span>
              <span>•</span>
              <span className="text-[#2ee6a6] font-semibold">{links.length} Active Links</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenPlan}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 hover:border-white/20 bg-white/5 transition-all text-slate-300 hover:text-white"
          >
            Upgrade Plan
          </button>
          <button
            onClick={onOpenPayout}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 transition-all"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clicks */}
        <div className="p-5 rounded-2xl glass-panel relative group hover:border-[#2ee6a6]/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6]">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-white font-mono">
            {stats.total_clicks.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#2ee6a6]" />
            <span className="text-[#2ee6a6] font-semibold">Real-time edge verified</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="p-5 rounded-2xl glass-panel relative group hover:border-[#7c8cff]/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Orders</span>
            <div className="p-2 rounded-xl bg-[#7c8cff]/10 text-[#7c8cff]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-white font-mono">
            {stats.total_orders.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Server postback attributions</span>
          </div>
        </div>

        {/* Card 3: Earnings */}
        <div className="p-5 rounded-2xl glass-panel relative group hover:border-[#2ee6a6]/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Commission</span>
            <div className="p-2 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-white font-mono">
            ₹{stats.gross_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">100% Transparent ledger</span>
          </div>
        </div>

        {/* Card 4: Available Balance */}
        <div className="p-5 rounded-2xl glass-panel relative group hover:border-[#ffb020]/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
            <div className="p-2 rounded-xl bg-[#ffb020]/10 text-[#ffb020]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-white font-mono text-[#ffb020]">
            ₹{stats.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Settled &amp; ready</span>
            <button onClick={onOpenPayout} className="text-[#2ee6a6] hover:underline text-[11px] font-semibold">
              Withdraw &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ===== AFFILIATE LINK GENERATOR — Large Prominent Card ===== */}
      <div className="p-6 rounded-2xl glass-panel border border-[#2ee6a6]/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base font-heading text-white">Affiliate Link Generator</h3>
            <p className="text-xs text-slate-400">Paste any destination URL to create your tracked Affinova smart link</p>
          </div>
        </div>

        <form onSubmit={handleQuickGenerate} className="mt-5 flex flex-col gap-3">
          {/* Destination URL */}
          <div className="relative">
            <LinkIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="url"
              placeholder="https://example.com/product?ref=affiliate"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border outline-none font-mono
                bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6] transition-colors
                placeholder:text-slate-600"
              required
            />
          </div>

          {/* Campaign Name */}
          <div className="relative">
            <Sparkles className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Campaign name (optional) — e.g. Summer Sale 2025"
              value={quickCampaign}
              onChange={(e) => setQuickCampaign(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border outline-none
                bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6] transition-colors
                placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={quickLoading}
            className="w-full sm:w-auto self-end px-8 py-3 rounded-xl text-sm font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {quickLoading ? '⚡ Generating...' : '⚡ Generate Smart Link'}
          </button>
        </form>

        {/* Generated Link Result */}
        {generatedLink && (
          <div className="mt-4 p-4 rounded-xl bg-[#2ee6a6]/5 border border-[#2ee6a6]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Your Smart Link</div>
              <div className="font-mono text-[#2ee6a6] text-sm font-semibold">
                https://affinova.link/{generatedLink.slug}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyGeneratedLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#2ee6a6]/15 border border-[#2ee6a6]/40 text-[#2ee6a6] hover:bg-[#2ee6a6]/25 transition-all"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`https://affinova.link/${generatedLink.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Show most recent link if no new one generated */}
        {!generatedLink && links.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Last Generated</div>
              <div className="font-mono text-slate-300 text-xs">https://affinova.link/{links[0].slug}</div>
            </div>
            <button
              onClick={() => copyToClipboard(`https://affinova.link/${links[0].slug}`, 'last')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Copy last link"
            >
              {copiedId === 'last' ? <Check className="w-3.5 h-3.5 text-[#2ee6a6]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-2xl glass-panel p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
          <div>
            <h3 className="font-bold text-base font-heading">Recent Smart Links</h3>
            <p className="text-xs text-slate-400">Deployed campaigns routing through India affiliate network</p>
          </div>
          <button
            onClick={onOpenCreateLink}
            className="text-xs text-[#2ee6a6] font-semibold hover:underline flex items-center gap-1"
          >
            <span>+ Create Custom Link</span>
          </button>
        </div>

        {/* Links Table or Clean Empty State */}
        {links.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500 mb-3">
              <LinkIcon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-300">No affiliate links deployed yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Paste a URL in the generator above or create your first smart link to start tracking real-time click attributions.
            </p>
            <button
              onClick={onOpenCreateLink}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2ee6a6]/15 border border-[#2ee6a6]/40 text-[#2ee6a6] hover:bg-[#2ee6a6]/25"
            >
              Generate First Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3 pl-2">Campaign Title</th>
                  <th className="pb-3">Smart Short URL</th>
                  <th className="pb-3 text-center">Clicks</th>
                  <th className="pb-3 text-center">Orders</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {links.slice(0, 5).map((link) => (
                  <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-2 font-medium text-white max-w-[200px] truncate">
                      {link.title}
                    </td>
                    <td className="py-3.5 font-mono text-[#2ee6a6]">
                      <div className="flex items-center gap-2">
                        <span>affinova.link/{link.slug}</span>
                        <button
                          onClick={() => copyToClipboard(`https://affinova.link/${link.slug}`, link.id)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Copy Link"
                        >
                          {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-[#2ee6a6]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold">
                      {link.clicks || 0}
                    </td>
                    <td className="py-3.5 text-center font-mono">
                      {link.orders || 0}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2ee6a6]/10 text-[#2ee6a6] border border-[#2ee6a6]/30">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

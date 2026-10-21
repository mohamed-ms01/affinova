import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  ShieldCheck,
  X,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MyLinks({ links = [], onOpenCreateLink, onRefreshLinks }) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [qrModalLink, setQrModalLink] = useState(null);

  const filteredLinks = links.filter(l =>
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.destination_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (slug, id) => {
    // Current host or localhost
    const origin = window.location.origin;
    const fullUrl = `${origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this affiliate link?')) return;
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshLinks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel">
        <div>
          <h2 className="text-xl font-bold font-heading">Affiliate Product Links</h2>
          <p className="text-xs text-slate-400">
            Real Amazon & Flipkart product links with automated tracking, live redirection, and earnings accumulation.
          </p>
        </div>
        <button
          onClick={onOpenCreateLink}
          className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Affiliate Link</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Amazon, Flipkart, or custom product campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border outline-none
              bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]
            "
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredLinks.length} of {links.length} Links
        </div>
      </div>

      {/* Links Table */}
      <div className="rounded-2xl glass-panel p-6 overflow-hidden">
        {filteredLinks.length === 0 ? (
          <div className="py-16 text-center">
            <LinkIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-slate-300">No affiliate links found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
              Paste an Amazon or Flipkart link to start tracking real clicks and simulated commissions!
            </p>
            <button
              onClick={onOpenCreateLink}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 text-[#2ee6a6]"
            >
              Generate First Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3 pl-2">Product / Campaign</th>
                  <th className="pb-3">Live Tracking URL</th>
                  <th className="pb-3 text-center">Platform</th>
                  <th className="pb-3 text-center">Clicks</th>
                  <th className="pb-3 text-center">Orders</th>
                  <th className="pb-3 text-right">Earnings</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLinks.map((link) => {
                  const isAmazon = link.platform === 'amazon';
                  const isFlipkart = link.platform === 'flipkart';

                  return (
                    <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          {link.product_image ? (
                            <img
                              src={link.product_image}
                              alt={link.title}
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0 bg-white/5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              {isAmazon ? (
                                <ShoppingCart className="w-5 h-5 text-amber-400" />
                              ) : isFlipkart ? (
                                <ShoppingBag className="w-5 h-5 text-sky-400" />
                              ) : (
                                <LinkIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          )}

                          <div className="max-w-[220px]">
                            <div className="font-semibold text-white truncate" title={link.title}>
                              {link.title}
                            </div>
                            {link.product_price > 0 && (
                              <div className="text-[11px] font-mono text-slate-400">
                                ₹{link.product_price.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Live Tracking URL */}
                      <td className="py-4 font-mono text-[#2ee6a6]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px]">/r/{link.slug}</span>
                          <button
                            onClick={() => copyToClipboard(link.slug, link.id)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Copy Live Link"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-[#2ee6a6]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Platform Badge */}
                      <td className="py-4 text-center">
                        {isAmazon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Amazon
                          </span>
                        ) : isFlipkart ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            Flipkart
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                            Custom
                          </span>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="py-4 text-center font-mono font-bold text-white">
                        {link.clicks || 0}
                      </td>

                      {/* Orders */}
                      <td className="py-4 text-center font-mono font-bold text-white">
                        {link.orders || 0}
                      </td>

                      {/* Earnings */}
                      <td className="py-4 text-right font-mono font-bold text-[#2ee6a6]">
                        ₹{(link.earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Click & Test Button */}
                          <a
                            href={`/r/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setTimeout(onRefreshLinks, 1000)}
                            className="px-2.5 py-1 rounded-lg border border-[#2ee6a6]/30 bg-[#2ee6a6]/10 text-[#2ee6a6] hover:bg-[#2ee6a6]/20 text-[11px] font-semibold flex items-center gap-1 transition-all"
                            title="Click to trigger real product redirection & earn commission"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Visit</span>
                          </a>

                          <button
                            onClick={() => setQrModalLink(link)}
                            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Show QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400"
                            title="Delete Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-xs rounded-2xl border p-6 text-center glass-panel bg-[#141b24] border-white/10 text-white">
            <button onClick={() => setQrModalLink(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-sm mb-1">{qrModalLink.title}</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">/r/{qrModalLink.slug}</p>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}/r/${qrModalLink.slug}`
                )}`}
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>

            <button
              onClick={() => copyToClipboard(qrModalLink.slug, qrModalLink.id)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-[#2ee6a6] text-[#07090e]"
            >
              Copy Link URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
